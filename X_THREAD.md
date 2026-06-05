# X Thread For VerdictChain

Copy these as a numbered X thread. Add screenshots or a short demo clip where possible.

## Thread

1/ I built VerdictChain: a forensic case workspace that helps prove whether a digital evidence file is the exact same file that was originally registered.

Live demo: https://verdictchain.vercel.app

2/ The problem: digital evidence is easy to rename, edit, copy, or dispute.

VerdictChain answers a simple question:

"Is this file exactly the same file we registered earlier?"

3/ The flow is simple:

Upload a file -> create a digital fingerprint -> store the evidence -> save proof on Sui -> verify later -> generate an AI case summary.

4/ Every uploaded file gets a SHA-256 fingerprint.

If one character changes, the fingerprint changes too. That makes tampering easy to demonstrate in the public verifier.

5/ Tatum is used in two places:

- Walrus upload jobs for evidence storage
- Sui network checks through Tatum's Sui gateway

The upload receipt shows job and storage details directly in the UI.

6/ Walrus gives the project a storage trail for evidence files and AI-generated case artifacts.

So VerdictChain is not just storing rows in a database. It also shows decentralized storage references where available.

7/ Sui is used for proof.

VerdictChain sends the file fingerprint to a small Sui program so the receipt can show that the evidence fingerprint was registered.

8/ AI is used carefully.

OpenAI reads images and audio first. DeepSeek then turns extracted evidence text into summaries, timelines, reports, risk notes, and relationship graphs.

9/ The report view is built for humans.

DeepSeek returns structured data, but VerdictChain presents it as a readable investigation report instead of dumping raw JSON on screen.

10/ There is also a public verifier.

Upload the original file and it verifies. Change one character and it fails. That is the whole point: simple, visible proof of file integrity.

11/ I also added a plain-English "How it works" page so reviewers can understand the project without reading code:

https://verdictchain.vercel.app/how-it-works

12/ Stack:

Next.js, FastAPI, PostgreSQL, Tatum, Walrus, Sui, OpenAI, and DeepSeek.

VerdictChain turns evidence upload into a verifiable custody trail plus an AI-assisted case workspace.

## Short Post Variant

I built VerdictChain, a forensic case workspace for digital evidence.

It creates a fingerprint for every uploaded file, stores evidence through Tatum + Walrus, records proof on Sui, verifies tampering publicly, and uses OpenAI + DeepSeek to generate readable case reports.

Demo: https://verdictchain.vercel.app
