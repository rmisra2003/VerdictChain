# VerdictChain Demo Recording Script

Use this as a 3-5 minute video script. Keep the pace calm and show the product, not the code.

## Before Recording

- Open the live app: https://verdictchain.vercel.app
- Open the explainer page in another tab: https://verdictchain.vercel.app/how-it-works
- Keep these sample files ready:
  - `demo-assets/verdictchain-demo-evidence.txt`
  - `demo-assets/verdictchain-demo-evidence-tampered.txt`
- Sign in with an email account you are comfortable showing on screen, or create a fresh demo account.
- Create a clean browser window with bookmarks/sidebar hidden.
- Zoom the browser to 90-100% so receipts and reports fit well on screen.

## Video Structure

### 0:00-0:20 - Hook

Show the homepage.

Say:

> Digital evidence is easy to rename, edit, copy, or dispute. VerdictChain is a case workspace that proves whether a file is exactly the same file that was originally registered.

Click **How It Works**.

Say:

> The flow is simple: upload a file, create a digital fingerprint, store it with Walrus through Tatum, save proof on Sui, and use AI to summarize the case.

### 0:20-0:45 - Explain The Product

Scroll briefly through `/how-it-works`.

Show:

- Upload a File
- Create a Digital Fingerprint
- Store the Evidence
- Save Proof on Sui
- Read Images and Audio
- Create the Case Summary

Say:

> I built this so reviewers can understand the project without reading code. The visible app is simple, but behind the scenes Tatum, Walrus, Sui, OpenAI, and DeepSeek each do one clear job.

### 0:45-1:10 - Sign In And Create A Case

Open **Enter Console** or go to `/dashboard`.

If not signed in, open `/auth` and sign in.

Go to **Case Vault Dossier** and create a case.

Use:

```text
Title: VC-DEMO-001 Suspicious Payment Review
Description: Synthetic demo case for verifying evidence custody, storage proof, and AI investigation summaries.
```

Say:

> I start by creating a case vault. Everything I upload next belongs to this case, so the evidence, proof, and AI report stay connected.

### 1:10-1:55 - Upload Evidence And Show Receipt

Go to **Advanced Ingestion**.

Select the new case.

Upload:

```text
demo-assets/verdictchain-demo-evidence.txt
```

After upload, show the receipt.

Point out:

- SHA-256 fingerprint
- Tatum/Walrus job or blob details
- Sui proof status or transaction
- AI extraction summary if visible

Say:

> The first important thing is the SHA-256 fingerprint. This identifies the exact file. The receipt also shows the Tatum and Walrus storage trail, and the Sui proof path for the registered fingerprint.

If Walrus or Sui is pending:

> Some decentralized storage and proof steps can be asynchronous, so the app keeps the job and proof status visible instead of hiding it.

### 1:55-2:35 - Show The Case Workspace

Open **Case Vault Dossier**, then open the case you created.

Show the evidence tab.

Point out:

- Evidence file metadata
- Extracted text preview
- AI evidence summary
- AI artifact Walrus blob, if available

Say:

> The case page is where the raw upload becomes useful. I can see the registered file, the fingerprint, storage details, extracted text, and AI summary in one place.

### 2:35-3:15 - Generate Report, Timeline, And Graph

In the case workspace:

1. Open **Forensic Report** and click **Generate Report**.
2. Show the formatted DeepSeek report.
3. Open **DeepSeek Timeline** and generate if time allows.
4. Open **Relationship Graph** and generate if time allows.

Say:

> DeepSeek turns the extracted evidence into an investigation report, a timeline, and a relationship graph. The report is shown in a readable format, not raw JSON, so it is easy to explain during a review.

If generation takes time:

> This is calling live AI services, so I’ll give it a moment. The app also rate-limits AI-heavy actions so the demo stays stable.

### 3:15-4:00 - Public Verification

Open `/verify`.

Upload:

```text
demo-assets/verdictchain-demo-evidence.txt
```

Show that it verifies.

Say:

> Now I can verify the original file publicly. VerdictChain computes the fingerprint again and checks whether it matches registered evidence.

Then upload:

```text
demo-assets/verdictchain-demo-evidence-tampered.txt
```

Show that it does not verify.

Say:

> This second file looks almost identical, but the amount changed by one dollar. That one-character change creates a different fingerprint, so VerdictChain does not treat it as the original evidence.

### 4:00-4:30 - Closing

Return to `/how-it-works` or the homepage.

Say:

> VerdictChain combines evidence storage, file fingerprinting, Sui proof, Tatum and Walrus storage visibility, and AI investigation summaries in one workflow. The goal is simple: make digital evidence easier to trust, verify, and explain.

End screen:

```text
Live demo: https://verdictchain.vercel.app
How it works: https://verdictchain.vercel.app/how-it-works
Public verifier: https://verdictchain.vercel.app/verify
```

## Optional Add-On: Image Or Audio AI Demo

If you have 30 extra seconds, upload a readable screenshot or short audio clip.

Say:

> For images and audio, OpenAI extracts text or transcript first. Then DeepSeek uses that extracted text to generate summaries, entities, reports, timelines, and graph data.

Good quick image idea:

- Create a screenshot with readable text like:

```text
Invoice Alpha
Vendor: Apex Recovery LLC
Amount: $48,750
Date: June 5, 2026
```

## Backup Lines

Use these if something is pending or slow:

- "This is using live services, so some storage and proof status can take a few seconds."
- "The app keeps pending job ids visible so the reviewer can see what is happening."
- "The important thing is that the file fingerprint remains stable for the original file and changes when the file is edited."
- "The report is generated from extracted evidence text, so richer files produce richer AI summaries."

## What Not To Show

- Do not show API keys, Railway variables, Vercel environment variables, `.env` files, or terminal history.
- Do not upload private documents.
- Do not use your main email inbox on screen.
- Do not spend time explaining implementation code unless specifically asked.
