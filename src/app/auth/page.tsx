"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const SuiWalletAuth = dynamic(() => import("./SuiWalletAuth"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-border/80 bg-secondary/40 p-5 text-sm text-zinc-400">
      Loading wallet session...
    </div>
  ),
});

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background text-foreground bg-grid-pattern bg-gradient-glow flex flex-col font-sans">
      <header className="h-16 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 border border-accent-blue/40 flex items-center justify-center">
              <Shield className="w-4 h-4 text-accent-blue" />
            </div>
            <span className="font-bold tracking-tight text-white">
              Verdict<span className="text-accent-blue">Chain</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-5 space-y-5">
          <Badge variant="active">Wallet Access</Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Sign in with your Sui wallet
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              VerdictChain uses Sui personal-message signatures for investigator sessions. No passwords, no demo users, no mock auth path.
            </p>
          </div>

          <Card variant="glass" className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <Wallet className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Wallet-only sessions</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  The backend verifies a signed one-time challenge, creates the wallet profile when needed, and issues the JWT used by the forensic workspace.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="lg:col-span-7">
          <Card variant="glass" className="p-6">
            <SuiWalletAuth />
          </Card>
        </section>
      </main>
    </div>
  );
}
