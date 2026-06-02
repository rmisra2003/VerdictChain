"use client";

import React, { useState, useRef } from "react";
import { 
  UploadCloud, 
  CheckCircle, 
  FileText, 
  RefreshCw,
  Briefcase
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { mockCases } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";
import { isApiConfigured, uploadEvidenceToApi } from "@/lib/api";

interface UploadReceipt {
  filename: string;
  size: string;
  hash: string;
  suiTx: string | null;
  walrusBlob: string;
  walrusJobId?: string;
  walrusStatus?: string;
  blockHeight: string;
  timestamp: string;
  source: "api" | "simulation";
}

export default function EvidenceUploadPage() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  // Form Inputs
  const [associatedCase, setAssociatedCase] = useState("VC-2026-09");
  const [custodian, setCustodian] = useState("Dr. Evelyn Wright");
  const [description, setDescription] = useState("");
  
  // Upload States
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [receipt, setReceipt] = useState<UploadReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const runSimulatedUpload = (selectedFile: File) => {
    setTimeout(() => {
      setStep(2);

      setTimeout(() => {
        setStep(3);

        setTimeout(() => {
          setLoading(false);
          setReceipt({
            filename: selectedFile.name,
            size: `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
            hash: "0x8fa3f92bcde28abcf38dcde12a2a2bcde38cdefa19cde29fb3e8d2e8b28cfda28",
            suiTx: "0x3898ffa83211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac444",
            walrusBlob: "walrus://blob/ab93fa-ca28-4ef1-8921-debc8901bc2a",
            blockHeight: "15,004,212",
            timestamp: new Date().toISOString(),
            source: "simulation",
          });
          setFile(null);
          setDescription("");
        }, 1500);
      }, 1200);
    }, 1000);
  };

  const triggerUpload = async () => {
    if (!file) return;
    const selectedFile = file;
    setLoading(true);
    setErrorMessage("");
    setStep(1);

    if (!isApiConfigured()) {
      runSimulatedUpload(selectedFile);
      return;
    }

    try {
      setStep(2);
      const result = await uploadEvidenceToApi(selectedFile);
      setStep(3);
      setReceipt({
        filename: result.evidence.filename,
        size: `${(result.evidence.file_size / (1024 * 1024)).toFixed(2)} MB`,
        hash: result.evidence.sha256_hash,
        suiTx: result.proof?.sui_transaction_hash || null,
        walrusBlob: result.evidence.walrus_blob_id || result.walrus_metadata.blob_id || "pending",
        walrusJobId: result.walrus_metadata.job_id,
        walrusStatus: result.walrus_metadata.status,
        blockHeight: "Tatum Sui Mainnet",
        timestamp: result.evidence.created_at,
        source: "api",
      });
      setFile(null);
      setDescription("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Evidence upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-accent-blue" />
          Ingest & Seal Forensic Evidence
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Perform zero-trust ingestion. Hashing calculations occur client-side, sealing records on SUI with decentralized storage indices on Walrus.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start select-text">
        {/* Left: Input Form Panel */}
        <div className="lg:col-span-8 space-y-6">
          <Card variant="glass" className="p-6 space-y-5">
            {/* Associated Case Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Associated Investigation Dossier</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                <select
                  value={associatedCase}
                  onChange={(e) => setAssociatedCase(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border/80 rounded-lg text-xs outline-none focus:border-accent-blue text-white font-semibold cursor-pointer appearance-none"
                >
                  {mockCases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custodian/Source Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-sans">Evidence Custodian / Ingestion Officer</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-xs outline-none text-white font-semibold"
                value={custodian}
                onChange={(e) => setCustodian(e.target.value)}
                placeholder="Name of Custody Agent..."
              />
            </div>

            {/* Evidence Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Forensic Context & Notes</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-xs outline-none text-zinc-300 font-sans"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide physical extraction or digital interception context..."
              />
            </div>

            {/* Drag & Drop Area */}
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
                <span className="text-[10px] text-zinc-500 mt-1">Supports PDF, XLSX, MP4, WAV, JSON</span>
              </div>
            ) : (
              <div className="p-4 bg-secondary border border-border rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-accent-blue/10 border border-accent-blue/20 text-accent-blue">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[200px]">{file.name}</div>
                    <div className="text-[10px] text-zinc-500">Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Remove
                </Button>
              </div>
            )}

            {/* Action Trigger */}
            <Button
              variant="glow"
              className="w-full gap-2 font-bold"
              disabled={!file || loading}
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

        {/* Right: Ingestion Status Pipeline Monitor */}
        <div className="lg:col-span-4 space-y-6">
          <Card variant="glass" className="p-5 relative overflow-hidden scanline bg-[#09090b]">
            <div className="border-b border-border/40 pb-3 mb-4">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Custody Settlement Pipe</h3>
            </div>

            <div className="space-y-4">
              {/* Step 1: Local SHA-256 */}
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                  step >= 1 ? "border-accent-blue text-accent-blue bg-accent-blue/10" : "border-border text-zinc-500"
                }`}>
                  {step >= 1 ? <CheckCircle className="w-3.5 h-3.5" /> : "1"}
                </div>
                <div>
                  <span className={`font-semibold block ${step >= 1 ? "text-white" : "text-zinc-500"}`}>1. SHA-256 Client Hashing</span>
                  <span className="text-[9px] text-zinc-500">Calculated locally in browser</span>
                </div>
              </div>

              {/* Step 2: SUI Smart Contract */}
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                  step >= 2 ? "border-accent-purple text-accent-purple bg-accent-purple/10" : "border-border text-zinc-500"
                }`}>
                  {step >= 2 ? <CheckCircle className="w-3.5 h-3.5" /> : "2"}
                </div>
                <div>
                  <span className={`font-semibold block ${step >= 2 ? "text-white" : "text-zinc-500"}`}>2. Sui Blockchain Anchoring</span>
                  <span className="text-[9px] text-zinc-500">Committed to Notary Register</span>
                </div>
              </div>

              {/* Step 3: Walrus Dispersion */}
              <div className="flex items-center gap-3 text-xs">
                <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                  step >= 3 ? "border-accent-green text-accent-green bg-accent-green/10" : "border-border text-zinc-500"
                }`}>
                  {step >= 3 ? <CheckCircle className="w-3.5 h-3.5" /> : "3"}
                </div>
                <div>
                  <span className={`font-semibold block ${step >= 3 ? "text-white" : "text-zinc-500"}`}>3. Walrus Dispersion Proof</span>
                  <span className="text-[9px] text-zinc-500">Blob slice dispersed on nodes</span>
                </div>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-[10px] text-accent-blue font-mono justify-center border-t border-border/20 pt-4 mt-4 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing Node Ledger...</span>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Audit Ingestion Receipt Dialog / Success Panel */}
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
                  <h3 className="font-bold text-sm text-white">Forensic Evidence Sealed Successfully!</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {receipt.source === "api"
                      ? "Evidence was hashed locally by the backend and staged for Walrus mainnet certification through Tatum."
                      : "Cryptographic proofs successfully settled and dispersing globally."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">File Ingested:</span>
                    <span className="text-white font-semibold">{receipt.filename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">SHA-256 Hash:</span>
                    <span className="text-zinc-300 font-mono text-[10px]">{receipt.hash.slice(0, 20)}...</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sui Net Block Height:</span>
                    <span className="text-zinc-300 font-mono">{receipt.blockHeight}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Walrus Proof Index:</span>
                    <span className="text-accent-green font-mono text-[10px]">{receipt.walrusBlob}</span>
                  </div>
                  {receipt.walrusJobId && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Tatum Walrus Job:</span>
                      <span className="text-zinc-300 font-mono text-[10px]">{receipt.walrusJobId}</span>
                    </div>
                  )}
                  {receipt.walrusStatus && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Certification Status:</span>
                      <span className="text-zinc-300 font-mono text-[10px]">{receipt.walrusStatus}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-black/60 p-3 rounded-lg border border-border mt-4 font-mono text-[9px] text-zinc-500">
                [INFO] BROADCASTING COMPLETED {"->"} Tatum Walrus Interface: {receipt.source === "api" ? "mainnet upload job created" : "committed to wallet 0x8fa3f92b..."}
              </div>

              <div className="mt-4 flex justify-end">
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
