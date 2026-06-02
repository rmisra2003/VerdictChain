export interface EvidenceItem {
  id: string;
  name: string;
  type: 'document' | 'media' | 'audio' | 'chat';
  source: string;
  timestamp: string;
  hash: string;
  suiTx: string;
  walrusBlob: string;
  size: string;
  trustScore: number;
  status: 'verified' | 'tampered' | 'pending';
  content?: string;
  metadata: Record<string, string>;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
  txHash: string;
  status: 'verified' | 'warning';
}

export interface CaseData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'archived' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  investigator: string;
  trustScore: number;
  blockchainHash: string;
  walrusStorageProof: string;
  evidenceCount: number;
  createdAt: string;
  updatedAt: string;
  evidenceItems: EvidenceItem[];
  timelineEvents: TimelineEvent[];
  report: string;
}

export const mockCases: CaseData[] = [
  {
    id: "VC-2026-09",
    title: "Project Aurora Source Leak",
    description: "Investigation into the illegal exfiltration of proprietary quantum-cryptography source code from NovaSpace Labs to an unlisted IP address based in Zurich.",
    status: "active",
    priority: "critical",
    investigator: "Dr. Evelyn Wright, Senior Cyber-Forensics Officer",
    trustScore: 99.4,
    blockchainHash: "0x3898ffa83211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac444",
    walrusStorageProof: "walrus://blob/ea82312b-389f-4311-bf32-cae991208cf1",
    evidenceCount: 4,
    createdAt: "2026-05-12T08:30:00Z",
    updatedAt: "2026-06-01T15:45:00Z",
    evidenceItems: [
      {
        id: "EVID-09-01",
        name: "Zurich_Server_Ingress_Logs.txt",
        type: "document",
        source: "NovaSpace Perimeter Firewall",
        timestamp: "2026-05-11T23:14:02Z",
        hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        suiTx: "0x89abf21...28ff",
        walrusBlob: "walrus://blob/b523...18c2",
        size: "142 KB",
        trustScore: 100,
        status: "verified",
        content: `23:14:00 INGRESS ACCEPT TCP [192.168.1.42] -> [185.228.168.12:443] - SSL Established
23:14:02 DATA TRANSFER BEGIN - SESSION_ID: 9811A23
23:14:15 SENT: 45.2MB (SHA-256 MATCH FOR PROJECT_AURORA_CORE.TAR.GZ)
23:14:16 SESSION CLOSED BY REMOTE HOST - TCP_FIN RECEIVED`,
        metadata: {
          "Device Name": "PA-5450-Firewall",
          "Ingress IP": "192.168.1.42 (Internal Development Node)",
          "Egress IP": "185.228.168.12 (Zurich Shared Proxy)",
          "Anchor Block": "14,882,903",
          "Hash Standard": "SHA-256"
        }
      },
      {
        id: "EVID-09-02",
        name: "Security_Cam_DevSector_4.mp4",
        type: "media",
        source: "Physical Security CCTV",
        timestamp: "2026-05-11T23:10:00Z",
        hash: "7f83b1657ff1fc53b92c18128a1c8412ffae5c678aef151125f4d1c448ab115b",
        suiTx: "0xca823f9...f08a",
        walrusBlob: "walrus://blob/de38...99ca",
        size: "18.4 MB",
        trustScore: 98.8,
        status: "verified",
        content: "[CCTV Video Stream - Dev Sector 4 Core Workspace. Visual shows Developer Desk #12 occupied by lead system engineer Marcus Vance. Vance inserts a black USB 4.0 storage drive and accesses the local code repository shell. Session matches firewall logs exactly.]",
        metadata: {
          "Camera ID": "CAM-DEV-SECTOR-4-NW",
          "Compression": "H.265 / HEVC",
          "Sensor Hash": "0xfe382a...98cc",
          "Sui Tx Seal": "0x38fa83a...bcde",
          "Custodian": "H. Vance, Security Chief"
        }
      },
      {
        id: "EVID-09-03",
        name: "Vance_Personal_Phone_Recording.wav",
        type: "audio",
        source: "Authorized Audio Intercept",
        timestamp: "2026-05-12T02:30:00Z",
        hash: "8c3b9de2f211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac6f3",
        suiTx: "0xde438a2...321a",
        walrusBlob: "walrus://blob/df83...108d",
        size: "4.2 MB",
        trustScore: 99.1,
        status: "verified",
        content: `[00:02] VANCE: The package is already in the Zurich server.
[00:07] UNKNOWN: Excellent. The wire transfer will complete once our engineering audits the cryptography keys.
[00:15] VANCE: It's all there. Every line of the quantum core. Delete our telegram thread immediately.`,
        metadata: {
          "Device Model": "iPhone 15 Pro",
          "Format": "PCM Linear 24-bit",
          "Capture Device": "Encase Mobile Audio Inspector",
          "Cryptographic Seal": "Anchored via Tatum API",
          "Audio Signature Hash": "0xfa38290ab"
        }
      },
      {
        id: "EVID-09-04",
        name: "Encrypted_Telegram_Chats.json",
        type: "chat",
        source: "Vance Personal Device Dump",
        timestamp: "2026-05-12T01:15:00Z",
        hash: "a389fca83211516e8b5cf6ea1c10d3220f18836ff5b6cae125c10d322efac892",
        suiTx: "0xef382b...839f",
        walrusBlob: "walrus://blob/e38f...728e",
        size: "34 KB",
        trustScore: 99.8,
        status: "verified",
        content: `[01:12] Vance: "Done. Used the DevSector-4 terminal to bypass IP restrictions."
[01:13] Contact X: "Confirm file hash matches SHA-256 ending in b855."
[01:14] Vance: "Checked and verified. It matches. Transfer the funds."`,
        metadata: {
          "Extraction Tool": "Cellebrite Premium v9.8",
          "Target Identity": "Marcus Vance",
          "Integrity Check": "Passed - No deletions detected",
          "Block Height": "14,883,042"
        }
      }
    ],
    timelineEvents: [
      {
        id: "EV-09-01",
        title: "Code Repository Access Session",
        description: "Marcus Vance logged in to repository server using developer credentials at Desk #12.",
        timestamp: "2026-05-11T23:08:45Z",
        actor: "Marcus Vance",
        txHash: "0x8fa3...ab82",
        status: "verified"
      },
      {
        id: "EV-09-02",
        title: "Physical Surveillance Capture",
        description: "CCTV Sector 4NW records Vance inserting USB drive and pulling full local clone of quantum repository.",
        timestamp: "2026-05-11T23:10:00Z",
        actor: "CCTV Camera Sector 4",
        txHash: "0xca82...f08a",
        status: "verified"
      },
      {
        id: "EV-09-03",
        title: "Exfiltration Transmission Triggered",
        description: "Firewall logs flag egress SSL transfer of encrypted archive ending in b855 to Zurich server.",
        timestamp: "2026-05-11T23:14:15Z",
        actor: "NovaSpace Perimeter Firewall",
        txHash: "0x89ab...28ff",
        status: "verified"
      },
      {
        id: "EV-09-04",
        title: "Mobile Forensics Ingestion",
        description: "Cellebrite device dump reveals instant messaging sync confirming the Zurich upload.",
        timestamp: "2026-05-12T01:15:00Z",
        actor: "Forensics Lab Agent 4",
        txHash: "0xef38...839f",
        status: "verified"
      }
    ],
    report: `## FORENSIC REPORT: PROJECT AURORA DATA BREACH
**Case Reference:** VC-2026-09
**Lead Investigator:** Dr. Evelyn Wright
**Target Subject:** Marcus Vance, Lead System Engineer
**Date of Assessment:** June 2, 2026

### 1. Executive Summary
On May 11, 2026, at approximately 23:14 UTC, a severe digital assets breach occurred at NovaSpace Labs. Proprietary quantum-cryptography source code was illegally exfiltrated to an external Swiss-proxy node. Forensic investigation has implicated lead system engineer **Marcus Vance**. 

All evidence files gathered in this investigation have been cryptographically hashed and anchored on the **Sui Blockchain** with decentralized storage proofs on **Walrus**, creating an immutable chain of custody.

### 2. Timeline and Technical Analysis
- **Phase A (Initial Access):** At **23:08:45 UTC**, Marcus Vance initialized an active session on the developer node \`192.168.1.42\`.
- **Phase B (Extraction):** Physical security logs (CCTV CCTV-4NW) capture the insertion of an unauthorized storage media. At **23:10:00 UTC**, a binary archive was generated.
- **Phase C (Transmission):** At **23:14:15 UTC**, the NovaSpace perimeter firewall recorded a \`45.2 MB\` egress transfer to an external proxy server (\`185.228.168.12\`). The hash of the transmitted file matches the local quantum database exactly.

### 3. Cryptographic Verification Trail
All evidence files mapped below possess immutable digital signatures verified via **VerdictChain's Sui Anchor Smart Contract**:

1. **Zurich_Server_Ingress_Logs.txt:** \`e3b0c44298fc1c149afbf4...855\` (Sui Tx: \`0x89abf21...28ff\`)
2. **Security_Cam_DevSector_4.mp4:** \`7f83b1657ff1fc53b92c1...15b\` (Sui Tx: \`0xca823f9...f08a\`)

### 4. Forensic Verdict
**HIGH CERTAINTY PROOF OF DATA BREACH.** Subject Marcus Vance has directly violated security protocols, extracted proprietary code, and completed a commercial transaction with an unauthorized foreign agent. Chains of custody are completely secured and untampered.`
  },
  {
    id: "VC-2026-11",
    title: "Hedgehog Corp Financial Exploitation",
    description: "Detection of corporate ledger anomalies and wire transfers. Core ledger spreadsheets appear to have altered values that contradict bank statements.",
    status: "active",
    priority: "high",
    investigator: "Sarah Jenkins, Forensic Accountant",
    trustScore: 42.5,
    blockchainHash: "0xefab2b8812c332ab5d8dcf9191e3b2e59a8cde18bcdefa82a03b3ef39cf83212",
    walrusStorageProof: "walrus://blob/fe38a230-8a1a-411a-bf98-debc9901bc23",
    evidenceCount: 3,
    createdAt: "2026-05-18T10:00:00Z",
    updatedAt: "2026-06-02T09:12:00Z",
    evidenceItems: [
      {
        id: "EVID-11-01",
        name: "Ledger_Q1_Final.xlsx",
        type: "document",
        source: "Accounting Shared Drive",
        timestamp: "2026-05-15T14:30:00Z",
        hash: "82a93b2aef38cf8290ab98129ccde30fa28ffab2bcde38a29a03b3fce98ca128",
        suiTx: "0xfe382aa...28cd",
        walrusBlob: "walrus://blob/f839...ca98",
        size: "1.2 MB",
        trustScore: 24.5,
        status: "tampered",
        content: `LEDGER TRANSACTION SHEET: Q1 CLOSING
TOTAL INWARD REVENUE: $14,250,000.00
EXPENDITURES (CONSULTANCY): $4,850,000.00 -> Transfer to Apex Advisory LLC
REMAINING RESERVE: $9,400,000.00
[ALERT: System hash does not match original SUI contract anchor block #14,892,102. Original hash: 'b12a83e...a24f']`,
        metadata: {
          "Created By": "Marcus Finch, Accountant",
          "Original Hash": "b12a83edf1f8c2bde283fa88812a0f8b",
          "Active Hash": "82a93b2aef38cf8290ab98129ccde30f",
          "Tampering Analysis": "Ledger was modified on May 18 after original blockchain seal was anchored."
        }
      },
      {
        id: "EVID-11-02",
        name: "Apex_Advisory_Bank_Statement.pdf",
        type: "document",
        source: "Subpoenaed Bank Record",
        timestamp: "2026-05-16T09:00:00Z",
        hash: "ef38cde92a83bcde128fc83921abc293dfac82ef893a201bb8a39e8fc92c81d2",
        suiTx: "0xdeab389...83bc",
        walrusBlob: "walrus://blob/ea38...bc2a",
        size: "340 KB",
        trustScore: 100,
        status: "verified",
        content: `METROPOLIS BUSINESS BANK - WIRE INCOMING
SENDER: HEDGEHOG CORP LLC
RECEIVER: APEX ADVISORY LLC
AMOUNT: $4,850,000.00
TRANSACTION STATUS: CLEARED (MAY 15 2026)
BENEFICIARY ACCOUNT INHABITANT: RICHARD FINCH (BROTHER OF HEDGEHOG CFO MARCUS FINCH)`,
        metadata: {
          "Bank Router": "MBB-US-33",
          "Cryptographic Seal": "Metropolis Bank Core Notary API",
          "Verification Source": "SUI Oracle Integration"
        }
      },
      {
        id: "EVID-11-03",
        name: "Corporate_Slack_Audit.json",
        type: "chat",
        source: "Internal Slack Archive",
        timestamp: "2026-05-14T16:15:00Z",
        hash: "ab389fcde2188ab3cf28aa91cc83ab29ff8e83ab829adcb3f28d8cf98fa201da",
        suiTx: "0xbc389ef...12fa",
        walrusBlob: "walrus://blob/df38...a28b",
        size: "18 KB",
        trustScore: 98.2,
        status: "verified",
        content: `[16:12] M. Finch: "I have updated the consultancy line to Apex Advisory."
[16:13] CEO James: "Perfect. Does the blockchain verify this ledger?"
[16:14] M. Finch: "Yes, I sealed the ledger just now. (Original version sealed)."
[16:15] M. Finch: "[Deleted Message] - Wait, I need to make a correction."`,
        metadata: {
          "Workspace ID": "HEDGEHOG-CORP-HQ",
          "Target Channel": "#finance-ops",
          "Security Seal": "Tatum API Sealed"
        }
      }
    ],
    timelineEvents: [
      {
        id: "EV-11-01",
        title: "Slack Transaction Planning",
        description: "Marcus Finch reports ledgers are set for sealing, with a subsequently deleted communication.",
        timestamp: "2026-05-14T16:12:00Z",
        actor: "Marcus Finch",
        txHash: "0xbc38...12fa",
        status: "verified"
      },
      {
        id: "EV-11-02",
        title: "Original Blockchain Seal",
        description: "Original Q1 ledger sealed with hash 'b12a83e...a24f' on the Sui network at block 14,892,102.",
        timestamp: "2026-05-15T14:02:00Z",
        actor: "VerdictChain Automation",
        txHash: "0xfe38...28cd",
        status: "verified"
      },
      {
        id: "EV-11-03",
        title: "Ledger Alteration Detected",
        description: "CRITICAL ALERT: File ledger spreadsheet was accessed and re-saved. Active hash does not match original anchor seal.",
        timestamp: "2026-05-18T10:00:00Z",
        actor: "Marcus Finch",
        txHash: "N/A - TAMPERED",
        status: "warning"
      }
    ],
    report: `## FORENSIC REPORT: HEDGEHOG CORP FINANCIAL AUDIT
**Case Reference:** VC-2026-11
**Lead Investigator:** Sarah Jenkins, Forensic Accountant
**Target Subject:** Marcus Finch (CFO)
**Date of Assessment:** June 2, 2026

### 1. Executive Summary
An ongoing internal audit of Hedgehog Corp's Q1 financial records has identified critical tampering within the core accounting ledgers. The current active version of \`Ledger_Q1_Final.xlsx\` fails to match the original cryptographic seal anchored on-chain. This tampering masks an unauthorized \`$4,850,000.00\` transaction.

### 2. Discovered Contradictions
- **Blockchain Mismatch:** On May 15, 2026, the ledger was sealed with SHA-256 hash \`b12a83edf1...a24f\`. The current file's hash has shifted to \`82a93b2aef...c128\`.
- **Anomalous Egress:** The ledger indicates a $4.85M payment to Apex Advisory LLC for "Q1 Strategy Consulting". Bank records reveal that the beneficiary owner of Apex Advisory LLC is Richard Finch, the brother of the CFO Marcus Finch.

### 3. Conclusion
**TAMPERING AND WIRE FRAUD CONFIRMED.** The cryptographic chain-of-custody established by VerdictChain successfully flagged the alteration of financial spreadsheets, revealing CFO Marcus Finch's attempts to redirect corporate capital to a shell company owned by a family member.`
  },
  {
    id: "VC-2026-14",
    title: "Nexus Biotech Patent Espionage",
    description: "Alleged theft of proprietary enzyme sequencing formulas by an internal scientist during negotiations with a pharma conglomerate.",
    status: "closed",
    priority: "medium",
    investigator: "Alex Carter, Security Lead",
    trustScore: 97.8,
    blockchainHash: "0xca828aa9ef387abfde38ccde921abcf928271fe928e3b2e5a0fbe28e28a0ca38",
    walrusStorageProof: "walrus://blob/df38c92b-8a2a-442c-bcde-38fa90cc289f",
    evidenceCount: 2,
    createdAt: "2026-04-20T12:00:00Z",
    updatedAt: "2026-05-10T11:22:00Z",
    evidenceItems: [
      {
        id: "EVID-14-01",
        name: "Enzyme_Formula_Sequence_9.pdf",
        type: "document",
        source: "Research Vault 3",
        timestamp: "2026-04-18T16:00:00Z",
        hash: "da83cde28abcf389ccde128912efc827382efbe829efca28ef9812bcfe89ca28",
        suiTx: "0xfe382aa...28ff",
        walrusBlob: "walrus://blob/fb38...99d2",
        size: "2.4 MB",
        trustScore: 100,
        status: "verified",
        content: `ENZYME BIOCATALYST FORMULA: SEQUENCE-9
STRUCTURE: VAL-GLY-SER-THR-PRO-ALA-GLY-CYS
MUTATION SPEED: 1.4x Standard Kinetic Rate
PATENT PENDING Anchor ID: SUI-PAT-908`,
        metadata: {
          "Lab Equipment": "Thermo-Scientific Sequencer 9X",
          "Assigned Scientist": "Dr. Aris Thorne",
          "Verification Stamp": "Sealed by Sui Smart Contract"
        }
      },
      {
        id: "EVID-14-02",
        name: "Thorne_Laptop_Access_Logs.csv",
        type: "document",
        source: "Endpoint Security Agent",
        timestamp: "2026-04-19T02:00:00Z",
        hash: "b389fca8329abfde28ccde8291a2bcde38cdefa19cde29fb3e8d2e8b28cfda28",
        suiTx: "0xbc892a2...48ee",
        walrusBlob: "walrus://blob/ea38...18bb",
        size: "48 KB",
        trustScore: 95.6,
        status: "verified",
        content: `01:58:12 USB_INSERTED: 'Sandisk Extreme 128G'
01:59:02 COPY_BEGIN: Enzyme_Formula_Sequence_9.pdf -> USB://
01:59:08 COPY_COMPLETE`,
        metadata: {
          "Host Name": "ATHORNE-LAPTOP-02",
          "OS": "Windows 11 Enterprise",
          "Security Client": "CrowdStrike Falcon"
        }
      }
    ],
    timelineEvents: [
      {
        id: "EV-14-01",
        title: "Formula Generation",
        description: "Enzyme bio-catalyst sequence finalized in Lab 3 and sealed.",
        timestamp: "2026-04-18T16:00:00Z",
        actor: "Dr. Aris Thorne",
        txHash: "0xfe38...28ff",
        status: "verified"
      },
      {
        id: "EV-14-02",
        title: "Late-Night USB Copy",
        description: "Endpoint security flags late-night copy of formula sequence to a USB storage device.",
        timestamp: "2026-04-19T01:59:02Z",
        actor: "Laptop Security Agent",
        txHash: "0xbc89...48ee",
        status: "verified"
      }
    ],
    report: `## PATENT INFRINGEMENT AUDIT: SEQUENCE-9
**Case Reference:** VC-2026-14
**Lead Investigator:** Alex Carter

### 1. Findings
Auditing Dr. Aris Thorne's endpoints showed the extraction of Sequence-9 patent blueprints. The USB transfer hash matched the master file, which is anchored on the Sui network under transaction \`0xfe382aa...28ff\`.

### 2. Legal Status
Subject confessed to sharing the data for a personal patent application. The case has been settled, and access permissions in Lab 3 have been completely overhauled.`
  }
];
