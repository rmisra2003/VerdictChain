"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  ExternalLink,
  Bot,
  BrainCircuit,
  Database,
  RefreshCw,
  GitBranch,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaseRecord,
  EvidenceAnalysisRecord,
  EvidenceRecord,
  generateCaseGraph,
  generateCaseReport,
  generateCaseTimeline,
  getCase,
  getCaseGraph,
  getCaseReport,
  getCaseTimeline,
  GraphRecord,
  listEvidenceAnalysisByCase,
  listEvidenceByCase,
  ReportRecord,
  TimelineRecord,
} from "@/lib/api";

type ActiveTab = "evidence" | "timeline" | "graph" | "report";
type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "evidence", label: "Evidence Vault" },
  { id: "timeline", label: "DeepSeek Timeline" },
  { id: "graph", label: "Relationship Graph" },
  { id: "report", label: "Forensic Report" },
];

const entityBuckets: Array<{ key: string; label: string }> = [
  { key: "people", label: "People" },
  { key: "organizations", label: "Organizations" },
  { key: "amounts", label: "Amounts" },
  { key: "dates", label: "Dates" },
  { key: "locations", label: "Locations" },
  { key: "risk_flags", label: "Risk Flags" },
];

function recordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
    : [];
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function readableText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (!value || Array.isArray(value) || typeof value !== "object") return "";

  const record = value as Record<string, unknown>;
  const preferredValue =
    record.summary ||
    record.finding ||
    record.description ||
    record.action ||
    record.rationale ||
    record.event ||
    record.title ||
    record.factor ||
    record.value ||
    record.name;
  return readableText(preferredValue);
}

function readableList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    const singleValue = readableText(value);
    return singleValue ? [singleValue] : [];
  }
  return value.map(readableText).filter((item) => item.length > 0);
}

function fallbackText(value: unknown, fallback: string): string {
  const text = readableText(value);
  return text || fallback;
}

function formatLabel(value: unknown, fallback: string): string {
  const text = fallbackText(value, fallback);
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityVariant(value: unknown): BadgeVariant {
  const level = readableText(value).toLowerCase();
  if (level.includes("critical")) return "critical";
  if (level.includes("high")) return "high";
  if (level.includes("medium") || level.includes("moderate")) return "medium";
  if (level.includes("low")) return "low";
  return "secondary";
}

function scoreText(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) return `${Math.round(value)}/100`;
  const text = readableText(value);
  return text ? `${text}/100` : "Not scored";
}

function analysisSummary(analysis: EvidenceAnalysisRecord | null): string {
  const summary = analysis?.summary_json?.summary;
  return typeof summary === "string" && summary.trim().length > 0
    ? summary
    : "No AI summary has been stored for this evidence yet.";
}

function entityTitle(item: Record<string, unknown>): string {
  const value = item.name || item.value || item.date || item.flag || item.id;
  return typeof value === "string" && value.trim().length > 0 ? value : "Extracted entity";
}

function entityDetail(item: Record<string, unknown>): string {
  const detail =
    item.role ||
    item.type ||
    item.context ||
    item.rationale ||
    item.currency ||
    item.severity;
  return typeof detail === "string" && detail.trim().length > 0 ? detail : "";
}

