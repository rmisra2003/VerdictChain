"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Shield, 
  Cpu, 
  Network, 
  CheckCircle, 
  ArrowRight, 
  FileText, 
  Video, 
  Lock, 
  Database,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [simulatedHash, setSimulatedHash] = useState("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b...");
  const [simulating, setSimulating] = useState(false);

  // Auto-rotate the blockchain verification flow steps
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerHashSimulation = () => {
    setSimulating(true);
    let counter = 0;
    const interval = setInterval(() => {
      const chars = "0123456789abcdef";
      let hex = "0x";
      for (let i = 0; i < 40; i++) {
        hex += chars[Math.floor(Math.random() * 16)];
      }
      setSimulatedHash(hex);
      counter++;
      if (counter > 15) {
        clearInterval(interval);
        setSimulatedHash("0x3898ffa83211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac444");
        setSimulating(false);
      }
    }, 100);
  };

  const steps = [
    {
      title: "1. Client-Side Cryptographic Seal",
      desc: "Every digital artifact (video, document, log) is processed locally. A unique SHA-256 fingerprint is generated instantly without uploading the raw file to maintain zero-trust integrity.",
      icon: <Lock className="w-5 h-5 text-accent-blue" />,
      color: "border-accent-blue"
    },
    {
      title: "2. Sui Consensus Anchoring",
      desc: "The document fingerprint is committed to the Sui Blockchain via our VerdictChain Notary Smart Contract. The timestamp, transaction hash, and blocks are immutably sealed.",
      icon: <Network className="w-5 h-5 text-accent-purple" />,
      color: "border-accent-purple"
    },
    {
      title: "3. Walrus Storage Proof",
      desc: "Evidence metadata and forensic logs are dispersed across Walrus storage nodes. An immutable blob ID is generated, allowing global, trustless proof of custody.",
      icon: <Database className="w-5 h-5 text-accent-green" />,
      color: "border-accent-green"
    }
  ];

  return (
    <div className="relative min-h-screen bg-background overflow-hidden text-foreground bg-grid-pattern bg-gradient-glow flex flex-col">
      {/* Top ambient glow light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-accent-blue/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[350px] h-[350px] bg-accent-purple/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center overflow-hidden">
              <Shield className="w-4 h-4 text-accent-blue group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-tr from-accent-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="font-bold tracking-tight text-lg text-white">
              Verdict<span className="text-accent-blue">Chain</span>
            </span>
            <Badge variant="glow-blue" className="text-[10px] py-0 px-1.5 font-normal tracking-wide">
              HACKATHON v1.0
            </Badge>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Platform Features</a>
            <a href="#verification-flow" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#architecture" className="hover:text-foreground transition-colors">Architecture</a>
            <Link href="/verify" className="hover:text-foreground transition-colors flex items-center gap-1">
              Verify Portal <ExternalLink className="w-3 h-3" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/verify">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Verify File
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="glow" size="sm" className="gap-1">
                Enter Console <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="active" className="mb-6 font-semibold uppercase tracking-wider text-[11px] gap-1 px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-ping" />
                Next-Gen Cryptographic Evidence Chain of Custody
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-white"
            >
              Tamper-Proof Forensics <br />
              <span className="bg-gradient-to-r from-accent-blue via-accent-purple to-accent-green bg-clip-text text-transparent">
                Anchored on SUI.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl"
            >
              VerdictChain establishes absolute cryptographic proof of digital custody for white-collar crime investigations. Leverage Sui consensus and Walrus storage to secure documents, CCTV footage, and chats from ingestion to courtroom verdict.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap gap-4 w-full sm:w-auto"
            >
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                  Launch Platform Console <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/verify" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                  Verify Proof <CheckCircle className="w-5 h-5 text-accent-green" />
                </Button>
              </Link>
            </motion.div>

            {/* Micro Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-12 pt-8 border-t border-border/40 grid grid-cols-3 gap-6 sm:gap-12"
            >
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">100%</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Zero-Trust Integrity</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">&lt; 2s</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Sui Consensus Seal</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white tracking-tight">Zero</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider mt-1">Server File Access</div>
              </div>
            </motion.div>
          </div>

          {/* Hero Right Visuals - Floating Evidence Cards */}
          <div className="lg:col-span-5 relative w-full h-[480px] flex items-center justify-center select-none">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />

            {/* Glowing Center Ring */}
            <div className="absolute w-72 h-72 rounded-full border border-dashed border-accent-blue/20 animate-[spin_60s_linear_infinite] flex items-center justify-center">
              <div className="w-60 h-60 rounded-full border border-dashed border-accent-purple/10 flex items-center justify-center" />
            </div>

            {/* Evidence Card 1 (Top Left) */}
            <motion.div
              initial={{ x: -60, y: -90, opacity: 0 }}
              animate={{ x: -50, y: -70, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 50 }}
              whileHover={{ y: -80, scale: 1.03 }}
              className="absolute left-4 top-20 z-10"
            >
              <Card variant="glow-blue" className="w-[220px] p-3 text-[11px] backdrop-blur-md bg-black/80">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <FileText className="w-3.5 h-3.5 text-accent-blue" />
                    Ledger_Q1_Audit.xlsx
                  </div>
                  <Badge variant="verified" className="text-[9px] py-0 px-1.5 font-bold">VERIFIED</Badge>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 truncate mb-1.5">
                  SHA-256: b12a83e...a24f
                </div>
                <div className="flex items-center justify-between text-zinc-400 mt-2 pt-1.5 border-t border-border/20">
                  <span>Walrus Storage Proof</span>
                  <span className="font-semibold text-white">walrus://blob/12f9...</span>
                </div>
              </Card>
            </motion.div>

            {/* Evidence Card 2 (Bottom Right) */}
            <motion.div
              initial={{ x: 60, y: 90, opacity: 0 }}
              animate={{ x: 50, y: 70, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 50 }}
              whileHover={{ y: 80, scale: 1.03 }}
              className="absolute right-4 bottom-20 z-10"
            >
              <Card variant="glow-purple" className="w-[230px] p-3 text-[11px] backdrop-blur-md bg-black/80">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 text-white font-semibold">
                    <Video className="w-3.5 h-3.5 text-accent-purple" />
                    CCTV_DevSector_4.mp4
                  </div>
                  <Badge variant="tampered" className="text-[9px] py-0 px-1.5 font-bold">TAMPERED</Badge>
                </div>
                <div className="text-[10px] font-mono text-zinc-500 truncate mb-1.5">
                  Hash: 7f83b165...ab11
                </div>
                <div className="text-accent-red/90 text-[10px] bg-accent-red/10 border border-accent-red/20 rounded p-1 font-medium mt-1 leading-snug">
                  Error: original blockchain seal has mismatch at block #14,892,102.
                </div>
              </Card>
            </motion.div>

            {/* Central Decoupled Seal Node */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
              className="relative w-36 h-36 rounded-full bg-gradient-to-tr from-[#0b0c0e] to-[#121316] border border-border/80 flex flex-col items-center justify-center shadow-2xl z-20"
            >
              <div className="w-16 h-16 rounded-full bg-accent-blue/10 border border-accent-blue/30 flex items-center justify-center shadow-[0_0_20px_rgba(56,152,255,0.15)] mb-1">
                <Shield className="w-7 h-7 text-accent-blue" />
              </div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Protocol Active</span>
            </motion.div>
          </div>
        </section>

        {/* Sponsor/Partners Showcase */}
        <section className="border-y border-border/40 bg-black/40 py-10 relative">
          <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Integrations supporting world-class chain of custody
            </span>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-12 sm:gap-24 opacity-60 hover:opacity-85 transition-opacity duration-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/10 rounded border border-white/20 flex items-center justify-center text-xs font-bold text-white tracking-tighter">W</div>
                <span className="text-base font-bold tracking-tight text-white">WALRUS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-accent-blue/20 rounded border border-accent-blue/30 flex items-center justify-center text-xs font-bold text-accent-blue tracking-tighter">S</div>
                <span className="text-base font-bold tracking-tight text-white">SUI BLOCKCHAIN</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-accent-purple/20 rounded border border-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple tracking-tighter">T</div>
                <span className="text-base font-bold tracking-tight text-white">TATUM API</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Verification Flow Demo */}
        <section id="verification-flow" className="py-24 max-w-7xl mx-auto px-6 relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge variant="glow-blue">INSPECT PROTOCOL</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mt-4 text-white">
              The Immutable Custody Flow
            </h2>
            <p className="text-zinc-400 mt-4">
              VerdictChain establishes absolute security by keeping files local, sealing indexes on SUI, and preserving audits on Walrus storage proofs.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Interactive Demo Left Panel */}
            <div className="lg:col-span-5 space-y-4">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveStep(idx)}
                  className={`p-5 rounded-xl border text-left cursor-pointer transition-all duration-300 ${
                    activeStep === idx 
                      ? `${step.color} bg-secondary/80 shadow-[0_4px_20px_rgba(0,0,0,0.3)]` 
                      : "border-border/40 bg-black/20 opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-secondary border border-border">
                      {step.icon}
                    </div>
                    <h3 className="font-bold text-white text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed mt-2.5">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Interactive Demo Right Console Panel */}
            <div className="lg:col-span-7 h-full">
              <Card variant="glass" className="h-[340px] flex flex-col p-6 font-mono text-[11px] text-zinc-400 border border-border relative overflow-hidden scanline bg-[#09090b]">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4 text-xs font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                    <span>VerdictChain Custody Console</span>
                  </div>
                  <span className="text-[9px] text-zinc-500">Terminal Connected</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  <div>
                    <span className="text-accent-blue">$</span>{" hash_calculator --file=\"Corporate_Intel_Formula.pdf\""}
                    <div className="text-zinc-500 mt-1">Calculating local SHA-256 fingerprint without server egress...</div>
                  </div>
                  <div>
                    <div className="text-zinc-300 font-bold bg-secondary/50 p-2 rounded border border-border truncate mt-1">
                      {simulatedHash}
                    </div>
                  </div>
                  
                  {activeStep >= 1 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      <span className="text-accent-purple">$</span>{` sui_anchor --hash="${simulatedHash.slice(0, 10)}..." --network="mainnet"`}
                      <div className="text-accent-green mt-1">✔ Transaction settled on Sui Consensus. Anchor verified!</div>
                      <div className="text-zinc-500">Block ID: #14,890,202 | Transaction ID: 0x8a23fa...8921</div>
                    </motion.div>
                  )}

                  {activeStep >= 2 && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                      <span className="text-accent-green">$</span> walrus_blob_storage --verify
                      <div className="text-zinc-300 mt-1">Preserved on decentralized Walrus storage.</div>
                      <div className="text-zinc-500">Blob Address: walrus://blob/ab93fa-ca28-4ef1-8921-debc890</div>
                    </motion.div>
                  )}
                </div>

                <div className="border-t border-border/40 pt-3 flex items-center justify-between mt-auto">
                  <span className="text-xs">Secure Cryptographic Anchor Proof</span>
                  <Button 
                    variant="glow" 
                    size="sm" 
                    className="text-[10px] px-2 py-1 font-semibold"
                    onClick={triggerHashSimulation}
                    disabled={simulating}
                  >
                    {simulating ? "Simulating..." : "Trigger Simulation"}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="features" className="py-24 border-t border-border/40 bg-black/20 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto">
              <Badge variant="glow-blue">FORENSICS ENGINE</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-4">
                Enterprise Investigation Arsenal
              </h2>
              <p className="text-zinc-400 mt-3">
                VerdictChain supplies all the tools crucial to track, verify, and resolve white-collar crimes securely.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
              <Card variant="interactive" className="p-6">
                <div className="w-10 h-10 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center mb-5">
                  <Shield className="w-5 h-5 text-accent-blue" />
                </div>
                <h3 className="font-bold text-white text-base">Cryptographic Chain of Custody</h3>
                <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                  Anchor evidence files instantly on Sui Network. Establish zero-trust proof of ingestion time and source integrity to protect evidence in court.
                </p>
              </Card>

              <Card variant="interactive" className="p-6">
                <div className="w-10 h-10 rounded-lg bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center mb-5">
                  <Network className="w-5 h-5 text-accent-purple" />
                </div>
                <h3 className="font-bold text-white text-base">Entity Contradiction Graphs</h3>
                <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                  Map files, actors, and timelines via a React Flow workspace. Uncover contradictions between witness statements and immutable cryptographic ledgers.
                </p>
              </Card>

              <Card variant="interactive" className="p-6">
                <div className="w-10 h-10 rounded-lg bg-accent-green/15 border border-accent-green/30 flex items-center justify-center mb-5">
                  <Cpu className="w-5 h-5 text-accent-green" />
                </div>
                <h3 className="font-bold text-white text-base">AI Forensics Agent</h3>
                <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                  Collaborate with an integrated AI detective to analyze spreadsheets, CCTV logs, and chats. Instant extraction of metadata and anomaly tracking.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* System Architecture Visualization */}
        <section id="architecture" className="py-24 border-t border-border/40 relative">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="glow-blue">SYSTEM ARCHITECTURE</Badge>
              <h2 className="text-3xl font-bold tracking-tight text-white mt-4">
                Enterprise Node Infrastructure
              </h2>
              <p className="text-zinc-400 mt-3">
                Robust zero-trust topology syncing client-side verification to decentralized networks.
              </p>
            </div>

            {/* Vector architecture diagram mockup */}
            <Card variant="glass" className="p-8 bg-[#09090b]/80 border border-border/60">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center justify-center relative">
                {/* Node 1 */}
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <FileText className="w-7 h-7 text-accent-blue mb-2.5 animate-pulse" />
                  <span className="font-bold text-white text-xs">Ingestion Interface</span>
                  <span className="text-[9px] text-zinc-500 mt-1">Client-Side SHA-256</span>
                </div>
                {/* Arrow */}
                <div className="hidden md:flex justify-center text-zinc-600 font-bold">&rarr;</div>

                {/* Node 2 */}
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Shield className="w-7 h-7 text-accent-purple mb-2.5" />
                  <span className="font-bold text-white text-xs">VerdictChain Notary Contract</span>
                  <span className="text-[9px] text-zinc-500 mt-1">Anchoring & Verification</span>
                </div>
                {/* Arrow */}
                <div className="hidden md:flex justify-center text-zinc-600 font-bold">&rarr;</div>

                {/* Node 3 */}
                <div className="flex flex-col items-center p-4 bg-secondary rounded-lg border border-border">
                  <Database className="w-7 h-7 text-accent-green mb-2.5" />
                  <span className="font-bold text-white text-xs">Sui Ledger & Walrus Blobs</span>
                  <span className="text-[9px] text-zinc-500 mt-1">Immutable Storage</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Premium CTA Section */}
        <section className="py-28 relative overflow-hidden border-t border-border/40">
          {/* Glowing bottom grid light */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Secure Your Forensic <br />
              <span className="bg-gradient-to-r from-accent-blue to-accent-purple bg-clip-text text-transparent">
                Chains of Custody?
              </span>
            </h2>
            <p className="text-zinc-400 mt-6 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Equip your legal, corporate security, and forensic investigation units with VerdictChain&apos;s untamperable verification.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button variant="glow" size="lg" className="w-full sm:w-auto gap-2">
                  Launch Enterprise Console <ArrowRight className="w-4.5 h-4.5" />
                </Button>
              </Link>
              <Link href="/verify" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Cryptographic Verifier
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-black/80 py-8 text-center text-xs text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; 2026 VerdictChain Technologies Inc. All rights reserved.</span>
          <div className="flex gap-6">
            <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-300">Terms of Custody</a>
            <a href="#" className="hover:text-zinc-300">SUI Explorer Node</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
