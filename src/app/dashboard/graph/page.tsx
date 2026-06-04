"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, Node, NodeMouseHandler, NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  AlertTriangle,
  Binary,
  Bot,
  BrainCircuit,
  Briefcase,
  Calendar,
  Database,
  FileText,
  Fingerprint,
  GitBranch,
  Network,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CaseRecord,
  generateCaseGraph,
  getActiveCaseId,
  getCaseGraph,
  GraphRecord,
  listCases,
  setActiveCaseId,
} from "@/lib/api";

type NodeCategory =
  | "case"
  | "evidence"
  | "hash"
  | "walrus"
  | "sui_proof"
  | "analysis"
  | "person"
  | "organization"
  | "amount"
  | "date"
  | "location"
  | "risk"
  | "entity"
  | "ai_entity";

type ForensicNodeData = {
  label: string;
  category: NodeCategory;
  desc: string;
  metadata: Record<string, unknown>;
};

type ForensicNode = Node<ForensicNodeData>;

const CATEGORY_META: Record<NodeCategory, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  case: { label: "Case", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.12)", icon: Briefcase },
  evidence: { label: "Evidence", color: "#f8fafc", bg: "rgba(244, 244, 245, 0.1)", icon: FileText },
  hash: { label: "Hash", color: "#22c55e", bg: "rgba(34, 197, 94, 0.12)", icon: Fingerprint },
  walrus: { label: "Walrus", color: "#14b8a6", bg: "rgba(20, 184, 166, 0.12)", icon: Database },
  sui_proof: { label: "Sui", color: "#a78bfa", bg: "rgba(167, 139, 250, 0.14)", icon: ShieldCheck },
  analysis: { label: "DeepSeek", color: "#facc15", bg: "rgba(250, 204, 21, 0.12)", icon: BrainCircuit },
  person: { label: "Person", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.12)", icon: UserRound },
  organization: { label: "Org", color: "#c084fc", bg: "rgba(192, 132, 252, 0.12)", icon: Network },
  amount: { label: "Amount", color: "#fb923c", bg: "rgba(251, 146, 60, 0.12)", icon: Binary },
  date: { label: "Date", color: "#2dd4bf", bg: "rgba(45, 212, 191, 0.12)", icon: Calendar },
  location: { label: "Location", color: "#34d399", bg: "rgba(52, 211, 153, 0.12)", icon: Search },
  risk: { label: "Risk", color: "#f87171", bg: "rgba(248, 113, 113, 0.14)", icon: AlertTriangle },
  entity: { label: "Entity", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.12)", icon: GitBranch },
  ai_entity: { label: "AI Link", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.1)", icon: Bot },
};

const COLUMN_X = {
  case: 0,
  evidence: 300,
  proof: 610,
  analysis: 920,
  entity: 1230,
} as const;

type GraphColumn = keyof typeof COLUMN_X;

const nodeTypes = {
  forensic: ForensicGraphNode,
};

