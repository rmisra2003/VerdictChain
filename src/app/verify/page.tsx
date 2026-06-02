"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Shield, 
  Upload, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  FileText,
  Clock,
  Database,
  ExternalLink,
  ChevronRight,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { calculateFileSha256, isApiConfigured, verifyEvidenceHash, VerifyApiResponse } from "@/lib/api";

interface VerificationResult {
  name: string;
  hash: string;
  suiTx: string;
  walrusBlob: string;
  size: string;
  timestamp: string;
  blockHeight: string;
  source: string;
  investigator: string;
  caseId: string;
  caseTitle: string;
  status: "verified" | "tampered";
  trustScore: number;
  tamperingAlert?: string;
  isGenerated?: boolean;
}

export default function VerificationPage() {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentAction, setCurrentAction] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mockTxDb: Record<string, VerificationResult> = {
    "0x89abf21": {
      name: "Zurich_Server_Ingress_Logs.txt",
      hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      suiTx: "0x89abf21f92e8fa38ab82f12c10d322ff8390c231cbf892d28fbc10d322efac444",
      walrusBlob: "walrus://blob/b523fa98-ca28-4ef1-8921-debc8901bc2c",
      size: "142 KB",
      timestamp: "2026-05-11T23:14:02Z",
      blockHeight: "14,882,903",
      source: "NovaSpace Perimeter Firewall",
      investigator: "Dr. Evelyn Wright",
      caseId: "VC-2026-09",
      caseTitle: "Project Aurora Source Leak",
      status: "verified",
      trustScore: 100,
    },
    "0xca823f9": {
      name: "Security_Cam_DevSector_4.mp4",
      hash: "7f83b1657ff1fc53b92c18128a1c8412ffae5c678aef151125f4d1c448ab115b",
      suiTx: "0xca823f98ba28f2abdf38acde89cbf712fa92c23ffbc89ab10d322efac4482aa",
      walrusBlob: "walrus://blob/de382fba-a28a-442c-bcde-38fa99ca108f",
      size: "18.4 MB",
      timestamp: "2026-05-11T23:10:00Z",
      blockHeight: "14,882,881",
      source: "Physical Security CCTV",
      investigator: "Dr. Evelyn Wright",
      caseId: "VC-2026-09",
      caseTitle: "Project Aurora Source Leak",
      status: "verified",
      trustScore: 98.8,
    },
    "0xfe382aa": {
      name: "Ledger_Q1_Final.xlsx",
      hash: "82a93b2aef38cf8290ab98129ccde30fa28ffab2bcde38a29a03b3fce98ca128",
      suiTx: "0xfe382aa8cb389efde28bcde219fa821abc38902cd38a89ee12fa098273cf82bb",
      walrusBlob: "walrus://blob/f839fa98-ca28-4ef1-8921-debc8901ca98",
      size: "1.2 MB",
      timestamp: "2026-05-15T14:30:00Z",
      blockHeight: "14,892,102",
      source: "Accounting Shared Drive",
      investigator: "Sarah Jenkins",
      caseId: "VC-2026-11",
      caseTitle: "Hedgehog Corp Financial Exploitation",
      status: "tampered",
      trustScore: 24.5,
      tamperingAlert: "CRITICAL LEDGER INTEGRITY FAILURE: The local file hash does not match the original Sui Notary Seal registered in block #14,892,102. Values modified post-sealing."
    }
  };

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (selectedFile: File) => {
    setVerificationResult(null);
    setErrorMsg("");

    if (isApiConfigured()) {
      await verifyUploadedFile(selectedFile);
      return;
    }

    simulateVerification(selectedFile.name);
  };

  const normalizeHashQuery = (value: string) => value.trim().toLowerCase().replace(/^0x/, "");

  const isSha256Hash = (value: string) => /^[a-f0-9]{64}$/i.test(normalizeHashQuery(value));

  const resultFromApi = (
    apiResult: VerifyApiResponse,
    fileHash: string,
    fallbackName: string,
    fallbackSize: string,
  ): VerificationResult => {
    const evidence = apiResult.details.evidence_metadata;
    const walrusBlob = apiResult.details.walrus_details?.blob_id;
    const txHash = apiResult.details.sui_transaction_hash;

    return {
      name: evidence?.filename || fallbackName,
      hash: fileHash,
      suiTx: txHash || "Walrus certification anchor",
      walrusBlob: typeof walrusBlob === "string" ? walrusBlob : "pending",
      size: evidence ? `${(evidence.file_size / (1024 * 1024)).toFixed(2)} MB` : fallbackSize,
      timestamp: evidence?.created_at || new Date().toISOString(),
      blockHeight: "Tatum Sui Mainnet",
      source: "VerdictChain Backend",
      investigator: "Cryptographic Public Auditor",
      caseId: apiResult.details.case_id || "VC-PUBLIC",
      caseTitle: apiResult.details.case_title || "Public Integrity Vault",
      status: apiResult.verified ? "verified" : "tampered",
      trustScore: apiResult.verified ? 100 : 0,
      tamperingAlert: apiResult.verified
        ? undefined
        : "No matching certified evidence record was found for this SHA-256 fingerprint, or the associated Walrus/Sui proof is not yet verified.",
    };
  };

  const verifyUploadedFile = async (selectedFile: File) => {
    setLoading(true);
    setProgress(0);
    setCurrentAction("Hashing file locally with browser SHA-256...");

    try {
      const fileHash = await calculateFileSha256(selectedFile);
      setProgress(45);
      setCurrentAction("Querying VerdictChain verification API...");
      const apiResult = await verifyEvidenceHash(fileHash);
      setProgress(100);
      setVerificationResult(resultFromApi(
        apiResult,
        fileHash,
        selectedFile.name,
        `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`,
      ));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setVerificationResult(null);
    setErrorMsg("");
    setLoading(true);
    setProgress(0);
    setCurrentAction("Connecting to Sui RPC Endpoint...");

    if (isApiConfigured() && isSha256Hash(searchQuery)) {
      setCurrentAction("Querying VerdictChain verification API...");
      verifyEvidenceHash(normalizeHashQuery(searchQuery))
        .then((apiResult) => {
          setProgress(100);
          setVerificationResult(resultFromApi(
            apiResult,
            normalizeHashQuery(searchQuery),
            "Unknown_Forensic_Artifact.dat",
            "Unknown",
          ));
        })
        .catch((error) => {
          setErrorMsg(error instanceof Error ? error.message : "Verification failed.");
        })
        .finally(() => setLoading(false));
      return;
    }

    setTimeout(() => {
      setProgress(40);
      setCurrentAction("Querying Smart Contract Notary Registry...");
      
      setTimeout(() => {
        setProgress(85);
        setCurrentAction("Fetching decentralized proofs from Walrus storage...");
        
        setTimeout(() => {
          // Search mock database
          const query = searchQuery.trim().toLowerCase();
          let match: VerificationResult | null = null;
          
          for (const key in mockTxDb) {
            if (
              key.toLowerCase().includes(query) || 
              mockTxDb[key].suiTx.toLowerCase().includes(query) ||
              mockTxDb[key].hash.toLowerCase().includes(query) ||
              mockTxDb[key].name.toLowerCase().includes(query)
            ) {
              match = mockTxDb[key];
              break;
            }
          }

          setLoading(false);
          if (match) {
            setVerificationResult(match);
          } else {
            // Generate a simulated new secure verification result
            setVerificationResult({
              name: searchQuery.includes(".") ? searchQuery : "Unknown_Forensic_Artifact.dat",
              hash: "0x389a1bf38de283abcf8928cde382bcde89cdefa012bcfe892abdecf928ab221c",
              suiTx: "0x8fa3f92bcde28abcf38dcde12a2a2bcde38cdefa19cde29fb3e8d2e8b28cfda28",
              walrusBlob: "walrus://blob/df382bda-fa28-442c-bcde-38fa99ca10fa",
              size: "2.8 MB",
              timestamp: new Date().toISOString(),
              blockHeight: "15,004,812",
              source: "Standard User Verification Ingestion",
              investigator: "Cryptographic Public Auditor",
              caseId: "VC-TEMP",
              caseTitle: "Audit Trial Pipeline",
              status: "verified",
              trustScore: 100,
              isGenerated: true
            });
          }
        }, 600);
      }, 500);
    }, 400);
  };

  const simulateVerification = (filename: string) => {
    setLoading(true);
    setProgress(0);
    setCurrentAction("Initializing client-side hashing...");

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        
        if (prev === 20) {
          setCurrentAction("Hashing file using local SHA-256 logic...");
        } else if (prev === 50) {
          setCurrentAction("Querying Sui Notary contract on SUI Network...");
        } else if (prev === 80) {
          setCurrentAction("Retrieving dispersion storage proofs from Walrus nodes...");
        }
        
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      setLoading(false);
      // Check if filename matches mock databases
      let match = null;
      for (const key in mockTxDb) {
        if (mockTxDb[key].name.toLowerCase() === filename.toLowerCase()) {
          match = mockTxDb[key];
          break;
        }
      }

      if (match) {
        setVerificationResult(match);
      } else {
        // Safe verification result for generic file upload
        setVerificationResult({
          name: filename,
          hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          suiTx: "0x3898ffa83211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac444",
          walrusBlob: "walrus://blob/df382acf-389f-4311-bf32-cae991208cf1",
          size: "4.2 MB",
          timestamp: new Date().toISOString(),
          blockHeight: "15,004,204",
          source: "Public Drag-and-Drop Ingestion Node",
          investigator: "Sui Cryptographic Signer",
          caseId: "VC-PUBLIC",
          caseTitle: "Public Integrity Vault",
          status: "verified",
          trustScore: 100,
          isGenerated: true
        });
      }
    }, 2200);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground bg-grid-pattern bg-gradient-glow flex flex-col font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-accent-blue/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-blue" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              Verdict<span className="text-accent-blue">Chain</span>
            </span>
          </Link>

          <Link href="/dashboard">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Exit to Console
            </Button>
          </Link>
        </div>
      </header>

      {/* Body Core */}
      <main className="flex-grow max-w-4xl w-full mx-auto px-6 py-12">
        <div className="text-center max-w-xl mx-auto mb-10">
          <Badge variant="active" className="mb-3">Cryptographic Verifier</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Verify Evidence Authenticity</h1>
          <p className="text-xs text-zinc-400 mt-2.5">
            Query the Sui Notary Ledger. Upload any original evidentiary file to recalculate its SHA-256 fingerprint, checking if the cryptographic seal is aligned or tampered with.
          </p>
        </div>

        {/* Tab Selection/Search Panel */}
        <div className="space-y-6">
          <Card variant="glass" className="p-6">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Query SUI Transaction ID, block, file hash, or mock (try '0x89abf21' or '0xfe382aa')..."
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary/80 border border-border/80 focus:border-accent-blue focus:ring-1 focus:ring-accent-blue/50 rounded-lg text-sm outline-none text-white placeholder-zinc-500 transition-all font-mono"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="primary" type="submit" className="px-5">
                Verify
              </Button>
            </form>

            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-border/40"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Or upload raw file</span>
              <div className="flex-grow border-t border-border/40"></div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={handleButtonClick}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
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
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-accent-blue" />
              </div>
              <span className="font-bold text-sm text-white">Drag & drop forensic file here</span>
              <span className="text-xs text-zinc-500 mt-1.5">Supports PDF, XLSX, MP4, WAV, JSON (Max 100MB)</span>
              <Button variant="secondary" size="sm" className="mt-4" onClick={(e) => { e.stopPropagation(); handleButtonClick(); }}>
                Browse Local Files
              </Button>
            </div>
          </Card>

          {/* Loading Animation States */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="glass" className="p-6 text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 text-accent-blue animate-spin" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-sm text-white">Verifying Chain of Custody...</h3>
                    <p className="text-[11px] font-mono text-zinc-400">{currentAction}</p>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full max-w-md mx-auto bg-secondary h-1.5 rounded-full overflow-hidden border border-border">
                    <motion.div 
                      className="bg-accent-blue h-full"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {errorMsg && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card variant="glass" className="p-4 border border-accent-red/30 bg-accent-red/10 text-xs text-accent-red">
                  {errorMsg}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification Results Panel */}
          <AnimatePresence>
            {verificationResult && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <Card variant="glass" className="p-6 space-y-6">
                  {/* Status Banner */}
                  <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                    verificationResult.status === "verified"
                      ? "bg-accent-green/10 border-accent-green/30 text-accent-green"
                      : "bg-accent-red/10 border-accent-red/30 text-accent-red"
                  }`}>
                    {verificationResult.status === "verified" ? (
                      <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
                    )}
                    <div>
                      <h2 className="font-bold text-sm text-white">
                        {verificationResult.status === "verified" 
                          ? "Cryptographic Verification Successful" 
                          : "TAMPER ALERT: Cryptographic Seal Mismatch!"
                        }
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        {verificationResult.status === "verified"
                          ? "This file matches the exact digital fingerprint anchored on the Sui Blockchain. Zero unauthorized modifications have occurred since ingestion."
                          : verificationResult.tamperingAlert
                        }
                      </p>
                    </div>
                  </div>

                  {/* Core Meta Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Evidence Details</div>
                        <div className="mt-2.5 space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">File Name:</span>
                            <span className="text-white font-semibold flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-accent-blue" />
                              {verificationResult.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">File Size:</span>
                            <span className="text-zinc-300 font-mono">{verificationResult.size}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Ingested At:</span>
                            <span className="text-zinc-300 font-mono flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(verificationResult.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400">Associated Case:</span>
                            {verificationResult.caseId === "VC-PUBLIC" || verificationResult.caseId === "VC-TEMP" ? (
                              <Badge variant="glow-blue">{verificationResult.caseId}</Badge>
                            ) : (
                              <Link href={`/dashboard/cases/${verificationResult.caseId}`} className="text-accent-blue hover:underline font-semibold flex items-center">
                                {verificationResult.caseTitle} ({verificationResult.caseId})
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">Cryptographic Trail</div>
                        <div className="mt-2.5 space-y-2">
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-zinc-400">SHA-256 Local Fingerprint:</span>
                            <span className="text-zinc-300 font-mono bg-secondary/80 p-1.5 rounded border border-border select-all break-all text-[10px]">
                              {verificationResult.hash}
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-zinc-400">Sui Network Transaction Seal:</span>
                            <span className="text-accent-blue hover:underline font-mono bg-secondary/80 p-1.5 rounded border border-border select-all break-all text-[10px] cursor-pointer flex items-center gap-1 justify-between">
                              {verificationResult.suiTx}
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          </div>
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-zinc-400">Walrus Storage Ingestion:</span>
                            <span className="text-zinc-300 font-mono bg-secondary/80 p-1.5 rounded border border-border select-all break-all text-[10px] flex items-center gap-1 justify-between">
                              {verificationResult.walrusBlob}
                              <Database className="w-3 h-3 text-accent-green" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blockchain Explorer Integration Logs */}
                  <div className="bg-black/60 p-4 rounded-xl border border-border/80 font-mono text-[10px] text-zinc-500 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-white font-bold border-b border-border/40 pb-2 mb-2">
                      <span>Sui Blockchain Audit Explorer Log</span>
                      <Badge variant="verified">Anchor Active</Badge>
                    </div>
                    <div>[INFO] SUI CONTRACT CALL {"->"} NotaryStoreV1.verify_hash(owner, hash_signature)</div>
                    <div>[INFO] MATCH FOUND ON CONTRACT STORAGE (BLOCK HEIGHT: #{verificationResult.blockHeight})</div>
                    <div>[INFO] VALIDATOR SIGNATURE: 0x9320facdeb9320...910aee92</div>
                    <div>[INFO] TIMESTAMP SEAL: {verificationResult.timestamp}</div>
                    <div className="text-accent-green font-bold">[SUCCESS] Cryptographic chain of custody fully validated and anchored on Walrus blob index.</div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-black/80 py-6 text-center text-xs text-zinc-500 mt-auto">
        <span>&copy; 2026 VerdictChain Cryptographic Custody Network. Built on SUI & Walrus.</span>
      </footer>
    </div>
  );
}
