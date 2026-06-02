"use client";

import Link from "next/link";
import { 
  Shield, 
  Briefcase, 
  CheckSquare, 
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  ExternalLink,
  Plus
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { mockCases } from "@/data/mockData";

export default function DashboardOverview() {
  const activeCasesCount = 2;
  const evidenceCount = 9;

  // Simulated real-time security events
  const auditLogs = [
    {
      time: "10:14 UTC",
      event: "Sui Notary Sealed: Ledger_Q1_Final.xlsx",
      case: "VC-2026-11",
      tx: "0xfe382a...",
      status: "warning"
    },
    {
      time: "09:44 UTC",
      event: "Walrus Blob Dispersion Proof Generated: Zurich_Logs.txt",
      case: "VC-2026-09",
      tx: "0x89abf2...",
      status: "success"
    },
    {
      time: "Yesterday",
      event: "CCTV Media Asset Verified: DevSector_4.mp4",
      case: "VC-2026-09",
      tx: "0xca823f...",
      status: "success"
    },
    {
      time: "May 28",
      event: "Encase Audio Intercept Anchored: Personal_Phone.wav",
      case: "VC-2026-09",
      tx: "0xde438a...",
      status: "success"
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Forensic Operations Workspace</h1>
          <p className="text-xs text-zinc-500 mt-1">Review anchored evidence vaults, active audit trails, and graph contradictions.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/upload">
            <Button variant="primary" size="sm" className="gap-1.5 font-bold">
              <Plus className="w-4.5 h-4.5" /> Ingest Evidence
            </Button>
          </Link>
          <Link href="/verify">
            <Button variant="secondary" size="sm">
              Verify Hash Proof
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Dossiers</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{activeCasesCount}</div>
            <p className="text-[10px] text-zinc-400">1 Critical, 1 High priority</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
            <Briefcase className="w-5 h-5 text-accent-blue" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Verified Artifacts</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{evidenceCount}</div>
            <p className="text-[10px] text-accent-green font-bold">100% Cryptographic Seals</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <CheckSquare className="w-5 h-5 text-accent-green" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Contradictions Found</span>
            <div className="text-3xl font-extrabold text-accent-red tracking-tight">1</div>
            <p className="text-[10px] text-zinc-400">Hedgehog Corp Ledger</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 animate-pulse">
            <AlertOctagon className="w-5 h-5 text-accent-red" />
          </div>
        </Card>

        <Card variant="glow-blue" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Global Integrity Index</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">85.4%</div>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent-blue" /> 
              SUI Notary Core synced
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
            <Shield className="w-5 h-5 text-accent-purple" />
          </div>
        </Card>
      </div>

      {/* Main Content Layout (Recent Cases + Activity Audit) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recent Cases Vault */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Active Investigative Vault</h2>
            <Link href="/dashboard/cases" className="text-xs text-accent-blue hover:underline flex items-center font-semibold">
              View All Dossiers <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {mockCases.slice(0, 2).map((item) => (
              <Card key={item.id} variant="interactive" className="p-6">
                <Link href={`/dashboard/cases/${item.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="glow-blue">{item.id}</Badge>
                        <span className="text-sm font-bold text-white tracking-tight">{item.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-xl truncate mt-1">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant={item.priority === "critical" ? "critical" : "high"}>
                      {item.priority}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Investigator:</span>
                      <div className="font-semibold text-zinc-300 truncate mt-0.5">{item.investigator.split(",")[0]}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Ingested Seals:</span>
                      <div className="font-semibold text-zinc-300 mt-0.5">{item.evidenceCount} crypt-indexes</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Audited Integrity:</span>
                      <div className={`font-semibold mt-0.5 ${
                        item.trustScore > 90 ? "text-accent-green" : "text-accent-red"
                      }`}>{item.trustScore}%</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Sui Net Block height:</span>
                      <div className="font-semibold text-zinc-300 font-mono mt-0.5">#14,882,903</div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Right: Security Custody Audits Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Live Notary Settlement Feed</h2>
            <Badge variant="active" className="text-[10px]">REAL-TIME</Badge>
          </div>

          <Card variant="glass" className="p-5 relative overflow-hidden scanline">
            <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
            <div className="relative space-y-5">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 text-xs relative">
                  {idx !== auditLogs.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-[-15px] w-[1px] bg-border/60" />
                  )}
                  {/* Status Indicator Dot */}
                  <div className={`w-[15px] h-[15px] rounded-full border bg-[#09090b] flex items-center justify-center shrink-0 mt-0.5 ${
                    log.status === "warning"
                      ? "border-accent-red/60 shadow-[0_0_8px_rgba(239,68,68,0.15)]"
                      : "border-accent-green/60 shadow-[0_0_8px_rgba(16,185,129,0.15)]"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-current ${
                      log.status === "warning" ? "text-accent-red animate-pulse" : "text-accent-green"
                    }`} />
                  </div>

                  <div className="space-y-1 select-text">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="font-bold text-white leading-tight">{log.event}</span>
                      <span className="text-[9px] text-zinc-500 font-mono flex-shrink-0">{log.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <span>Dossier: <Link href={`/dashboard/cases/${log.case}`} className="text-accent-blue hover:underline font-semibold">{log.case}</Link></span>
                      <span>&bull;</span>
                      <span className="font-mono flex items-center gap-0.5 text-zinc-500 cursor-pointer hover:text-accent-blue">
                        Tx: {log.tx}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
