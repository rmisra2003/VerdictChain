"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  CheckCircle,
  FileText,
  RefreshCw,
  Briefcase,
  BrainCircuit,
  Database,
  AlertTriangle,
  Network,
  ShieldCheck,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  CaseRecord,
  getActiveCaseId,
  getTatumWalrusJobStatus,
  isApiConfigured,
  listCases,
  setActiveCaseId,
  uploadEvidenceToApi,
} from "@/lib/api";

interface UploadReceipt {
  filename: string;
  size: string;
  hash: string;
  caseTitle: string;
  suiTx: string | null;
  walrusBlob: string;
  walrusJobId?: string;
  walrusStatus?: string;
  mediaKind?: string;
  extractionStatus?: string;
  analysisSummary?: string;
  aiArtifactBlob?: string | null;
  extractionWarnings?: string[];
  extractedTextExcerpt?: string | null;
  tatumStatusCheckedAt?: string;
  timestamp: string;
}

export default function EvidenceUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [associatedCase, setAssociatedCase] = useState("");
  const [custodian, setCustodian] = useState("");
  const [description, setDescription] = useState("");
  const [casesLoading, setCasesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setCasesLoading(true);
      setErrorMessage("");
      try {
        const loadedCases = await listCases();
        if (!mounted) return;
        setCases(loadedCases);
        const storedCaseId = getActiveCaseId();
        const selected = loadedCases.find((item) => item.id === storedCaseId)?.id || loadedCases[0]?.id || "";
        setAssociatedCase(selected);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load case vaults.");
        }
      } finally {
        if (mounted) setCasesLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerUpload = async () => {
    if (!file || !associatedCase) return;
    if (!isApiConfigured()) {
      setErrorMessage("Backend API is not configured. Set NEXT_PUBLIC_API_BASE_URL before uploading evidence.");
      return;
    }

    const selectedFile = file;
    setLoading(true);
    setErrorMessage("");
    setStatusError("");
    setStep(1);
    setActiveCaseId(associatedCase);

    try {
      setStep(2);
      const result = await uploadEvidenceToApi(selectedFile, associatedCase);
      setStep(3);
      const selectedCaseTitle =
        cases.find((item) => item.id === associatedCase)?.title || "Selected case vault";
      const metadataWarnings = result.analysis?.extraction_metadata?.warnings;
      const extractionWarnings = Array.isArray(metadataWarnings)
        ? metadataWarnings.filter((item): item is string => typeof item === "string")
        : [];
      setReceipt({
        filename: result.evidence.filename,
        size: `${(result.evidence.file_size / (1024 * 1024)).toFixed(2)} MB`,
        hash: result.evidence.sha256_hash,
        caseTitle: selectedCaseTitle,
        suiTx: result.proof?.sui_transaction_hash || null,
        walrusBlob: result.evidence.walrus_blob_id || result.walrus_metadata.blob_id || "pending",
        walrusJobId: result.walrus_metadata.job_id,
        walrusStatus: result.walrus_metadata.status,
        mediaKind: result.analysis?.media_kind,
        extractionStatus: result.analysis?.extraction_status,
        analysisSummary:
          typeof result.analysis?.summary_json?.summary === "string"
            ? result.analysis.summary_json.summary
            : undefined,
        aiArtifactBlob: result.analysis?.walrus_blob_id,
        extractionWarnings,
        extractedTextExcerpt: result.analysis?.text_excerpt,
        timestamp: result.evidence.created_at,
      });
      setFile(null);
      setDescription("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Evidence upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const refreshTatumStatus = async () => {
    if (!receipt?.walrusJobId) return;
    setStatusLoading(true);
    setStatusError("");

    try {
      const result = await getTatumWalrusJobStatus(receipt.walrusJobId);
      const nextStatus = result.status || result.state || receipt.walrusStatus || "UNKNOWN";
      const nextBlob =
        typeof result.blobId === "string"
          ? result.blobId
          : typeof result.blob_id === "string"
            ? result.blob_id
            : receipt.walrusBlob;

      setReceipt({
        ...receipt,
        walrusStatus: nextStatus,
        walrusBlob: nextBlob,
        tatumStatusCheckedAt: new Date().toISOString(),
      });
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Tatum status refresh failed.");
    } finally {
      setStatusLoading(false);
    }
  };

  const uploadDisabled = !file || !associatedCase || loading || casesLoading;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto font-sans">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-accent-blue" />
          Ingest & Seal Forensic Evidence
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Uploads require an authenticated case vault. The backend computes SHA-256, stores evidence through Tatum Walrus, and seals the hash through the Sui notary.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-text">
        <div className="lg:col-span-8 space-y-6">
          <Card variant="glass" className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Associated Case Vault</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={associatedCase}
                  onChange={(e) => {
                    setAssociatedCase(e.target.value);
                    if (e.target.value) setActiveCaseId(e.target.value);
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border/80 rounded-lg text-xs outline-none focus:border-accent-blue text-white font-semibold cursor-pointer appearance-none"
                  disabled={casesLoading || cases.length === 0}
                >
                  {cases.length === 0 ? (
                    <option value="">No case vaults available</option>
                  ) : (
                    cases.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.id.slice(0, 8)})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            {cases.length === 0 && !casesLoading && (
              <div className="rounded-lg border border-accent-blue/30 bg-accent-blue/10 p-3 text-xs text-zinc-300 flex items-center justify-between gap-3">
                <span>Create a case vault before ingesting evidence.</span>
                <Link href="/dashboard/cases">
                  <Button variant="secondary" size="sm">Create Case</Button>
                </Link>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Evidence Custodian / Ingestion Officer</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-xs outline-none text-white font-semibold"
                value={custodian}
                onChange={(e) => setCustodian(e.target.value)}
                placeholder="Custodian name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Forensic Context & Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-xs outline-none text-zinc-300 font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Capture extraction source, chain-of-custody notes, and handling constraints"
              />
            </div>

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-accent-blue bg-accent-blue/5"
                    : "border-border/60 bg-black/10 hover:border-border hover:bg-secondary/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <UploadCloud className="w-8 h-8 text-accent-blue mb-3" />
                <span className="font-bold text-xs text-white">Select original evidence asset</span>
                <span className="text-[10px] text-zinc-500 mt-1">Supports configured MIME types up to backend limit</span>
              </div>
            ) : (
              <div className="p-4 bg-secondary border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate max-w-[260px]">{file.name}</div>
                    <div className="text-[10px] text-zinc-500">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            )}

            <Button
              variant="glow"
              className="w-full gap-2 font-bold"
              disabled={uploadDisabled}
              onClick={triggerUpload}
            >
              {loading ? "Sealing Evidence..." : "Anchor & Disperse Evidence Proof"}
            </Button>

            {errorMessage && (
              <div className="rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-[11px] text-accent-red">
                {errorMessage}
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card variant="glass" className="p-5 relative overflow-hidden scanline bg-[#09090b]">
            <div className="border-b border-border/40 pb-3 mb-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Custody Settlement Pipe</h3>
            </div>

            <div className="space-y-4">
              {[
                ["1", "SHA-256 Hashing", "Computed by the backend before persistence", "blue"],
                ["2", "Walrus Storage via Tatum", "Evidence staged for decentralized storage", "green"],
                ["3", "Sui Notary Seal", "Hash committed to deployed Move package", "purple"],
              ].map(([index, title, caption, tone], idx) => (
                <div key={index} className="flex items-center gap-3 text-xs">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    step >= idx + 1
                      ? tone === "green"
                        ? "border-accent-green text-accent-green bg-accent-green/10"
                        : tone === "purple"
                          ? "border-accent-purple text-accent-purple bg-accent-purple/10"
                          : "border-accent-blue text-accent-blue bg-accent-blue/10"
                      : "border-border text-zinc-500"
                  }`}>
                    {step >= idx + 1 ? <CheckCircle className="w-3.5 h-3.5" /> : index}
                  </div>
                  <div>
                    <span className={`font-semibold block ${step >= idx + 1 ? "text-white" : "text-zinc-500"}`}>{title}</span>
                    <span className="text-[9px] text-zinc-500">{caption}</span>
                  </div>
                </div>
              ))}
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-[10px] text-accent-blue font-mono justify-center border-t border-border/20 pt-4 mt-4 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Submitting live proof pipeline...</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {receipt && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <Card variant="glass" className="p-6 border border-accent-green/30 select-text">
              <div className="flex items-center gap-3.5 border-b border-border/40 pb-4 mb-4 text-accent-green">
                <CheckCircle className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="font-bold text-sm text-white">Forensic Evidence Sealed Successfully</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Evidence was hashed, persisted, uploaded through Tatum Walrus, and submitted to the Sui notary path.
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl border border-accent-blue/25 bg-black/35 p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <Badge variant="glow-blue" className="mb-2">Hackathon Integration Receipt</Badge>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Live upload through Tatum, decentralized blob storage on Walrus, proof sealing on Sui, and DeepSeek-ready forensic context for the next artifact pass.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-secondary/40 px-3 py-2 text-right">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Case Vault</p>
                    <p className="text-xs text-white font-semibold max-w-[220px] truncate">{receipt.caseTitle}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-border/70 bg-secondary/35 p-3 min-h-[126px]">
                    <div className="flex items-center justify-between gap-2">
                      <Database className="w-4 h-4 text-accent-blue" />
                      <Badge variant={receipt.walrusJobId ? "active" : "pending"} className="text-[9px]">
                        {receipt.walrusJobId ? "Live Job" : "Pending"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs font-bold text-white">Tatum Data API</p>
                    <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">
                      Walrus upload job and status refresh are surfaced directly in the product.
                    </p>
                    <p className="mt-2 font-mono text-[9px] text-zinc-400 break-all">
                      {receipt.walrusJobId || "job id pending"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/35 p-3 min-h-[126px]">
                    <div className="flex items-center justify-between gap-2">
                      <Network className="w-4 h-4 text-accent-green" />
                      <Badge variant="verified" className="text-[9px]">Stored</Badge>
                    </div>
                    <p className="mt-3 text-xs font-bold text-white">Walrus Blob</p>
                    <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">
                      Evidence metadata carries a retrievable Walrus blob reference.
                    </p>
                    <p className="mt-2 font-mono text-[9px] text-zinc-400 break-all">
                      {receipt.walrusBlob}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/35 p-3 min-h-[126px]">
                    <div className="flex items-center justify-between gap-2">
                      <ShieldCheck className="w-4 h-4 text-accent-purple" />
                      <Badge variant={receipt.suiTx ? "verified" : "pending"} className="text-[9px]">
                        {receipt.suiTx ? "Sealed" : "Queued"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs font-bold text-white">Sui Devnet RPC</p>
                    <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">
                      SHA-256 evidence proof is anchored through the deployed Sui notary.
                    </p>
                    <p className="mt-2 font-mono text-[9px] text-zinc-400 break-all">
                      {receipt.suiTx || "transaction pending"}
                    </p>
                  </div>

                  <div className="rounded-lg border border-border/70 bg-secondary/35 p-3 min-h-[126px]">
                    <div className="flex items-center justify-between gap-2">
                      <BrainCircuit className="w-4 h-4 text-accent-yellow" />
                      <Badge variant={receipt.extractionStatus === "extracted" ? "verified" : "pending"} className="text-[9px]">
                        {receipt.extractionStatus || "Queued"}
                      </Badge>
                    </div>
                    <p className="mt-3 text-xs font-bold text-white">DeepSeek Layer</p>
                    <p className="mt-1 text-[10px] text-zinc-500 leading-relaxed">
                      {receipt.mediaKind
                        ? `${receipt.mediaKind} intelligence extracted for timeline, report, and graph artifacts.`
                        : "The case can now generate timeline, report, and relationship graph artifacts."}
                    </p>
                    <Link href="/dashboard/graph" className="mt-2 inline-flex text-[10px] font-bold text-accent-blue hover:text-white">
                      Open graph workspace
                    </Link>
                  </div>
                </div>

                {(receipt.analysisSummary ||
                  receipt.aiArtifactBlob ||
                  receipt.extractedTextExcerpt ||
                  (receipt.extractionWarnings?.length ?? 0) > 0) && (
                  <div className="mt-4 rounded-lg border border-accent-yellow/20 bg-accent-yellow/5 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-accent-yellow">AI Evidence Intelligence</p>
                        {receipt.analysisSummary && (
                          <p className="mt-1 text-xs leading-relaxed text-zinc-300">{receipt.analysisSummary}</p>
                        )}
                        {receipt.extractedTextExcerpt && (
                          <div className="mt-3 rounded-lg border border-border/70 bg-black/35 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Extracted Text Preview</p>
                            <p className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-zinc-300">
                              {receipt.extractedTextExcerpt}
                            </p>
                          </div>
                        )}
                        {(receipt.extractionWarnings?.length ?? 0) > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {receipt.extractionWarnings?.map((warning, index) => (
                              <div
                                key={`${warning}-${index}`}
                                className="flex items-start gap-2 rounded-lg border border-accent-yellow/20 bg-black/25 px-3 py-2 text-[10px] text-zinc-300"
                              >
                                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-yellow" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {receipt.aiArtifactBlob && (
                        <div className="md:max-w-[260px]">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">AI Artifact Walrus Blob</p>
                          <p className="mt-1 break-all font-mono text-[9px] text-zinc-400">{receipt.aiArtifactBlob}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-border/70 bg-black/60 p-3 font-mono text-[9px] text-zinc-400">
                  DEMO_READOUT: TATUM_DATA_API={"job:"}{receipt.walrusJobId || "pending"} | WALRUS_BLOB={receipt.walrusBlob} | SUI_TX={receipt.suiTx || "pending"} | DEEPSEEK_ANALYSIS={receipt.extractionStatus || "pending"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-500">File Ingested:</span>
                    <span className="text-white font-semibold text-right break-all">{receipt.filename}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-500">SHA-256 Hash:</span>
                    <span className="text-zinc-300 font-mono text-[10px] break-all">{receipt.hash}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sui Seal Path:</span>
                    <span className="text-zinc-300 font-mono">Tatum Sui Devnet RPC</span>
                  </div>
                  {receipt.suiTx && (
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-500">Sui Tx Digest:</span>
                      <span className="text-accent-blue font-mono text-[10px] text-right break-all">{receipt.suiTx}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <span className="text-zinc-500">Walrus Proof Index:</span>
                    <span className="text-accent-green font-mono text-[10px] text-right break-all">{receipt.walrusBlob}</span>
                  </div>
                  {receipt.walrusJobId && (
                    <div className="flex justify-between gap-3">
                      <span className="text-zinc-500">Tatum Walrus Job:</span>
                      <span className="text-zinc-300 font-mono text-[10px] text-right break-all">{receipt.walrusJobId}</span>
                    </div>
                  )}
                  {receipt.walrusStatus && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Certification Status:</span>
                      <Badge variant="pending">{receipt.walrusStatus}</Badge>
                    </div>
                  )}
                  {receipt.tatumStatusCheckedAt && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tatum Status Check:</span>
                      <span className="text-zinc-300 font-mono text-[10px]">
                        {new Date(receipt.tatumStatusCheckedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/60 p-3 rounded-lg border border-border mt-4 font-mono text-[9px] text-zinc-500">
                [INFO] TATUM DATA API {"->"} Walrus upload job {receipt.walrusJobId || "pending"} | provider=tatum | sui_rpc=tatum_devnet_gateway
              </div>

              {statusError && (
                <div className="mt-3 rounded-lg border border-accent-red/30 bg-accent-red/10 p-3 text-[11px] text-accent-red">
                  {statusError}
                </div>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                {receipt.walrusJobId && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={refreshTatumStatus}
                    disabled={statusLoading}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${statusLoading ? "animate-spin" : ""}`} />
                    Refresh Tatum Job
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setReceipt(null)}>
                  Ingest Another File
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