function ForensicGraphNode({ data, selected }: NodeProps<ForensicNode>) {
  const meta = CATEGORY_META[data.category] || CATEGORY_META.entity;
  const Icon = meta.icon;

  return (
    <div
      className={`w-[236px] rounded-lg border bg-[#111113] p-3 text-left shadow-xl transition ${
        selected ? "ring-2 ring-accent-blue" : ""
      }`}
      style={{ borderColor: meta.color, boxShadow: `0 0 22px ${meta.bg}` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
          <Icon className="h-3.5 w-3.5" />
          {meta.label}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-bold leading-snug text-white break-words">{data.label}</div>
      {data.desc && (
        <div className="mt-2 line-clamp-3 text-[10px] leading-relaxed text-zinc-400">{data.desc}</div>
      )}
    </div>
  );
}

function graphToFlow(graph: GraphRecord | null): { nodes: ForensicNode[]; edges: Edge[] } {
  const graphNodes = graph?.graph_json.nodes || [];
  const graphEdges = graph?.graph_json.edges || [];
  const counts: Record<GraphColumn, number> = { case: 0, evidence: 0, proof: 0, analysis: 0, entity: 0 };

  const nodes: ForensicNode[] = graphNodes.map((item) => {
    const category = normalizeCategory(item.type);
    const column = columnForCategory(category);
    const row = counts[column]++;
    const metadata = item.metadata || {};
    const desc = descriptionFromMetadata(metadata);

    return {
      id: item.id,
      type: "forensic",
      data: {
        label: item.label || item.id,
        category,
        desc,
        metadata,
      },
      position: {
        x: COLUMN_X[column],
        y: 80 + row * 150,
      },
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: Edge[] = graphEdges
    .filter((item) => nodeIds.has(item.source) && nodeIds.has(item.target))
    .map((item, index) => ({
      id: `edge-${index}-${item.source}-${item.target}`,
      source: item.source,
      target: item.target,
      label: item.label || "related",
      type: "smoothstep",
      animated: (item.weight || 0) >= 0.9,
      markerEnd: { type: MarkerType.ArrowClosed, color: "#3898ff" },
      style: { stroke: edgeColor(item.label), strokeWidth: 1.7 },
      labelStyle: { fill: "#d4d4d8", fontSize: 10, fontWeight: 700 },
      labelBgStyle: { fill: "#09090b", fillOpacity: 0.9 },
      labelBgPadding: [6, 4],
      labelBgBorderRadius: 4,
    }));

  return { nodes, edges };
}

function normalizeCategory(value?: string): NodeCategory {
  const category = (value || "entity").toLowerCase();
  if (category in CATEGORY_META) return category as NodeCategory;
  if (category === "organization") return "organization";
  if (category === "sui") return "sui_proof";
  return "entity";
}

function columnForCategory(category: NodeCategory): GraphColumn {
  if (category === "case") return "case";
  if (category === "evidence") return "evidence";
  if (category === "hash" || category === "walrus" || category === "sui_proof") return "proof";
  if (category === "analysis") return "analysis";
  return "entity";
}

function descriptionFromMetadata(metadata: Record<string, unknown>): string {
  const summary = metadata.summary;
  if (typeof summary === "string" && summary.trim()) return summary;
  const excerpt = metadata.text_excerpt;
  if (typeof excerpt === "string" && excerpt.trim()) return excerpt;
  const hash = metadata.sha256_hash;
  if (typeof hash === "string") return hash;
  const blob = metadata.walrus_blob_id;
  if (typeof blob === "string") return blob;
  const tx = metadata.sui_transaction_hash;
  if (typeof tx === "string") return tx || "Pending transaction";
  return "";
}

function edgeColor(label?: string) {
  const value = (label || "").toLowerCase();
  if (value.includes("sui")) return "#a78bfa";
  if (value.includes("stored")) return "#14b8a6";
  if (value.includes("hash")) return "#22c55e";
  if (value.includes("risk")) return "#f87171";
  return "#3898ff";
}

function readableValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function InvestigationGraph() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [graph, setGraph] = useState<GraphRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedNode, setSelectedNode] = useState<ForensicNode | null>(null);

  const flowData = useMemo(() => graphToFlow(graph), [graph]);
  const [nodes, setNodes, onNodesChange] = useNodesState<ForensicNode>(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);
  const selectedCase = cases.find((item) => item.id === selectedCaseId);

  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setEdges, setNodes]);

  const loadGraph = async (caseId: string) => {
    setSelectedNode(null);
    setSelectedCaseId(caseId);
    if (caseId) setActiveCaseId(caseId);
    setLoading(true);
    setErrorMessage("");
    try {
      setGraph(caseId ? await getCaseGraph(caseId) : null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load graph.");
    } finally {
      setLoading(false);
    }
  };

  const generateGraph = async () => {
    if (!selectedCaseId) return;
    setGenerating(true);
    setErrorMessage("");
    try {
      const nextGraph = await generateCaseGraph(selectedCaseId);
      setGraph(nextGraph);
      setSelectedNode(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate graph.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadInitialGraph = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const loadedCases = await listCases();
        if (!mounted) return;
        setCases(loadedCases);
        const storedCaseId = getActiveCaseId();
        const nextCaseId = loadedCases.find((item) => item.id === storedCaseId)?.id || loadedCases[0]?.id || "";
        setSelectedCaseId(nextCaseId);
        setGraph(nextCaseId ? await getCaseGraph(nextCaseId) : null);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load graph workspace.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadInitialGraph();
    return () => {
      mounted = false;
    };
  }, []);

  const onNodeClick: NodeMouseHandler<ForensicNode> = useCallback((_, node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px] bg-[#050506] font-sans">
      <aside className="border-b border-border/50 bg-black/60 p-4 lg:border-b-0 lg:border-r overflow-y-auto">
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-white">
              <GitBranch className="h-5 w-5 text-accent-blue" />
              <h1 className="text-sm font-bold">Forensic Graph Board</h1>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
              Evidence custody trail, storage proofs, AI analysis, and extracted entities.
            </p>
          </div>

          <Card variant="glass" className="p-4 space-y-3">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">Case</label>
            <select
              value={selectedCaseId}
              onChange={(event) => loadGraph(event.target.value)}
              className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-semibold text-white outline-none focus:border-accent-blue"
              disabled={loading || cases.length === 0}
            >
              {cases.length === 0 ? (
                <option value="">No cases available</option>
              ) : (
                cases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))
              )}
            </select>
            <Button
              variant="primary"
              size="sm"
              className="w-full gap-2"
              onClick={generateGraph}
              disabled={!selectedCaseId || generating || loading}
            >
              <RefreshCw className={`h-4 w-4 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Graph"}
            </Button>
          </Card>

          <div className="grid grid-cols-2 gap-2">
            <Card variant="glass" className="p-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Nodes</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{nodes.length}</div>
            </Card>
            <Card variant="glass" className="p-3">
              <div className="text-[10px] uppercase tracking-widest text-zinc-500">Links</div>
              <div className="mt-1 text-2xl font-extrabold text-white">{edges.length}</div>
            </Card>
          </div>

          <Card variant="glass" className="p-4">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Legend</div>
            <div className="space-y-2">
              {(["case", "evidence", "hash", "walrus", "sui_proof", "analysis", "person", "organization", "amount", "risk"] as NodeCategory[]).map((category) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                return (
                  <div key={category} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-2 text-zinc-300">
                      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                      {meta.label}
                    </span>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </aside>

      <main className="relative min-h-[560px]">
        {errorMessage && (
          <div className="absolute left-4 right-4 top-4 z-10">
            <Card variant="glass" className="border border-accent-red/30 bg-accent-red/10 p-4 text-xs text-accent-red">
              {errorMessage}
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin text-accent-blue" />
            Loading graph snapshot...
          </div>
        ) : nodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            minZoom={0.25}
            maxZoom={1.4}
            className="bg-[#050506]"
          >
            <Controls className="rounded border border-border bg-secondary text-white" />
            <MiniMap
              nodeColor={(node) => CATEGORY_META[(node.data?.category as NodeCategory) || "entity"]?.color || "#71717a"}
              className="rounded border border-border bg-black/80"
            />
            <Background color="#202026" gap={18} />
          </ReactFlow>
        ) : (
          <div className="flex h-full items-center justify-center px-6">
            <Card variant="glass" className="max-w-md p-8 text-center">
              <GitBranch className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
              <h2 className="text-sm font-bold text-white">No graph snapshot yet</h2>
              <p className="mt-1 text-xs text-zinc-500">Upload evidence, then generate a graph for this case.</p>
              <Button variant="primary" size="sm" className="mt-4" onClick={generateGraph} disabled={!selectedCaseId || generating}>
                Generate Graph
              </Button>
            </Card>
          </div>
        )}
      </main>

      <aside className="border-t border-border/50 bg-black/70 p-4 lg:border-l lg:border-t-0 overflow-y-auto">
        {selectedNode ? (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="glow-blue">{CATEGORY_META[selectedNode.data.category]?.label || selectedNode.data.category}</Badge>
                <h2 className="mt-2 break-words text-lg font-bold leading-tight text-white">{selectedNode.data.label}</h2>
              </div>
              <button className="text-xs font-semibold text-zinc-500 hover:text-white" onClick={() => setSelectedNode(null)}>
                Close
              </button>
            </div>

            {selectedNode.data.desc && (
              <Card variant="glass" className="p-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Summary</div>
                <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">{selectedNode.data.desc}</p>
              </Card>
            )}

            <Card variant="glass" className="p-4">
              <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Metadata</div>
              <div className="space-y-3">
                {Object.entries(selectedNode.data.metadata || {}).map(([key, value]) => (
                  <div key={key} className="rounded border border-border/70 bg-secondary/40 p-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{key.replaceAll("_", " ")}</div>
                    <pre className="mt-1 max-h-44 overflow-auto whitespace-pre-wrap break-words text-[10px] leading-relaxed text-zinc-300">
                      {readableValue(value)}
                    </pre>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Badge variant="active">Graph Detail</Badge>
              <h2 className="mt-2 text-lg font-bold text-white">{selectedCase?.title || "No case selected"}</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                Click any node to inspect the source hash, Walrus blob, Sui seal, AI summary, or extracted entity metadata.
              </p>
            </div>
            <Card variant="glass" className="p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Evidence records</span>
                <span className="font-bold text-white">{selectedCase?.evidence_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Trust score</span>
                <span className="font-bold text-accent-green">{selectedCase ? `${selectedCase.trust_score.toFixed(1)}%` : "0.0%"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Snapshot</span>
                <span className="font-bold text-zinc-300">{graph ? new Date(graph.created_at).toLocaleString() : "Not generated"}</span>
              </div>
            </Card>
          </div>
        )}
      </aside>
    </div>
  );
}
