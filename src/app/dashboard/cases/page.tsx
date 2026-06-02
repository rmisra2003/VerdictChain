"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, 
  Search, 
  ShieldCheck, 
  ChevronRight, 
  AlertTriangle,
  Clock
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { mockCases } from "@/data/mockData";

export default function CaseVaultList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredCases = mockCases.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                          c.id.toLowerCase().includes(search.toLowerCase()) ||
                          c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-accent-blue" />
          Investigative Case Vault
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Manage, audit, and verify chain of custody indices for active corporate espionage and fraud dossiers.</p>
      </div>

      {/* Filters Toolbar */}
      <Card variant="glass" className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search dossiers by title, ID, or keywords..."
            className="w-full pl-9 pr-4 py-2 bg-secondary/80 border border-border/80 rounded-lg text-xs outline-none focus:border-accent-blue text-white placeholder-zinc-500 font-mono"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          {/* Status Filter */}
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

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-lg border border-border text-xs">
            <span className="text-zinc-500">Priority:</span>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-white border-none outline-none font-semibold cursor-pointer"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Case Dossiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCases.map((item) => {
          const isLowTrust = item.trustScore < 60;
          return (
            <Card key={item.id} variant="interactive" className="p-5 flex flex-col h-[280px]">
              <div className="flex items-start justify-between border-b border-border/40 pb-3 mb-4">
                <div className="space-y-1">
                  <Badge variant="glow-blue" className="font-mono">{item.id}</Badge>
                  <h3 className="font-bold text-white text-sm tracking-tight mt-1 truncate max-w-[180px]">{item.title}</h3>
                </div>
                <Badge variant={item.priority === "critical" ? "critical" : item.priority === "high" ? "high" : "medium"}>
                  {item.priority}
                </Badge>
              </div>

              {/* Description */}
              <p className="text-xs text-zinc-400 leading-relaxed flex-grow line-clamp-3">
                {item.description}
              </p>

              {/* Status and Trust Index Metrics */}
              <div className="mt-4 pt-4 border-t border-border/40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last Updated:
                  </span>
                  <span className="text-zinc-300 font-semibold">{new Date(item.updatedAt).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-blue" />
                    Trust Score:
                  </span>
                  <span className={`font-bold flex items-center gap-1 ${
                    isLowTrust ? "text-accent-red" : "text-accent-green"
                  }`}>
                    {isLowTrust && <AlertTriangle className="w-3.5 h-3.5 text-accent-red animate-pulse" />}
                    {item.trustScore}%
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link href={`/dashboard/cases/${item.id}`} className="mt-4">
                <Button variant="secondary" size="sm" className="w-full gap-1">
                  Open Dossier Shell <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {filteredCases.length === 0 && (
        <Card variant="glass" className="p-12 text-center text-zinc-500">
          <Briefcase className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
          <h3 className="font-bold text-white text-base">No Dossiers Found</h3>
          <p className="text-xs text-zinc-500 mt-1">Adjust search parameters or filters to locate investigations.</p>
        </Card>
      )}
    </div>
  );
}
