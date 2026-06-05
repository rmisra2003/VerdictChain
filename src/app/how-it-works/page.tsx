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
  title: "How VerdictChain Works | Simple Product Walkthrough",
  description:
    "A plain-English walkthrough of how VerdictChain stores evidence, proves file integrity, verifies changes, and uses AI to summarize cases.",
};

const custodyStages = [
  {
    title: "1. Upload a File",
    detail:
      "An investigator signs in, opens a case, and uploads a document, image, spreadsheet, or short audio clip. VerdictChain checks that the file type and size are allowed.",
    result: "The file is accepted into the case safely.",
    Icon: UploadCloud,
    accent: "text-accent-blue",
    border: "border-accent-blue/30",
  },
  {
    title: "2. Create a Digital Fingerprint",
    detail:
      "VerdictChain creates a SHA-256 fingerprint for that exact file. If even one character changes, the fingerprint changes too.",
    result: "The case now has a reliable way to recognize the original file.",
    Icon: Fingerprint,
    accent: "text-accent-green",
    border: "border-accent-green/30",
  },
  {
    title: "3. Store the Evidence",
    detail:
      "Tatum is used to send the evidence into Walrus storage. The upload receipt shows the storage job and the Walrus blob reference when it is available.",
    result: "The evidence has a storage trail that can be inspected from the app.",
    Icon: Cloud,
    accent: "text-accent-purple",
    border: "border-accent-purple/30",
  },
  {
    title: "4. Save Proof on Sui",
    detail:
      "VerdictChain sends the file fingerprint to a small Sui program. This creates a public proof that the file fingerprint was registered.",
    result: "The receipt can show that Sui recorded the evidence proof.",
    Icon: ShieldCheck,
    accent: "text-accent-yellow",
    border: "border-accent-yellow/30",
  },
  {
    title: "5. Read Images and Audio",
    detail:
      "If the file is an image, OpenAI helps describe it and pull out visible text. If it is audio, OpenAI turns speech into text.",
    result: "Hard-to-read media becomes useful case text.",
    Icon: ScanText,
    accent: "text-accent-blue",
    border: "border-accent-blue/30",
  },
  {
    title: "6. Create the Case Summary",
    detail:
      "DeepSeek uses the extracted text to create summaries, timelines, reports, important names, amounts, dates, and relationship graphs.",
    result: "The case becomes easier to review, explain, and present.",
    Icon: Bot,
    accent: "text-accent-green",
    border: "border-accent-green/30",
  },
];

const serviceRoles = [
  {
    service: "Website",
    role: "Where people use the product",
    use:
      "This is the visible app: sign in, create cases, upload files, view receipts, read reports, inspect graphs, and verify files.",
    proof: "Open verdictchain.vercel.app.",
    Icon: Code2,
    accent: "text-accent-blue",
  },
  {
    service: "App Server",
    role: "The main worker behind the app",
    use:
      "This receives uploads, checks files, creates fingerprints, saves records, talks to Tatum, talks to Sui, and asks AI services for summaries.",
    proof: "The live app server is hosted on Railway.",
    Icon: Server,
    accent: "text-accent-green",
  },
  {
    service: "Database",
    role: "Keeps the case records",
    use:
      "Stores users, cases, evidence details, proof details, AI summaries, reports, graphs, and action history.",
    proof: "Every case page and receipt is loaded from saved records.",
    Icon: Database,
    accent: "text-accent-purple",
  },
  {
    service: "Tatum",
    role: "Connects the app to Walrus and Sui",
    use:
      "Tatum is used for Walrus upload jobs and Sui network checks. It gives the app job ids, blob ids, and status updates.",
    proof: "Upload receipts show Tatum job details and a refresh action.",
    Icon: Cloud,
    accent: "text-accent-yellow",
  },
  {
    service: "Walrus",
    role: "Stores evidence and AI files",
    use:
      "Walrus holds references for uploaded evidence and generated AI files, such as reports and graph data.",
    proof: "Evidence and AI sections show Walrus blob ids when available.",
    Icon: ReceiptText,
    accent: "text-accent-green",
  },
  {
    service: "Sui",
    role: "Records proof that a file was registered",
    use:
      "VerdictChain stores the file fingerprint on Sui so there is a public proof tied to the evidence.",
    proof:
      "The live demo uses a Sui devnet package.",
    Icon: Shield,
    accent: "text-accent-blue",
  },
  {
    service: "Tatum Sui Gateway",
    role: "Checks Sui proof status",
    use:
      "When the app needs to check Sui proof status, it uses Tatum's Sui gateway.",
    proof: "The app server is configured to use Tatum's Sui devnet gateway.",
    Icon: Network,
    accent: "text-accent-purple",
  },
  {
    service: "OpenAI",
    role: "Reads images and audio",
    use:
      "OpenAI helps pull text and meaning out of images, screenshots, scanned pages, and audio clips.",
    proof: "Upload an image or audio file and check the evidence analysis panel.",
    Icon: Sparkles,
    accent: "text-accent-yellow",
  },
  {
    service: "DeepSeek",
    role: "Writes the investigation analysis",
    use:
      "DeepSeek turns the evidence text into a readable report, timeline, key findings, risk notes, and relationship graph.",
    proof: "Open a case workspace and generate a report, timeline, or graph.",
    Icon: Cpu,
    accent: "text-accent-green",
  },
];

