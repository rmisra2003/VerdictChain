"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import EmailAuth from "./EmailAuth";

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
          <Badge variant="active">Email Access</Badge>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Investigator sign in
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Use an email session to open case vaults, upload evidence, and generate verification artifacts.
            </p>
          </div>

          <Card variant="glass" className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-blue/10 border border-accent-blue/20">
                <Mail className="w-4 h-4 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Fast judge-friendly access</h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  The forensic pipeline still uses Tatum, Walrus, and Sui devnet proofing after sign-in.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section className="lg:col-span-7">
          <Card variant="glass" className="p-6">
            <EmailAuth />
          </Card>
        </section>
      </main>
    </div>
  );
}
