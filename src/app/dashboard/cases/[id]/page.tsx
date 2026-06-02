"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Video, 
  Volume2, 
  MessageSquare, 
  Send,
  Download,
  ExternalLink,
  Bot
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockCases, EvidenceItem } from "@/data/mockData";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_AUDIO_WAVE = [12, 24, 8, 30, 45, 18, 22, 9, 34, 12, 6, 29, 41, 16, 22, 10, 31, 26, 12, 4];

type ActiveTab = "evidence" | "timeline" | "ai" | "report";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "evidence", label: "Evidence Vault Viewer" },
  { id: "timeline", label: "Custody Timeline" },
  { id: "ai", label: "AI Forensic Detective" },
  { id: "report", label: "Forensic Report" },
];

export default function CaseWorkspace() {
  const { id } = useParams();
  const caseId = Array.isArray(id) ? id[0] : id;
  const currentCase = mockCases.find((c) => c.id === caseId) || mockCases[0];

  const [activeTab, setActiveTab] = useState<ActiveTab>("evidence");
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem>(currentCase.evidenceItems[0]);

  // AI Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: `Welcome to the Autonomous Forensic Investigation terminal. I am your AI investigator. I have ingested all cryptographic nodes related to ${currentCase.title}. Ask me to analyze contradictions, extract entity hashes, or summarize custody lines.`,
      timestamp: "11:17 UTC"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Audio Preview Animation Simulation
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioWave, setAudioWave] = useState<number[]>(INITIAL_AUDIO_WAVE);

  useEffect(() => {
    if (!audioPlaying) return;
    const interval = setInterval(() => {
      setAudioWave(prev => prev.map(() => Math.floor(Math.random() * 45) + 3));
    }, 150);
    return () => clearInterval(interval);
  }, [audioPlaying]);

  // Handle selected evidence switch
  const selectEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item);
    setAudioPlaying(false);
    setAudioWave(INITIAL_AUDIO_WAVE);
  };

  // AI Chat submit handler
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = {
      sender: "user",
      text: chatInput,
      timestamp: "Just Now"
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponse = "";
      const textLower = userMsg.text.toLowerCase();

      if (textLower.includes("contradict") || textLower.includes("anomaly")) {
        if (currentCase.id === "VC-2026-11") {
          aiResponse = `⚠️ CRITICAL CONTRADICTION DETECTED: 
1. **Ledger Spreadsheet Mismatch**: Ledger file 'Ledger_Q1_Final.xlsx' was sealed in Sui Block #14,892,102 (Sui Tx: 0xfe382aa...). The current active file has a SHA-256 mismatch ending in 'c128' (original seal: 'a24f').
2. **Wire Transfer Link**: Accountant CFO Marcus Finch recorded a consulting fee payout of $4,850,000.00 to Apex Advisory LLC. Subpoenaed bank records confirm Apex Advisory is owned directly by Richard Finch (brother of CFO Marcus Finch). 
Recommendation: Initiate freezing protocol on Apex Advisory ledger nodes instantly.`;
        } else {
          aiResponse = `📊 ANOMALY AUDIT: All evidence nodes for ${currentCase.title} are validated. 
- Zurich Firewall Egress matches file sizes of quantum tar archives exactly.
- DevSector-4 CCTV recordings show Marcus Vance accessing local terminal 192.168.1.42 matching Session Start times. 
Chain integrity is 99.4%. Proceed to generate prosecution reports.`;
        }
      } else if (textLower.includes("extract") || textLower.includes("entity")) {
        aiResponse = `🔍 ENTITY RELATIONSHIPS MAP EXTRACTED:
- **Actor Nodes**: Marcus Vance (Lead Engineer), Dr. Wright (Investigator), Contact X (External Target)
- **Document Nodes**: Zurich Ingress Logs, DevSector CCTV Camera 4, Personal Mobile Telegram dump
- **Blockchain Anchors**: 4 secure Tatum SUI smart contract settlements.`;
      } else {
        aiResponse = `Ingested queries processed. I recommend exploring:
1. "Show all contradictions and ledger anomalies"
2. "Extract entity relationship hashes"
3. "Generate SUI Blockchain anchor integrity logs"`;
      }

      const aiMessage: ChatMessage = {
        sender: "ai",
        text: aiResponse,
        timestamp: "Just Now"
      };

      setMessages((prev) => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const selectSuggestedQuestion = (question: string) => {
    setChatInput(question);
  };

  return (
    <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto font-sans">
      {/* Top Banner Navigation */}
      <div className="lg:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/cases">
            <button className="p-1.5 rounded-lg bg-secondary border border-border text-zinc-400 hover:text-white transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="glow-blue" className="font-mono">{currentCase.id}</Badge>
              <h1 className="text-xl font-bold tracking-tight text-white">{currentCase.title}</h1>
            </div>
            <p className="text-xs text-zinc-500">{currentCase.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge variant={currentCase.status === "active" ? "active" : "closed"}>
            Status: {currentCase.status}
          </Badge>
          <Badge variant={currentCase.trustScore > 60 ? "verified" : "tampered"}>
            Trust Score: {currentCase.trustScore}%
          </Badge>
        </div>
      </div>

      {/* Main Investigative tabs controls */}
      <div className="lg:col-span-8 space-y-6">
        <div className="flex border-b border-border/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all select-none ${
                activeTab === tab.id
                  ? "border-accent-blue text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <AnimatePresence mode="wait">
          {activeTab === "evidence" && (
            <motion.div 
              key="evidence" 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              {/* Evidence Sidebar Selector */}
              <div className="md:col-span-4 space-y-3">
                <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">Evidence Files</h3>
                <div className="space-y-2">
                  {currentCase.evidenceItems.map((item) => {
                    const isSelected = selectedEvidence.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => selectEvidence(item)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? "bg-secondary border-accent-blue shadow-lg shadow-black/20"
                            : "bg-black/10 border-border/40 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          {item.type === "document" && <FileText className={`w-4 h-4 ${isSelected ? "text-accent-blue" : "text-zinc-500"}`} />}
                          {item.type === "media" && <Video className={`w-4 h-4 ${isSelected ? "text-accent-blue" : "text-zinc-500"}`} />}
                          {item.type === "audio" && <Volume2 className={`w-4 h-4 ${isSelected ? "text-accent-blue" : "text-zinc-500"}`} />}
                          {item.type === "chat" && <MessageSquare className={`w-4 h-4 ${isSelected ? "text-accent-blue" : "text-zinc-500"}`} />}
                          <span className="font-bold text-white text-[11px] truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                          <span>{item.size}</span>
                          <Badge variant={item.status === "verified" ? "verified" : "tampered"} className="text-[8px] py-0 px-1 font-bold">
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Evidence Media Inspector Panel */}
              <div className="md:col-span-8">
                <Card variant="glass" className="p-6 flex flex-col h-[400px]">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
                    <div>
                      <h3 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-accent-blue" />
                        {selectedEvidence.name}
                      </h3>
                      <span className="text-[9px] text-zinc-500 font-mono">Source: {selectedEvidence.source}</span>
                    </div>
                    <Badge variant={selectedEvidence.status === "verified" ? "verified" : "tampered"}>
                      Seal Integrity: {selectedEvidence.trustScore}%
                    </Badge>
                  </div>

                  {/* Previews based on category */}
                  <div className="flex-1 overflow-y-auto bg-black/60 rounded-lg border border-border/60 p-4 font-mono text-[10px] leading-relaxed text-zinc-400 select-text">
                    {selectedEvidence.type === "document" && (
                      <pre className="whitespace-pre-wrap font-mono">{selectedEvidence.content}</pre>
                    )}

                    {selectedEvidence.type === "chat" && (
                      <pre className="whitespace-pre-wrap font-mono">{selectedEvidence.content}</pre>
                    )}

                    {selectedEvidence.type === "media" && (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <Video className="w-12 h-12 text-accent-blue animate-pulse" />
                        <div className="space-y-1">
                          <span className="text-white text-xs font-semibold">Video Surveillance Stream</span>
                          <p className="text-[10px] text-zinc-500 max-w-sm">{selectedEvidence.content}</p>
                        </div>
                      </div>
                    )}

                    {selectedEvidence.type === "audio" && (
                      <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                        {/* Interactive Waveform Animation */}
                        <div className="flex items-center gap-1 h-12">
                          {audioWave.map((h, i) => (
                            <motion.div
                              key={i}
                              className="w-1 bg-accent-blue rounded-full"
                              animate={{ height: `${h}px` }}
                              transition={{ duration: 0.1 }}
                            />
                          ))}
                        </div>

                        <div className="space-y-3">
                          <Button 
                            variant="glow" 
                            size="sm" 
                            onClick={() => {
                              if (audioPlaying) setAudioWave(INITIAL_AUDIO_WAVE);
                              setAudioPlaying(!audioPlaying);
                            }}
                            className="font-bold text-xs px-6"
                          >
                            {audioPlaying ? "Pause Forensic Playback" : "Play Audio Intercept"}
                          </Button>
                          <p className="text-[9px] text-zinc-500 font-sans max-w-xs">{selectedEvidence.content}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cryptographic metadata seals bottom bar */}
                  <div className="border-t border-border/40 pt-3 flex items-center justify-between text-[9px] font-mono text-zinc-500 select-text mt-3">
                    <span className="truncate max-w-[200px]">SHA-256: {selectedEvidence.hash}</span>
                    <span className="text-accent-blue cursor-pointer hover:underline flex items-center gap-0.5">
                      Verify Sui Explorer <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </Card>
              </div>
            </motion.div>
          )}

          {/* Timeline Tab */}
          {activeTab === "timeline" && (
            <motion.div 
              key="timeline" 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="space-y-6"
            >
              <div className="relative pl-6 space-y-6">
                <div className="absolute left-[7px] top-2 bottom-2 w-[1.5px] bg-border/60" />
                {currentCase.timelineEvents.map((ev) => (
                  <div key={ev.id} className="relative text-xs group select-text">
                    {/* Pulsing checkpoint dot */}
                    <div className={`absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border bg-background flex items-center justify-center ${
                      ev.status === "warning"
                        ? "border-accent-red shadow-[0_0_8px_rgba(239,68,68,0.2)] animate-pulse"
                        : "border-accent-green shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        ev.status === "warning" ? "bg-accent-red" : "bg-accent-green"
                      }`} />
                    </div>

                    <Card variant="glass" className="p-4 space-y-1 bg-black/20 hover:border-accent-blue/30 transition-all duration-300">
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-white tracking-tight">{ev.title}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{new Date(ev.timestamp).toUTCString()}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mt-1">
                        {ev.description}
                      </p>
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-2 border-t border-border/20 mt-2">
                        <span>Actor: <span className="text-zinc-300 font-semibold">{ev.actor}</span></span>
                        <span>Sui Block Seal: <span className="text-accent-blue cursor-pointer hover:underline">{ev.txHash}</span></span>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* AI Forensic Detective Chat Tab */}
          {activeTab === "ai" && (
            <motion.div 
              key="ai" 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <Card variant="glass" className="h-[420px] flex flex-col p-4">
                {/* Chat Header */}
                <div className="flex items-center gap-2 border-b border-border/40 pb-3 mb-4 shrink-0">
                  <div className="p-1 rounded bg-accent-blue/10 border border-accent-blue/20">
                    <Bot className="w-5 h-5 text-accent-blue" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white">VerdictChain AI Forensic Agent</h3>
                    <span className="text-[9px] text-accent-green font-semibold">Autonomous Investigation Model Active</span>
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-grow overflow-y-auto space-y-4 pr-1 scrollbar-thin select-text">
                  {messages.map((m, idx) => (
                    <div key={idx} className={`flex items-start gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                      {m.sender === "ai" && (
                        <div className="w-6 h-6 rounded-full bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center text-accent-blue shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div className={`p-3 rounded-xl max-w-[80%] text-xs leading-relaxed border ${
                        m.sender === "user"
                          ? "bg-accent-blue/10 border-accent-blue/30 text-white"
                          : "bg-secondary/60 border-border/80 text-zinc-300"
                      }`}>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      </div>
                    </div>
                  ))}

                  {/* AI typing simulation */}
                  {isTyping && (
                    <div className="flex items-start gap-2.5 justify-start">
                      <div className="w-6 h-6 rounded-full bg-accent-blue/15 border border-accent-blue/40 flex items-center justify-center text-accent-blue shrink-0">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                      <div className="p-3 rounded-xl bg-secondary/60 border border-border/80 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-75" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce delay-150" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Questions */}
                <div className="flex flex-wrap gap-2 py-3 border-t border-border/20 shrink-0">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider py-1 select-none">Quick Queries:</span>
                  <button 
                    onClick={() => selectSuggestedQuestion("Show contradictions and anomalies")}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-semibold text-zinc-400 hover:text-white rounded border border-border"
                  >
                    Contradictions Found?
                  </button>
                  <button 
                    onClick={() => selectSuggestedQuestion("Extract all entity map relationship nodes")}
                    className="px-2.5 py-1 bg-secondary text-[10px] font-semibold text-zinc-400 hover:text-white rounded border border-border"
                  >
                    Extract Entity Nodes
                  </button>
                </div>

                {/* Chat Input form */}
                <form onSubmit={handleChatSubmit} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    placeholder="Ask AI Investigator natural queries about this case..."
                    className="flex-grow px-3 py-2 bg-secondary border border-border focus:border-accent-blue rounded-lg text-xs outline-none text-white font-sans"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                  />
                  <Button variant="primary" size="sm" type="submit">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </Card>
            </motion.div>
          )}

          {/* Audit Forensic Report Tab */}
          {activeTab === "report" && (
            <motion.div 
              key="report" 
              initial={{ opacity: 0, y: 5 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <Card variant="glass" className="p-6 relative select-text">
                <div className="absolute top-5 right-5">
                  <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold" onClick={() => window.print()}>
                    <Download className="w-4 h-4" /> Export Signed PDF
                  </Button>
                </div>

                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-zinc-300 font-sans space-y-4">
                  <pre className="whitespace-pre-wrap font-sans text-xs bg-transparent p-0 text-zinc-300">
                    {currentCase.report}
                  </pre>
                </div>

                <div className="border-t border-border/40 pt-6 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 text-[10px] font-mono">
                  <div className="space-y-1">
                    <span className="text-zinc-500">VerdictChain Secure Notary Seal:</span>
                    <div className="text-accent-blue truncate">SUI-BLOCK-#{currentCase.blockchainHash.slice(0, 20)}...</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-500">Walrus Storage Ingest Anchor:</span>
                    <div className="text-zinc-300 truncate">{currentCase.walrusStorageProof}</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Case Vault Right Details Sidebar */}
      <div className="lg:col-span-4 space-y-6 select-text">
        <Card variant="glass" className="p-5 space-y-5">
          <div className="border-b border-border/40 pb-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Investigative Custody Dossier</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-zinc-500 font-semibold block">Lead Investigator:</span>
              <span className="text-zinc-300 mt-1 block">{currentCase.investigator}</span>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block">Cryptographic Integrity Level:</span>
              <span className="text-zinc-300 font-bold block mt-1">{currentCase.trustScore}% Verified State</span>
            </div>

            <div>
              <span className="text-zinc-500 font-semibold block">Ingestion Block Height:</span>
              <span className="text-zinc-300 font-mono mt-1 block">#14,882,903</span>
            </div>

            <div className="border-t border-border/20 pt-4">
              <span className="text-zinc-500 font-semibold block">Tatum SUI Notary Hash:</span>
              <span className="text-accent-blue font-mono mt-1 break-all block text-[10px] select-all leading-relaxed">
                {currentCase.blockchainHash}
              </span>
            </div>

            <div className="border-t border-border/20 pt-4">
              <span className="text-zinc-500 font-semibold block">Walrus Storage Proof Index:</span>
              <span className="text-zinc-400 font-mono mt-1 break-all block text-[10px] select-all leading-relaxed">
                {currentCase.walrusStorageProof}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
