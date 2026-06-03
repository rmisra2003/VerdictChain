"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Briefcase,
  CheckSquare,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CaseRecord, listCases } from "@/lib/api";

export default function DashboardOverview() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const loadInitialCases = async () => {
      try {
        const loadedCases = await listCases();
        if (mounted) setCases(loadedCases);
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load cases.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void loadInitialCases();
    return () => {
      mounted = false;
    };
  }, []);

  const activeCases = cases.filter((item) => item.status === "active");
  const evidenceCount = cases.reduce((sum, item) => sum + item.evidence_count, 0);
  const averageTrust = useMemo(() => {
    if (!cases.length) return 0;
    return cases.reduce((sum, item) => sum + item.trust_score, 0) / cases.length;
  }, [cases]);
  const lowTrustCases = cases.filter((item) => item.trust_score < 60);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Forensic Operations Workspace</h1>
          <p className="text-xs text-zinc-500 mt-1">Review live evidence vaults, Walrus storage records, and Sui notary proof state.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/cases">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <Briefcase className="w-4 h-4" /> Cases
            </Button>
          </Link>
          <Link href="/dashboard/upload">
            <Button variant="primary" size="sm" className="gap-1.5 font-bold">
              <Plus className="w-4 h-4" /> Ingest Evidence
            </Button>
          </Link>
          <Link href="/verify">
            <Button variant="secondary" size="sm">
              Verify Hash Proof
            </Button>
          </Link>
        </div>
      </div>

      {errorMessage && (
        <Card variant="glass" className="p-4 border border-accent-red/30 bg-accent-red/10 text-xs text-accent-red">
          {errorMessage}
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Cases</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{activeCases.length}</div>
            <p className="text-[10px] text-zinc-400">{cases.length} total case vaults</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
            <Briefcase className="w-5 h-5 text-accent-blue" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Evidence Artifacts</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{evidenceCount}</div>
            <p className="text-[10px] text-accent-green font-bold">Backed by backend records</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20">
            <CheckSquare className="w-5 h-5 text-accent-green" />
          </div>
        </Card>

        <Card variant="glass" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Low Trust Cases</span>
            <div className="text-3xl font-extrabold text-accent-red tracking-tight">{lowTrustCases.length}</div>
            <p className="text-[10px] text-zinc-400">Computed from live case scores</p>
          </div>
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <AlertOctagon className="w-5 h-5 text-accent-red" />
          </div>
        </Card>

        <Card variant="glow-blue" className="p-5 flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Integrity Index</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">{averageTrust.toFixed(1)}%</div>
            <p className="text-[10px] text-zinc-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-accent-blue" />
              Sui devnet notary active
            </p>
          </div>
          <div className="p-3 rounded-lg bg-accent-purple/10 border border-accent-purple/20">
            <Shield className="w-5 h-5 text-accent-purple" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Recent Case Vaults</h2>
            <Link href="/dashboard/cases" className="text-xs text-accent-blue hover:underline flex items-center font-semibold">
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {loading && (
              <Card variant="glass" className="p-6 text-xs text-zinc-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-accent-blue" />
                Loading case vaults...
              </Card>
            )}

            {!loading && cases.slice(0, 3).map((item) => (
              <Card key={item.id} variant="interactive" className="p-6">
                <Link href={`/dashboard/cases/${item.id}`} className="block">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="glow-blue">{item.id.slice(0, 8)}</Badge>
                        <span className="text-sm font-bold text-white tracking-tight truncate">{item.title}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed max-w-xl truncate mt-1">
                        {item.description}
                      </p>
                    </div>
                    <Badge variant={item.status === "active" ? "active" : "closed"}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                    <div>
                      <span className="text-zinc-500">Evidence:</span>
                      <div className="font-semibold text-zinc-300 mt-0.5">{item.evidence_count}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Trust:</span>
                      <div className={`font-semibold mt-0.5 ${item.trust_score >= 60 ? "text-accent-green" : "text-accent-red"}`}>
                        {item.trust_score.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Created:</span>
                      <div className="font-semibold text-zinc-300 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <span className="text-zinc-500">Updated:</span>
                      <div className="font-semibold text-zinc-300 mt-0.5">{new Date(item.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}

            {!loading && cases.length === 0 && (
              <Card variant="glass" className="p-8 text-center">
                <Briefcase className="w-10 h-10 mx-auto text-zinc-600 mb-3" />
                <h3 className="text-sm font-bold text-white">No case vaults yet</h3>
                <p className="text-xs text-zinc-500 mt-1">Create a case vault before ingesting evidence.</p>
                <Link href="/dashboard/cases" className="inline-flex mt-4">
                  <Button variant="primary" size="sm">Create First Case</Button>
                </Link>
              </Card>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Production Readiness</h2>
            <Badge variant="active" className="text-[10px]">LIVE API</Badge>
          </div>

          <Card variant="glass" className="p-5 relative overflow-hidden scanline">
            <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
            <div className="relative space-y-4 text-xs text-zinc-400">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-accent-green" />
                <p>Case and evidence counts are loaded from the FastAPI backend.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-accent-green" />
                <p>Evidence upload requires an authenticated JWT session and a real case ID.</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 mt-1.5 rounded-full bg-accent-green" />
                <p>Verification uses registered SHA-256 records, Tatum Walrus metadata, and Sui devnet proof checks.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