function JsonBlock({ data }: { data: unknown }) {
  return (
    <pre className="whitespace-pre-wrap break-words rounded-lg border border-border bg-black/50 p-3 text-[10px] text-zinc-300">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ReportSection({
  title,
  children,
  right,
}: {
  title: string;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border/70 bg-black/20 p-4">
      <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/30 pb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-xs leading-relaxed text-zinc-500">{empty}</p>;
  }

  return (
    <ul className="space-y-2 text-xs leading-relaxed text-zinc-300">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue/80" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ReportDocument({
  report,
  currentCase,
  evidenceCount,
}: {
  report: ReportRecord;
  currentCase: CaseRecord;
  evidenceCount: number;
}) {
  const reportJson = report.report_json || {};
  const risk = asRecord(reportJson.risk_assessment || reportJson.risk || reportJson.riskAssessment);
  const executiveSummary = fallbackText(
    reportJson.executive_summary || reportJson.executiveSummary || reportJson.summary,
    "DeepSeek did not provide an executive summary for this report.",
  );
  const findings = recordArray(reportJson.key_findings || reportJson.findings);
  const timeline = recordArray(reportJson.timeline || reportJson.events);
  const contradictions = recordArray(reportJson.contradictions || reportJson.inconsistencies);
  const recommendations = recordArray(reportJson.recommendations || reportJson.next_steps || reportJson.nextSteps);
  const riskLevel = fallbackText(risk.level || risk.severity || reportJson.risk_level, "Unspecified");
  const riskFactors = readableList(risk.factors || risk.signals || risk.reasons);

  return (
    <Card variant="glass" className="relative space-y-5 p-6 select-text">
      <div className="flex flex-col gap-4 border-b border-border/40 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Bot className="h-4 w-4 text-accent-blue" />
            DeepSeek Investigation Report
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{currentCase.title}</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-zinc-400">{currentCase.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 sm:grid-cols-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
            <div className="text-zinc-500">Generated</div>
            <div className="mt-1 font-mono text-zinc-300">{new Date(report.created_at).toLocaleString()}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
            <div className="text-zinc-500">Evidence</div>
            <div className="mt-1 font-semibold text-white">{evidenceCount} files</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
            <div className="text-zinc-500">Trust</div>
            <div className="mt-1 font-semibold text-white">{currentCase.trust_score.toFixed(1)}%</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-2">
            <div className="text-zinc-500">Walrus</div>
            <div className="mt-1 max-w-[9rem] truncate font-mono text-accent-green" title={report.walrus_blob_id || "Not stored"}>
              {report.walrus_blob_id || "Not stored"}
            </div>
          </div>
        </div>
      </div>

      <ReportSection title="Executive Summary">
        <p className="text-sm leading-7 text-zinc-200">{executiveSummary}</p>
      </ReportSection>

      <ReportSection
        title="Risk Assessment"
        right={<Badge variant={severityVariant(riskLevel)}>{formatLabel(riskLevel, "Unspecified")}</Badge>}
      >
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Risk Level</div>
            <div className="mt-1 text-sm font-bold text-white">{formatLabel(riskLevel, "Unspecified")}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AI Score</div>
            <div className="mt-1 text-sm font-bold text-white">{scoreText(risk.score)}</div>
          </div>
          <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Case Status</div>
            <div className="mt-1 text-sm font-bold text-white">{formatLabel(currentCase.status, "Active")}</div>
          </div>
        </div>
        <BulletList items={riskFactors} empty="No explicit risk factors were returned by DeepSeek." />
      </ReportSection>

      <ReportSection title="Key Findings">
        {findings.length > 0 ? (
          <div className="space-y-3">
            {findings.map((finding, index) => {
              const severity = finding.severity || finding.priority || finding.significance;
              const references = readableList(finding.evidence_refs || finding.evidence_ids || finding.references);
              return (
                <div key={`finding-${index}`} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-sm font-semibold leading-relaxed text-white">
                      {fallbackText(finding.finding || finding.title || finding.description, `Finding ${index + 1}`)}
                    </p>
                    {readableText(severity) && <Badge variant={severityVariant(severity)}>{formatLabel(severity, "Finding")}</Badge>}
                  </div>
                  {references.length > 0 && (
                    <div className="mt-2 text-[10px] text-zinc-500">
                      Evidence refs: <span className="font-mono text-zinc-400">{references.join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">No key findings were returned by DeepSeek.</p>
        )}
      </ReportSection>

      <ReportSection title="Timeline">
        {timeline.length > 0 ? (
          <div className="space-y-3">
            {timeline.map((event, index) => {
              const significance = event.significance || event.severity || event.priority;
              return (
                <div key={`report-event-${index}`} className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 bg-black/20 p-3 sm:grid-cols-[9rem_1fr]">
                  <div className="font-mono text-[10px] text-zinc-500">{fallbackText(event.date || event.timestamp, "Undated")}</div>
                  <div className="space-y-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-white">{fallbackText(event.event || event.title, `Timeline event ${index + 1}`)}</p>
                      {readableText(significance) && <Badge variant={severityVariant(significance)}>{formatLabel(significance, "Event")}</Badge>}
                    </div>
                    {readableText(event.description) && <p className="text-xs leading-relaxed text-zinc-400">{readableText(event.description)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">No report timeline was returned by DeepSeek.</p>
        )}
      </ReportSection>

      <ReportSection title="Contradictions And Gaps">
        {contradictions.length > 0 ? (
          <div className="space-y-3">
            {contradictions.map((item, index) => {
              const severity = item.severity || item.priority || item.significance;
              return (
                <div key={`contradiction-${index}`} className="rounded-lg border border-accent-yellow/20 bg-accent-yellow/5 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p className="text-xs leading-relaxed text-zinc-200">
                      {fallbackText(item.description || item.finding || item.summary, `Contradiction ${index + 1}`)}
                    </p>
                    {readableText(severity) && <Badge variant={severityVariant(severity)}>{formatLabel(severity, "Review")}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">No contradictions were identified in the generated report.</p>
        )}
      </ReportSection>

      <ReportSection title="Recommended Actions">
        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((item, index) => {
              const priority = item.priority || item.severity || item.significance;
              return (
                <div key={`recommendation-${index}`} className="rounded-lg border border-border/60 bg-secondary/20 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{fallbackText(item.action || item.title, `Action ${index + 1}`)}</p>
                      {readableText(item.rationale || item.description) && (
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">{readableText(item.rationale || item.description)}</p>
                      )}
                    </div>
                    {readableText(priority) && <Badge variant={severityVariant(priority)}>{formatLabel(priority, "Action")}</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-zinc-500">No recommendations were returned by DeepSeek.</p>
        )}
      </ReportSection>
    </Card>
  );
}

export default function CaseWorkspace() {
  const { id } = useParams();
  const caseId = Array.isArray(id) ? id[0] : id;

  const [activeTab, setActiveTab] = useState<ActiveTab>("evidence");
  const [currentCase, setCurrentCase] = useState<CaseRecord | null>(null);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [analyses, setAnalyses] = useState<EvidenceAnalysisRecord[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceRecord | null>(null);
  const [timeline, setTimeline] = useState<TimelineRecord | null>(null);
  const [report, setReport] = useState<ReportRecord | null>(null);
  const [graph, setGraph] = useState<GraphRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<ActiveTab | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadInitialWorkspace = async () => {
      await Promise.resolve();
      if (!caseId) return;
      setLoading(true);
      setErrorMessage("");
      try {
        const [caseData, evidenceData, analysisData, timelineData, reportData, graphData] = await Promise.all([
          getCase(caseId),
          listEvidenceByCase(caseId),
          listEvidenceAnalysisByCase(caseId),
          getCaseTimeline(caseId),
          getCaseReport(caseId),
          getCaseGraph(caseId),
        ]);
        if (!mounted) return;
        setCurrentCase(caseData);
        setEvidence(evidenceData);
        setAnalyses(analysisData);
        setSelectedEvidence(evidenceData[0] || null);
        setTimeline(timelineData);
        setReport(reportData);
        setGraph(graphData);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load case workspace.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadInitialWorkspace();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const generateArtifact = async (artifact: ActiveTab) => {
    if (!caseId) return;
    setGenerating(artifact);
    setErrorMessage("");
    try {
      if (artifact === "timeline") setTimeline(await generateCaseTimeline(caseId));
      if (artifact === "report") setReport(await generateCaseReport(caseId));
      if (artifact === "graph") setGraph(await generateCaseGraph(caseId));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to generate artifact.");
    } finally {
      setGenerating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Card variant="glass" className="p-8 text-xs text-zinc-500 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-accent-blue" />
          Loading case workspace...
        </Card>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <Card variant="glass" className="p-8 text-center">
          <h1 className="text-lg font-bold text-white">Case not found</h1>
          <p className="text-xs text-zinc-500 mt-2">{errorMessage || "This case is unavailable for the current session."}</p>
          <Link href="/dashboard/cases" className="inline-flex mt-4">
            <Button variant="secondary" size="sm">Back to Cases</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const selectedAnalysis = selectedEvidence
    ? analyses.find((item) => item.evidence_id === selectedEvidence.id) || null
    : null;
  const selectedSummary = analysisSummary(selectedAnalysis);
  const selectedWarnings = [
    ...stringArray(selectedAnalysis?.extraction_metadata?.warnings),
    ...stringArray(selectedAnalysis?.extraction_metadata?.deepseek_warnings),
  ];
  const selectedEntityGroups = selectedAnalysis
    ? entityBuckets
        .map((bucket) => ({
          ...bucket,
          items: recordArray(selectedAnalysis.entities_json?.[bucket.key]),
        }))
        .filter((bucket) => bucket.items.length > 0)
    : [];

  return (
    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto font-sans">
      <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/cases">
            <button className="p-1.5 rounded-lg bg-secondary border border-border text-zinc-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="glow-blue" className="font-mono">{currentCase.id.slice(0, 8)}</Badge>
              <h1 className="text-xl font-bold tracking-tight text-white truncate">{currentCase.title}</h1>
            </div>
            <p className="text-xs text-zinc-500 truncate">{currentCase.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={currentCase.status === "active" ? "active" : "closed"}>
            Status: {currentCase.status}
          </Badge>
          <Badge variant={currentCase.trust_score > 60 ? "verified" : "tampered"}>
            Trust Score: {currentCase.trust_score.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {errorMessage && (
        <div className="lg:col-span-12">
          <Card variant="glass" className="p-4 border border-accent-red/30 bg-accent-red/10 text-xs text-accent-red">
            {errorMessage}
          </Card>
        </div>
      )}

      <div className="lg:col-span-8 space-y-6">
        <div className="flex border-b border-border/40 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all select-none whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-accent-blue text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "evidence" && (
            <motion.div
              key="evidence"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-4 space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Evidence Files</h3>
                <div className="space-y-2">
                  {evidence.map((item) => {
                    const isSelected = selectedEvidence?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedEvidence(item)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-secondary border-accent-blue shadow-lg shadow-black/20"
                            : "bg-black/10 border-border/40 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5 min-w-0">
                          <FileText className={`w-4 h-4 shrink-0 ${isSelected ? "text-accent-blue" : "text-zinc-500"}`} />
                          <span className="font-bold text-white text-[11px] truncate">{item.filename}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                          <span>{(item.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                          <Badge variant={item.verification_status === "verified" ? "verified" : "pending"} className="text-[8px] py-0 px-1 font-bold">
                            {item.verification_status}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {evidence.length === 0 && (
                  <Card variant="glass" className="p-4 text-xs text-zinc-500">
                    No evidence has been uploaded for this case.
                  </Card>
                )}
              </div>

              <div className="md:col-span-8">
                <Card variant="glass" className="p-6 min-h-[400px]">
                  {selectedEvidence ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-border/40 pb-3">
                        <div className="min-w-0">
                          <h3 className="font-bold text-white text-xs flex items-center gap-1.5 truncate">
                            <FileText className="w-4 h-4 text-accent-blue shrink-0" />
                            {selectedEvidence.filename}
                          </h3>
                          <span className="text-[9px] text-zinc-500 font-mono">MIME: {selectedEvidence.file_type}</span>
                        </div>
                        <Badge variant={selectedEvidence.verification_status === "verified" ? "verified" : "pending"}>
                          {selectedEvidence.verification_status}
                        </Badge>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <span className="text-zinc-500 block mb-1">SHA-256:</span>
                          <span className="text-zinc-300 font-mono text-[10px] break-all select-all">{selectedEvidence.sha256_hash}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block mb-1">Walrus Blob:</span>
                          <span className="text-accent-green font-mono text-[10px] break-all select-all">
                            {selectedEvidence.walrus_blob_id || "Pending certification"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-zinc-500 block">File Size:</span>
                            <span className="text-zinc-300 font-mono">{(selectedEvidence.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block">Created:</span>
                            <span className="text-zinc-300 font-mono">{new Date(selectedEvidence.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-4 space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-yellow">
                              <BrainCircuit className="h-4 w-4" />
                              AI Evidence Intelligence
                            </div>
                            <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                              {selectedAnalysis ? selectedSummary : "No DeepSeek analysis exists for this evidence yet. New uploads include OpenAI/Tesseract media extraction and summary artifacts."}
                            </p>
                          </div>
                          <Badge variant={selectedAnalysis?.extraction_status === "extracted" ? "verified" : "pending"} className="shrink-0">
                            {selectedAnalysis?.extraction_status || "not generated"}
                          </Badge>
                        </div>

                        {selectedAnalysis?.text_excerpt && (
                          <div className="rounded-lg border border-border/70 bg-black/35 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Extracted Text Preview</div>
                            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-zinc-300">
                              {selectedAnalysis.text_excerpt}
                            </pre>
                          </div>
                        )}

                        {selectedEntityGroups.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Extracted Entities</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {selectedEntityGroups.map((bucket) => (
                                <div key={bucket.key} className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                                  <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{bucket.label}</div>
                                  <div className="space-y-2">
                                    {bucket.items.slice(0, 6).map((item, index) => {
                                      const detail = entityDetail(item);
                                      return (
                                        <div key={`${bucket.key}-${index}`} className="rounded border border-border/50 bg-black/25 px-2 py-1.5">
                                          <div className="text-[11px] font-bold text-white break-words">{entityTitle(item)}</div>
                                          {detail && <div className="mt-0.5 text-[10px] text-zinc-500 break-words">{detail}</div>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {selectedWarnings.length > 0 && (
                          <div className="rounded-lg border border-accent-yellow/20 bg-accent-yellow/5 p-3">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-accent-yellow">Extraction Notes</div>
                            <div className="mt-2 space-y-1.5 text-[10px] text-zinc-300">
                              {selectedWarnings.map((warning, index) => (
                                <div key={`${warning}-${index}`}>{warning}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                              <Bot className="h-3.5 w-3.5 text-accent-blue" />
                              Media Kind
                            </div>
                            <div className="mt-1 text-xs font-semibold text-white">
                              {selectedAnalysis?.media_kind || "not analyzed"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-border/70 bg-secondary/30 p-3">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                              <Database className="h-3.5 w-3.5 text-accent-green" />
                              AI Artifact Walrus Blob
                            </div>
                            <div className="mt-1 break-all font-mono text-[10px] text-zinc-300 select-all">
                              {selectedAnalysis?.walrus_blob_id || "not stored yet"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-16">
                      <FileText className="w-10 h-10 mb-3 text-zinc-600" />
                      <p className="text-xs">Select an evidence record to inspect metadata.</p>
                    </div>
                  )}
                </Card>
              </div>
            </motion.div>
          )}

          {activeTab === "timeline" && (
            <motion.div key="timeline" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => generateArtifact("timeline")} loading={generating === "timeline"}>
                  Generate Timeline
                </Button>
              </div>
              {timeline?.timeline_json.events?.length ? (
                <div className="relative pl-6 space-y-6">
                  <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-border/60" />
                  {timeline.timeline_json.events.map((event, index) => (
                    <Card key={index} variant="glass" className="p-4 bg-black/20">
                      <div className="flex items-center justify-between gap-4 text-xs">
                        <span className="font-bold text-white">{String(event.title || event.event || "Timeline event")}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{String(event.date || "Undated")}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-2">{String(event.description || "")}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card variant="glass" className="p-8 text-center text-xs text-zinc-500">No generated timeline yet.</Card>
              )}
            </motion.div>
          )}

          {activeTab === "graph" && (
            <motion.div key="graph" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              <div className="flex justify-end">
                <Button variant="secondary" size="sm" onClick={() => generateArtifact("graph")} loading={generating === "graph"}>
                  Generate Graph
                </Button>
              </div>
              {graph ? (
                <Card variant="glass" className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-white">
                    <GitBranch className="w-4 h-4 text-accent-blue" />
                    Graph Snapshot
                  </div>
                  <JsonBlock data={graph.graph_json} />
                </Card>
              ) : (
                <Card variant="glass" className="p-8 text-center text-xs text-zinc-500">No generated graph yet.</Card>
              )}
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div key="report" initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => generateArtifact("report")} loading={generating === "report"}>
                  Generate Report
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => window.print()} disabled={!report}>
                  <Download className="w-4 h-4" /> Export
                </Button>
              </div>
              {report ? (
                <ReportDocument report={report} currentCase={currentCase} evidenceCount={evidence.length} />
              ) : (
                <Card variant="glass" className="p-8 text-center text-xs text-zinc-500">No generated report yet.</Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="lg:col-span-4 space-y-6 select-text">
        <Card variant="glass" className="p-5 space-y-5">
          <div className="border-b border-border/40 pb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Case Custody Record</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-zinc-500 font-semibold block">Case Owner:</span>
              <span className="text-zinc-300 mt-1 block font-mono">{currentCase.owner_id}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block">Evidence Count:</span>
              <span className="text-zinc-300 font-bold block mt-1">{evidence.length}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block">Created:</span>
              <span className="text-zinc-300 font-mono mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(currentCase.created_at).toLocaleString()}
              </span>
            </div>

            <div className="border-t border-border/20 pt-4">
              <span className="text-zinc-500 font-semibold block">Case ID:</span>
              <span className="text-accent-blue font-mono mt-1 break-all block text-[10px] select-all leading-relaxed">
                {currentCase.id}
              </span>
            </div>

            <div className="border-t border-border/20 pt-4">
              <span className="text-zinc-500 font-semibold block">Storage/AI Artifacts:</span>
              <div className="mt-2 space-y-1 text-[10px] text-zinc-400">
                <div>Timeline: {timeline?.walrus_blob_id || "not generated"}</div>
                <div>Report: {report?.walrus_blob_id || "not generated"}</div>
                <div>Graph: {graph?.walrus_blob_id || "not generated"}</div>
              </div>
            </div>
          </div>

          <Link href="/verify">
            <Button variant="glow" size="sm" className="w-full text-xs font-bold gap-1">
              Verify Evidence Hash <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
