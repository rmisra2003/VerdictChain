# VerdictChain Sui Notary

Minimal Sui Move package for sealing VerdictChain evidence hashes on Sui.

The deployed package exposes:

- Module: `verdictchain_notary`
- Entry function: `seal_evidence`

Each call creates an owned `EvidenceSeal` object and emits an `EvidenceSealed`
event containing the evidence hash, evidence ID, case ID, and sender address.
