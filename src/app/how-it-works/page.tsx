import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle,
  Cloud,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  FileSearch,
  FileText,
  Fingerprint,
  Gauge,
  KeyRound,
  Network,
  ReceiptText,
  Route,
  ScanText,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "How VerdictChain Works | Architecture and Service Map",
  description:
    "A full architecture walkthrough of VerdictChain, including Tatum Walrus storage, Sui notary proofs, OpenAI media extraction, DeepSeek analysis, FastAPI, PostgreSQL, and Next.js.",
};

const custodyStages = [
  {
    title: "1. Investigator Uploads Evidence",
    detail:
      "The Next.js console sends the file, selected case id, and JWT session to the FastAPI backend. The backend validates MIME type and file size before any external service is called.",
    result: "A controlled ingestion request enters the custody pipeline.",
    Icon: UploadCloud,
    accent: "text-accent-blue",
    border: "border-accent-blue/30",
  },
  {
    title: "2. Backend Hashes and Records",
    detail:
      "FastAPI computes the SHA-256 fingerprint from the raw bytes, sanitizes the filename, and persists evidence metadata, proof metadata, analysis records, and audit logs in PostgreSQL.",
    result: "The file is represented by an immutable fingerprint in the database.",
    Icon: Fingerprint,
    accent: "text-accent-green",
    border: "border-accent-green/30",
  },
  {
    title: "3. Tatum Sends Evidence to Walrus",
    detail:
      "Evidence bytes are uploaded through the Tatum-backed Walrus storage path. The UI surfaces Tatum provider metadata, job id, blob id, and refreshable storage status.",
    result: "The evidence artifact receives decentralized storage metadata.",
    Icon: Cloud,
    accent: "text-accent-purple",
    border: "border-accent-purple/30",
  },
  {
    title: "4. Sui Notary Seals the Hash",
    detail:
      "The backend calls the Sui Move notary package from the configured Sui CLI signer. It submits the evidence hash, case id, and evidence id to the deployed devnet package.",
    result: "A Sui transaction digest becomes the on-chain proof reference.",
    Icon: ShieldCheck,
    accent: "text-accent-yellow",
    border: "border-accent-yellow/30",
  },
  {
    title: "5. OpenAI Extracts Media Signals",
    detail:
      "Images are decoded with Tesseract plus OpenAI vision. Audio is transcribed with OpenAI. This turns screenshots, scans, and clips into text that the forensic AI layer can reason over.",
    result: "Readable media text and transcripts become evidence intelligence.",
    Icon: ScanText,
    accent: "text-accent-blue",
    border: "border-accent-blue/30",
  },
  {
    title: "6. DeepSeek Builds Investigation Artifacts",
    detail:
      "DeepSeek receives extracted evidence signals and generates summaries, entities, timelines, formatted reports, and relationship graphs. Generated AI artifacts are also stored through Walrus metadata.",
    result: "The case workspace becomes an investigation dossier, not just a file vault.",
    Icon: Bot,
    accent: "text-accent-green",
    border: "border-accent-green/30",
  },
];

const serviceRoles = [
  {
    service: "Next.js Frontend",
    role: "Investigator console and public verifier",
    use:
      "Provides email auth screens, case vaults, upload receipts, evidence detail views, formatted DeepSeek reports, relationship graph views, and the public hash/file verifier.",
    proof: "Hosted on Vercel at verdictchain.vercel.app.",
    Icon: Code2,
    accent: "text-accent-blue",
  },
  {
    service: "FastAPI Backend",
    role: "Custody orchestrator",
    use:
      "Owns auth, rate limiting, file validation, SHA-256 hashing, database writes, Walrus upload calls, Sui proof calls, verification, and AI artifact generation.",
    proof: "Railway-hosted API exposes /health and /api/* routes.",
    Icon: Server,
    accent: "text-accent-green",
  },
  {
    service: "PostgreSQL",
    role: "Operational source of truth",
    use:
      "Stores users, case vaults, evidence rows, proof rows, AI analyses, timelines, reports, graphs, and immutable-style audit log entries.",
    proof: "Every UI case, receipt, and verifier result comes from stored backend records.",
    Icon: Database,
    accent: "text-accent-purple",
  },
  {
    service: "Tatum Walrus Data API",
    role: "Walrus storage gateway",
    use:
      "Uploads evidence and generated AI artifacts to the Walrus storage path, returning job ids, provider metadata, blob ids, and storage status.",
    proof: "Upload receipts show Tatum job details and a Refresh Tatum Job action.",
    Icon: Cloud,
    accent: "text-accent-yellow",
  },
  {
    service: "Walrus",
    role: "Decentralized artifact storage",
    use:
      "Holds evidence artifact references and AI JSON artifact references so the case has storage-backed custody metadata beyond the relational database.",
    proof: "Evidence rows and AI artifact rows display Walrus blob ids when available.",
    Icon: ReceiptText,
    accent: "text-accent-green",
  },
  {
    service: "Sui Move Notary",
    role: "Tamper-evident proof contract",
    use:
      "The Move package seals evidence hashes with case and evidence identifiers. The live deployment is currently configured on Sui devnet.",
    proof:
      "Package 0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823.",
    Icon: Shield,
    accent: "text-accent-blue",
  },
  {
    service: "Tatum Sui RPC",
    role: "Sui read and verification path",
    use:
      "Routes Sui transaction and chain checks through the configured Tatum Sui devnet RPC gateway instead of relying on an untracked public RPC.",
    proof: "Configured RPC target: https://sui-devnet.gateway.tatum.io.",
    Icon: Network,
    accent: "text-accent-purple",
  },
  {
    service: "OpenAI",
    role: "Media extraction layer",
    use:
      "Handles image understanding and audio transcription before DeepSeek receives the evidence context. This makes screenshots, scans, and audio useful in the case graph and report.",
    proof: "Evidence analysis metadata records OpenAI vision/audio fields.",
    Icon: Sparkles,
    accent: "text-accent-yellow",
  },
  {
    service: "DeepSeek",
    role: "Forensic reasoning layer",
    use:
      "Generates evidence summaries, entities, timelines, formatted reports, risk flags, recommendations, and graph-ready intelligence from extracted evidence signals.",
    proof: "Case workspace can generate report, timeline, and graph artifacts.",
    Icon: Cpu,
    accent: "text-accent-green",
  },
];