const verificationSteps = [
  "The verifier creates a fingerprint for the uploaded file, or checks a pasted fingerprint.",
  "VerdictChain looks for that fingerprint in saved evidence records.",
  "The result shows whether the file matches a registered case, plus any storage and Sui proof details.",
  "If one byte changes, the fingerprint changes and the file no longer matches the original record.",
];

const guardrails = [
  {
    title: "AI usage limits",
    text: "Uploads and AI generation are limited to 8 heavy requests per user per minute, so the demo stays stable.",
    Icon: Gauge,
  },
  {
    title: "Signed-in case access",
    text: "Users sign in with email and password. Private case pages and uploads require an active session.",
    Icon: KeyRound,
  },
  {
    title: "Separate proof trail",
    text: "The file, fingerprint, storage result, Sui proof, and AI report are saved separately so each part can be checked.",
    Icon: Workflow,
  },
  {
    title: "Readable presentation",
    text: "DeepSeek returns structured data, but the case workspace shows it as a readable report instead of raw JSON.",
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
              Simple Walkthrough
            </Badge>
            <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              How VerdictChain proves a file has not been changed.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              This page keeps the explanation simple: what happens when someone uploads evidence, how the app stores it, how proof is created, and how AI helps turn raw files into a useful case summary.
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
                  Live Demo Snapshot
                </div>
              </div>
              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">Website</div>
                  <div className="mt-1 break-all font-mono text-accent-blue">verdictchain.vercel.app</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">App Server</div>
                  <div className="mt-1 break-all font-mono text-accent-green">api-production-0b30.up.railway.app</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-black/30 p-3">
                  <div className="font-bold uppercase tracking-widest text-zinc-500">Sui Proof Program</div>
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
                <Badge variant="glow-blue">Step by Step</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">What happens after upload</h2>
              </div>
              <p className="max-w-2xl text-sm leading-7 text-zinc-400">
                Each step adds something useful: a file record, a fingerprint, a storage receipt, a Sui proof, or a readable AI summary.
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
                    <span className="font-bold text-zinc-500">What you get: </span>
                    {stage.result}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8 text-center">
            <Badge variant="glow-blue">Product Map</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">What each part does</h2>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              Users only see a clean app. Behind the scenes, VerdictChain asks the right service to store files, save proof, read media, or create the case report.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr]">
            <FlowNode
              label="What the user sees"
              detail="The website shows login, cases, uploads, receipts, reports, graphs, and the public verifier."
              Icon={FileText}
            />
            <ArrowPill label="upload" />
            <FlowNode
              label="App Server"
              detail="The server checks the file, creates the fingerprint, saves records, and sends work to the other services."
              Icon={Server}
              className="border-accent-green/30"
            />
            <ArrowPill label="service calls" />
            <div className="space-y-4">
              <FlowNode label="Tatum + Walrus" detail="Stores files and gives the app a storage receipt." Icon={Cloud} />
              <FlowNode label="Sui" detail="Records proof that the file fingerprint was registered." Icon={Network} />
              <FlowNode label="OpenAI + DeepSeek" detail="Reads media and writes the case summary, report, timeline, and graph." Icon={Bot} />
            </div>
          </div>
        </section>

        <section className="border-y border-border/40 bg-black/25 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="glow-blue">Tools Used</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">Why each service is here</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-zinc-400">
                Each service has a clear job. The app stays understandable because storage, proof, verification, and AI analysis are not mixed together.
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
                    <span className="font-bold text-zinc-500">Where to see it: </span>
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
              The verifier does not rely on filenames or screenshots. It checks the file fingerprint. If the file changes, the fingerprint changes.
            </p>
            <div className="mt-6 rounded-lg border border-accent-green/25 bg-accent-green/5 p-4 text-xs leading-6 text-zinc-300">
              Demo move: upload the sample text file, verify it, change one character, and verify again. The changed file will no longer match the original evidence record.
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
              <Badge variant="glow-blue">Safety Checks</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">What keeps the demo steady</h2>
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
                  Suggested demo flow
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  Start here, create a case, upload a sample file, show the Tatum/Walrus receipt, open the case report, then verify the original and edited files in the public verifier.
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
