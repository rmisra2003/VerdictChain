"""Investigation graph generation and retrieval endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import enforce_ai_rate_limit
from app.api.deps import get_current_user
from app.repositories.repository import (
    case_repo,
    evidence_analysis_repo,
    evidence_repo,
    graph_repo,
    proof_repo,
)
from app.schemas.schemas import GraphResponse
from app.services.deepseek_service import deepseek_service
from app.services.walrus_service import walrus_service
from app.utils.audit import log_action

router = APIRouter(prefix="/graph", tags=["Graph"])


@router.post("/generate", response_model=GraphResponse, status_code=status.HTTP_201_CREATED)
async def generate_graph(
    request: Request,
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Generate an investigation entity-relationship graph for a case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await enforce_ai_rate_limit(request, current_user.id)

    evidences = await evidence_repo.get_by_case(db, case_id)
    analyses = await evidence_analysis_repo.get_by_case(db, case_id)
    proofs = await proof_repo.get_by_case(db, case_id)
    analysis_by_evidence = {str(item.evidence_id): item for item in analyses}
    proofs_by_evidence: dict[str, list] = {}
    for proof in proofs:
        proofs_by_evidence.setdefault(str(proof.evidence_id), []).append(proof)

    evidence_list = [
        {
            "id": str(e.id),
            "filename": e.filename,
            "file_type": e.file_type,
            "sha256_hash": e.sha256_hash,
            "walrus_blob_id": e.walrus_blob_id,
            "verification_status": e.verification_status,
            "created_at": str(e.created_at),
            "analysis": _analysis_for_prompt(analysis_by_evidence.get(str(e.id))),
        }
        for e in evidences
    ]

    # Build a readable, deterministic custody graph first.
    base_graph = _build_custody_graph(
        case=case,
        evidence_list=evidence_list,
        analysis_by_evidence=analysis_by_evidence,
        proofs_by_evidence=proofs_by_evidence,
    )

    # Ask DeepSeek for extra semantic links using extracted evidence intelligence.
    entities: list[dict] = []
    for analysis in analyses:
        entities.append(analysis.entities_json or {})

    graph_json = base_graph
    try:
        ai_graph = await deepseek_service.generate_graph_data(entities, evidence_list)
        graph_json = _merge_graphs(base_graph, ai_graph)
    except Exception:
        # Base graph is enough to keep the product useful even when AI is slow.
        graph_json = base_graph

    # Store snapshot in Walrus
    try:
        walrus_blob_id = await walrus_service.upload_json(graph_json)
    except Exception:
        walrus_blob_id = None

    # Save to database
    graph = await graph_repo.create(db, {
        "case_id": case_id,
        "walrus_blob_id": walrus_blob_id,
        "graph_json": graph_json,
    })

    await log_action(
        db,
        action="generate_graph",
        entity_type="graph_snapshot",
        entity_id=graph.id,
        user_id=current_user.id,
        case_id=case_id,
    )

    return graph


@router.get("/{case_id}", response_model=GraphResponse)
async def get_graph(
    case_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get the latest graph snapshot for a case."""
    case = await case_repo.get_by_id(db, case_id)
    if case is None or case.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    graph = await graph_repo.get_by_case(db, case_id)
    if graph is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No graph snapshot found for this case")

    return graph


def _analysis_for_prompt(analysis) -> dict:
    if not analysis:
        return {}
    summary = analysis.summary_json or {}
    return {
        "media_kind": analysis.media_kind,
        "extraction_status": analysis.extraction_status,
        "text_excerpt": analysis.text_excerpt,
        "summary": summary.get("summary"),
        "key_observations": summary.get("key_observations", []),
        "risk_flags": summary.get("risk_flags", []),
        "entities": analysis.entities_json or {},
        "ai_artifact_walrus_blob_id": analysis.walrus_blob_id,
    }