const verificationSteps = [
  "The verifier hashes the uploaded file locally in the browser or accepts a pasted SHA-256 hash.",
  "FastAPI looks for the fingerprint in registered evidence records.",
  "The API returns case metadata, proof metadata, Sui transaction state, Walrus state, and match status.",
  "If one byte changes, the SHA-256 hash changes and the verifier fails to find the registered evidence.",
];

const guardrails = [
  {
    title: "AI rate limiting",
    text: "Upload, timeline, report, and graph generation are limited to 8 AI-heavy requests per user per 60 seconds.",
    Icon: Gauge,
  },
  {
    title: "JWT sessions",
    text: "Email/password auth issues backend JWTs. Case, upload, evidence, report, timeline, and graph routes require the current user.",
    Icon: KeyRound,
  },
  {
    title: "Separation of duties",
    text: "Files, hashes, storage metadata, proof transactions, and AI artifacts are recorded separately so each layer can be inspected.",
    Icon: Workflow,
  },
  {
    title: "Readable presentation",
    text: "DeepSeek data is stored as structured JSON but rendered as a readable forensic dossier in the case workspace.",
    Icon: FileSearch,
  },
];

function FlowNode({
  label,
  detail,
  Icon,
  className = "",
}: {
  label: string;
  detail: string;
  Icon: LucideIcon;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-border/70 bg-secondary/50 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-bold text-white">
        <Icon className="h-4 w-4 text-accent-blue" />
        {label}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{detail}</p>
    </div>
  );
}

