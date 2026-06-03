"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Search,
  ShieldCheck,
  ChevronRight,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CaseRecord, createCase, listCases } from "@/lib/api";

export default function CaseVaultList() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadCases = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      setCases(await listCases());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load cases.");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredCases = useMemo(() => {
    const query = search.toLowerCase();
    return cases.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [cases, search, statusFilter]);

  const submitCase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setErrorMessage("");
    try {
      const created = await createCase({ title, description });
      setCases((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setShowCreate(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to create case.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-accent-blue" />
            Investigative Case Vault
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Manage live case records backed by the VerdictChain API.</p>
        </div>
        <Button variant="primary" size="sm" className="gap-2" onClick={() => setShowCreate((value) => !value)}>
          <Plus className="w-4 h-4" />
          New Case
        </Button>
      </div>

      {errorMessage && (
        <Card variant="glass" className="p-4 border border-accent-red/30 bg-accent-red/10 text-xs text-accent-red">
          {errorMessage}
        </Card>
      )}

      {showCreate && (
        <Card variant="glass" className="p-5">
          <form onSubmit={submitCase} className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Case Title</label>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-sm outline-none text-white"
                placeholder="Investigation name"
              />
            </div>
            <div className="lg:col-span-6 space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Description</label>
              <input
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border/80 focus:border-accent-blue rounded-lg text-sm outline-none text-white"
                placeholder="Scope, source, and custody notes"
              />
            </div>
            <div className="lg:col-span-2 flex items-end">
              <Button variant="glow" className="w-full" type="submit" loading={creating}>
                Create
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card variant="glass" className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search cases by title, ID, or description..."
            className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border/80 rounded-lg text-xs outline-none focus:border-accent-blue text-white placeholder-zinc-500 font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs">
            <span className="text-zinc-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-white border-none outline-none font-semibold cursor-pointer"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Button variant="secondary" size="sm" className="gap-2" onClick={loadCases} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </Card>

      {loading && (
        <Card variant="glass" className="p-8 text-center text-zinc-500">
          <RefreshCw className="w-8 h-8 mx-auto text-accent-blue animate-spin mb-3" />
          <p className="text-xs">Loading case vaults...</p>
        </Card>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((item) => {
            const isLowTrust = item.trust_score < 60;
            return (
              <Card key={item.id} variant="interactive" className="p-5 flex flex-col min-h-[280px]">
                <div className="flex items-start justify-between border-b border-border/40 pb-3 mb-4 gap-3">
                  <div className="space-y-1 min-w-0">
                    <Badge variant="glow-blue" className="font-mono">{item.id.slice(0, 8)}</Badge>
                    <h3 className="font-bold text-white text-sm tracking-tight mt-1 truncate max-w-[220px]">{item.title}</h3>
                  </div>
                  <Badge variant={item.status === "active" ? "active" : "closed"}>
                    {item.status}
                  </Badge>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed flex-grow line-clamp-3">
                  {item.description}
                </p>

                <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Updated:
                    </span>
                    <span className="text-zinc-300 font-semibold">{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-blue" />
                      Trust Score:
                    </span>
                    <span className={`font-bold flex items-center gap-1 ${isLowTrust ? "text-accent-red" : "text-accent-green"}`}>
                      {isLowTrust && <AlertTriangle className="w-3.5 h-3.5 text-accent-red" />}
                      {item.trust_score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <Link href={`/dashboard/cases/${item.id}`} className="mt-4">
                  <Button variant="secondary" size="sm" className="w-full gap-1">
                    Open Case <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && filteredCases.length === 0 && (
        <Card variant="glass" className="p-12 text-center text-zinc-500">
          <Briefcase className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
          <h3 className="font-bold text-white text-base">No Cases Found</h3>
          <p className="text-xs text-zinc-500 mt-1">Create a case or adjust your filters.</p>
        </Card>
      )}
    </div>
  );
}