def _build_custody_graph(
    *,
    case,
    evidence_list: list[dict],
    analysis_by_evidence: dict[str, object],
    proofs_by_evidence: dict[str, list],
) -> dict:
    nodes: list[dict] = [
        {
            "id": f"case-{case.id}",
            "label": case.title,
            "type": "case",
            "metadata": {
                "description": case.description,
                "status": case.status,
                "trust_score": case.trust_score,
            },
        }
    ]
    edges: list[dict] = []

    for ev in evidence_list:
        evidence_id = ev["id"]
        evidence_node = f"evidence-{evidence_id}"
        hash_node = f"hash-{ev['sha256_hash'][:16]}"
        walrus_node = f"walrus-{(ev.get('walrus_blob_id') or 'pending')[:32]}"
        analysis = analysis_by_evidence.get(evidence_id)
        analysis_node = f"analysis-{evidence_id}"

        analysis_summary = getattr(analysis, "summary_json", {}) if analysis else {}
        entities = getattr(analysis, "entities_json", {}) if analysis else {}

        nodes.extend([
            {
                "id": evidence_node,
                "label": ev["filename"],
                "type": "evidence",
                "metadata": {
                    "file_type": ev["file_type"],
                    "verification_status": ev["verification_status"],
                    "created_at": ev["created_at"],
                    "summary": analysis_summary.get("summary", "Evidence registered in VerdictChain."),
                    "text_excerpt": getattr(analysis, "text_excerpt", None) if analysis else None,
                },
            },
            {
                "id": hash_node,
                "label": "SHA-256",
                "type": "hash",
                "metadata": {"sha256_hash": ev["sha256_hash"]},
            },
            {
                "id": walrus_node,
                "label": "Walrus Blob",
                "type": "walrus",
                "metadata": {"walrus_blob_id": ev.get("walrus_blob_id") or "pending"},
            },
            {
                "id": analysis_node,
                "label": "DeepSeek Analysis",
                "type": "analysis",
                "metadata": {
                    "media_kind": getattr(analysis, "media_kind", "unknown") if analysis else "unknown",
                    "extraction_status": getattr(analysis, "extraction_status", "not_generated") if analysis else "not_generated",
                    "summary": analysis_summary.get("summary", "Analysis has not been generated for this evidence."),
                    "ai_artifact_walrus_blob_id": getattr(analysis, "walrus_blob_id", None) if analysis else None,
                    "risk_flags": analysis_summary.get("risk_flags", []),
                },
            },
        ])
        edges.extend([
            {"source": f"case-{case.id}", "target": evidence_node, "label": "contains", "weight": 1.0},
            {"source": evidence_node, "target": hash_node, "label": "hashed as", "weight": 1.0},
            {"source": evidence_node, "target": walrus_node, "label": "stored on", "weight": 0.95},
            {"source": evidence_node, "target": analysis_node, "label": "analyzed by", "weight": 0.9},
        ])

        for proof in proofs_by_evidence.get(evidence_id, []):
            proof_node = f"sui-{(proof.sui_transaction_hash or proof.id)!s}"[:80]
            nodes.append({
                "id": proof_node,
                "label": "Sui Proof",
                "type": "sui_proof",
                "metadata": {
                    "sui_transaction_hash": proof.sui_transaction_hash,
                    "proof_hash": proof.proof_hash,
                    "verification_status": proof.verification_status,
                },
            })
            edges.append({"source": hash_node, "target": proof_node, "label": "sealed on Sui", "weight": 0.95})

        _append_entity_nodes(nodes, edges, analysis_node, entities, evidence_id)

    return {
        "nodes": _dedupe_nodes(nodes),
        "edges": _dedupe_edges(edges),
        "layout": "custody_force",
        "legend": ["case", "evidence", "hash", "walrus", "sui_proof", "analysis", "person", "organization", "amount", "date", "location", "risk"],
    }


def _append_entity_nodes(nodes: list[dict], edges: list[dict], analysis_node: str, entities: dict, evidence_id: str) -> None:
    buckets = [
        ("people", "person", "name"),
        ("organizations", "organization", "name"),
        ("amounts", "amount", "value"),
        ("dates", "date", "date"),
        ("locations", "location", "name"),
        ("risk_flags", "risk", "flag"),
    ]
    for bucket, node_type, label_key in buckets:
        for item in entities.get(bucket, []) or []:
            if not isinstance(item, dict):
                continue
            label = str(item.get(label_key) or item.get("name") or item.get("value") or item.get("flag") or "").strip()
            if not label:
                continue
            node_id = f"{node_type}-{_slug(label)}-{evidence_id[:8]}"
            nodes.append({
                "id": node_id,
                "label": label,
                "type": node_type,
                "metadata": item,
            })
            edges.append({"source": analysis_node, "target": node_id, "label": f"extracted {node_type}", "weight": 0.75})

    for rel in entities.get("relationships", []) or []:
        if not isinstance(rel, dict):
            continue
        source = str(rel.get("from") or "").strip()
        target = str(rel.get("to") or "").strip()
        if not source or not target:
            continue
        source_id = f"entity-{_slug(source)}-{evidence_id[:8]}"
        target_id = f"entity-{_slug(target)}-{evidence_id[:8]}"
        nodes.extend([
            {"id": source_id, "label": source, "type": "entity", "metadata": {"source": "relationship"}},
            {"id": target_id, "label": target, "type": "entity", "metadata": {"source": "relationship"}},
        ])
        edges.append({
            "source": source_id,
            "target": target_id,
            "label": str(rel.get("type") or "related"),
            "weight": 0.7,
        })


def _merge_graphs(base_graph: dict, ai_graph: dict) -> dict:
    nodes = list(base_graph.get("nodes", []))
    edges = list(base_graph.get("edges", []))
    ai_nodes = ai_graph.get("nodes", []) if isinstance(ai_graph, dict) else []
    ai_edges = ai_graph.get("edges", []) if isinstance(ai_graph, dict) else []
    for node in ai_nodes:
        if isinstance(node, dict) and node.get("id") and node.get("label"):
            node.setdefault("type", "ai_entity")
            node.setdefault("metadata", {})
            nodes.append(node)
    for edge in ai_edges:
        if isinstance(edge, dict) and edge.get("source") and edge.get("target"):
            edge.setdefault("label", "related")
            edge.setdefault("weight", 0.5)
            edges.append(edge)
    return {**base_graph, "nodes": _dedupe_nodes(nodes), "edges": _dedupe_edges(edges)}


def _dedupe_nodes(nodes: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for node in nodes:
        seen[str(node["id"])] = node
    return list(seen.values())


def _dedupe_edges(edges: list[dict]) -> list[dict]:
    seen: set[tuple[str, str, str]] = set()
    result: list[dict] = []
    for edge in edges:
        key = (str(edge["source"]), str(edge["target"]), str(edge.get("label", "")))
        if key in seen:
            continue
        seen.add(key)
        result.append(edge)
    return result


def _slug(value: str) -> str:
    slug = "".join(ch.lower() if ch.isalnum() else "-" for ch in value)[:48]
    return "-".join(part for part in slug.split("-") if part) or "entity"