function ArrowPill({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
      <span className="h-px w-full bg-border/70" />
      <span className="shrink-0 rounded-full border border-border bg-black/40 px-2 py-1">{label}</span>
      <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-zinc-600 md:block" />
      <span className="h-px w-full bg-border/70 md:hidden" />
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background bg-grid-pattern text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent-blue/40 bg-accent-blue/10">
              <Shield className="h-4 w-4 text-accent-blue" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Verdict<span className="text-accent-blue">Chain</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-400 md:flex">
            <Link href="/how-it-works" className="text-white">How It Works</Link>
            <Link href="/verify" className="transition-colors hover:text-white">Verify</Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">Console</Link>
          </nav>

          <Link
            href="/dashboard/upload"
            className="inline-flex items-center gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/10 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-blue/20"
          >
            Open Demo <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-16 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-7">
            <Badge variant="active" className="mb-5 uppercase tracking-widest">
              Architecture Walkthrough
            </Badge>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              How VerdictChain turns one evidence file into a verifiable custody trail.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              This page explains the full system path for reviewers: what runs in the browser, what the backend owns, how Tatum and Walrus are used, where Sui fits, and how OpenAI plus DeepSeek convert raw evidence into investigation intelligence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/upload"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent-blue/40 bg-accent-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/90"
              >
                Try Upload Flow <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/verify"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-secondary/80"
              >
                Open Public Verifier <CheckCircle className="h-4 w-4 text-accent-green" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <Card variant="glass" className="p-5">
              <div className="border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Activity className="h-4 w-4 text-accent-green" />
                  Live Deployment Snapshot
                </div>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">Frontend</div>
                  <div className="mt-1 break-all font-mono text-accent-blue">verdictchain.vercel.app</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">Backend</div>
                  <div className="mt-1 break-all font-mono text-accent-green">api-production-0b30.up.railway.app</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">Sui Devnet Package</div>
                  <div className="mt-1 break-all font-mono text-zinc-300">
                    0x5f8a69e8004ee5aa943dccaf5b0fa336dfffcf5b320aa13b081b772ecaf5b823
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="border-y border-border/40 bg-black/25 py-14">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="glow-blue">End-to-End Flow</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">The custody pipeline</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400">
                Every major action writes a record, a proof, a storage reference, or an AI artifact. The result is a case workspace that can be explained step by step.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {custodyStages.map((stage) => (
                <div key={stage.title} className={`rounded-lg border ${stage.border} bg-secondary/35 p-5`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-black/35">
                      <stage.Icon className={`h-5 w-5 ${stage.accent}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{stage.title}</h3>
                      <p className="mt-2 text-xs leading-6 text-zinc-400">{stage.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border/60 bg-black/25 px-3 py-2 text-[11px] leading-5 text-zinc-300">
                    <span className="font-bold text-zinc-500">Output: </span>
                    {stage.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <Badge variant="glow-blue">System Map</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">What talks to what</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              The browser never needs blockchain knowledge. FastAPI is the coordinator that turns user actions into storage jobs, proof transactions, AI extraction, and verification responses.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <FlowNode
              label="Browser UI"
              detail="Next.js renders the landing page, auth, upload console, case workspace, formatted report, graph, and public verifier."
              Icon={FileText}
            />
            <ArrowPill label="JWT + file" />
            <FlowNode
              label="FastAPI Orchestrator"
              detail="Validates, hashes, stores metadata, rate-limits AI-heavy work, calls Tatum, calls Sui, calls OpenAI, and calls DeepSeek."
              Icon={Server}
              className="border-accent-green/30"
            />
            <ArrowPill label="external APIs" />
            <div className="space-y-4">
              <FlowNode label="Tatum + Walrus" detail="Stores evidence and AI artifacts, then returns job and blob metadata." Icon={Cloud} />
              <FlowNode label="Sui + Tatum RPC" detail="Seals evidence hashes and verifies Sui transaction state through Tatum RPC." Icon={Network} />
              <FlowNode label="OpenAI + DeepSeek" detail="Extracts media signals, then builds summaries, reports, timelines, entities, and graphs." Icon={Bot} />
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-black/25 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="glow-blue">Service Responsibilities</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">How each service is used</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">
                VerdictChain deliberately separates user experience, custody records, storage proofs, chain proofs, and AI reasoning.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {serviceRoles.map((item) => (
                <div key={item.service} className="rounded-lg border border-border/70 bg-secondary/35 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-black/35">
                      <item.Icon className={`h-5 w-5 ${item.accent}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.service}</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.role}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs leading-6 text-zinc-400">{item.use}</p>
                  <div className="mt-4 rounded-lg border border-border/60 bg-black/25 px-3 py-2 text-[11px] leading-5 text-zinc-300">
                    <span className="font-bold text-zinc-500">Where reviewers see it: </span>
                    {item.proof}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Badge variant="glow-blue">Verification</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Why tampering is easy to demonstrate</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              The public verifier does not trust filenames, screenshots, or user claims. It only trusts the computed fingerprint and the backend records attached to that fingerprint.
            </p>
            <div className="mt-6 rounded-lg border border-accent-green/25 bg-accent-green/5 p-4 text-xs leading-6 text-zinc-300">
              Demo move: upload the provided sample text, verify it, change one character, and verify again. The second file produces a different SHA-256 hash and fails the registered evidence lookup.
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-3">
              {verificationSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-lg border border-border/70 bg-secondary/35 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-black/35 text-xs font-bold text-accent-blue">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-zinc-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-black/25 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 text-center">
              <Badge variant="glow-blue">Production Guardrails</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">What keeps the demo controlled</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {guardrails.map((item) => (
                <div key={item.title} className="rounded-lg border border-border/70 bg-secondary/35 p-5">
                  <item.Icon className="h-5 w-5 text-accent-blue" />
                  <h3 className="mt-4 text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-2 text-xs leading-6 text-zinc-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <Card variant="glass" className="p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Route className="h-4 w-4 text-accent-green" />
                  Suggested walkthrough
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Start on this page, then create a case, upload a synthetic file, inspect the Tatum/Walrus receipt, open the case workspace, generate the DeepSeek report, and finish by verifying the original and modified files in the public verifier.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:col-span-4 lg:justify-end">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-accent-blue/40 bg-accent-blue/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-accent-blue/20"
                >
                  Enter Console <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/verify"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-secondary/80"
                >
                  Verify File <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
