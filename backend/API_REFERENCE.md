# 📖 VerdictChain API Reference

All HTTP endpoints are prefixed with `/api` and return standard JSON formats.

---

## 🔒 Authentication API

### `POST /api/auth/wallet/challenge`
Create a one-time Sui wallet login challenge.

* **Request Body** (`WalletChallengeRequest`):
  ```json
  {
    "wallet_address": "0x1111111111111111111111111111111111111111111111111111111111111111"
  }
  ```
* **Response** (`WalletChallengeResponse` - `200 OK`):
  ```json
  {
    "wallet_address": "0x1111111111111111111111111111111111111111111111111111111111111111",
    "nonce": "hC_0Yefh8UfQzvLPxHdcZCl4Gm7nb5JJ7prY0hS1rLw",
    "message": "VerdictChain wallet login\nWallet: 0x1111...\nNonce: hC_0...\nExpires: 2026-06-03T12:10:00+00:00",
    "expires_at": "2026-06-03T12:10:00Z"
  }
  ```

---

### `POST /api/auth/wallet/login`
Verify the signed Sui personal message and retrieve a JWT access token.

* **Request Body** (`WalletLoginRequest`):
  ```json
  {
    "wallet_address": "0x1111111111111111111111111111111111111111111111111111111111111111",
    "nonce": "hC_0Yefh8UfQzvLPxHdcZCl4Gm7nb5JJ7prY0hS1rLw",
    "message_bytes": "VmVyZGljdENoYWluIHdhbGxldCBsb2dpbgo=",
    "signature": "base64-sui-signature-payload"
  }
  ```
* **Response** (`TokenResponse` - `200 OK`):
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer"
  }
  ```

---

### `GET /api/auth/me`
Retrieve profile info of the currently logged-in user. Requires `Authorization: Bearer <token>` header.

* **Response** (`UserResponse` - `200 OK`):
  ```json
  {
    "id": "a3b90f42-472d-4560-bfca-45928d9c223c",
    "email": "1111111111111111@wallet.verdictchain.local",
    "name": "Sui Wallet 0x1111...1111",
    "wallet_address": "0x1111111111111111111111111111111111111111111111111111111111111111",
    "created_at": "2026-06-02T11:20:00Z"
  }
  ```

---

## 💼 Case Vaults API

### `POST /api/cases`
Create a new case vault workspace. Requires Auth.

* **Request Body** (`CaseCreate`):
  ```json
  {
    "title": "Operation Midnight Sun",
    "description": "Forensics workspace on leaked offshore financial corporate records."
  }
  ```
* **Response** (`CaseResponse` - `201 Created`):
  ```json
  {
    "id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "title": "Operation Midnight Sun",
    "description": "Forensics workspace on leaked offshore financial corporate records.",
    "status": "active",
    "trust_score": 50.0,
    "owner_id": "a3b90f42-472d-4560-bfca-45928d9c223c",
    "created_at": "2026-06-02T11:25:00Z",
    "updated_at": "2026-06-02T11:25:00Z",
    "evidence_count": 0
  }
  ```

---

### `GET /api/cases`
List all cases owned by the current authenticated user.

* **Response** (`list[CaseResponse]`):
  ```json
  [
    {
      "id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
      "title": "Operation Midnight Sun",
      "description": "Forensics workspace...",
      "status": "active",
      "trust_score": 92.5,
      "owner_id": "a3b90f42-472d-4560-bfca-45928d9c223c",
      "created_at": "2026-06-02T11:25:00Z",
      "updated_at": "2026-06-02T11:45:00Z",
      "evidence_count": 4
    }
  ]
  ```

---

### `GET /api/cases/{case_id}`
Retrieve complete metadata details for a specific case vault.

* **Response** (`CaseResponse`):
  ```json
  {
    "id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "title": "Operation Midnight Sun",
    "description": "Forensics workspace...",
    "status": "active",
    "trust_score": 92.5,
    "owner_id": "a3b90f42-472d-4560-bfca-45928d9c223c",
    "created_at": "2026-06-02T11:25:00Z",
    "updated_at": "2026-06-02T11:45:00Z",
    "evidence_count": 4
  }
  ```

---

### `PUT /api/cases/{case_id}`
Partially update case vault metadata.

* **Request Body** (`CaseUpdate`):
  ```json
  {
    "title": "Operation Midnight Sun (Phase 2)",
    "status": "active"
  }
  ```
* **Response** (`CaseResponse`):
  ```json
  {
    "id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "title": "Operation Midnight Sun (Phase 2)",
    "description": "Forensics workspace...",
    "status": "active",
    "trust_score": 92.5,
    "owner_id": "a3b90f42-472d-4560-bfca-45928d9c223c",
    "created_at": "2026-06-02T11:25:00Z",
    "updated_at": "2026-06-02T11:55:00Z",
    "evidence_count": 4
  }
  ```

---

### `DELETE /api/cases/{case_id}`
Delete a case and purge all associated evidence, timeline, report, and graph snapshots.

* **Response** (`204 No Content`): Returns no content on successful deletion.

---

## 📁 Evidence API

### `POST /api/evidence/upload`
Upload an evidence file. Uses multipart form data.
Integrates hashing, Walrus protocol file upload, Sui blockchain anchoring, database records, and triggers background AI analysis.

* **Multipart Parameters**:
  * `case_id`: UUID
  * `file`: UploadFile binary
* **Response** (`EvidenceUploadResponse` - `201 Created`):
  ```json
  {
    "evidence": {
      "id": "bc98a3f1-28cd-41e9-91a5-812ea490dc61",
      "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
      "filename": "ledger_export.csv",
      "file_type": "text/csv",
      "file_size": 245910,
      "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "walrus_blob_id": "qR7y1Vp5k9n_1m2X4_5w8s9p23",
      "verification_status": "verified",
      "created_at": "2026-06-02T11:35:00Z"
    },
    "proof": {
      "id": "e4f8d229-873b-419b-ab82-4467dcf82d1c",
      "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
      "evidence_id": "bc98a3f1-28cd-41e9-91a5-812ea490dc61",
      "sui_transaction_hash": "0x78af3b18d22c9a...ef01",
      "proof_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "timestamp": "2026-06-02T11:35:02Z",
      "verification_status": "verified"
    },
    "message": "Evidence uploaded, hashed, stored on Walrus, and anchored on Sui successfully."
  }
  ```

---

### `GET /api/evidence/{evidence_id}`
Retrieve a specific piece of evidence by ID.

* **Response** (`EvidenceResponse`):
  ```json
  {
    "id": "bc98a3f1-28cd-41e9-91a5-812ea490dc61",
    "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "filename": "ledger_export.csv",
    "file_type": "text/csv",
    "file_size": 245910,
    "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "walrus_blob_id": "qR7y1Vp5k9n_1m2X4_5w8s9p23",
    "verification_status": "verified",
    "created_at": "2026-06-02T11:35:00Z"
  }
  ```

---

## 📈 Analysis & Generation APIs

### `POST /api/reports/generate?case_id={case_id}`
Trigger deep DeepSeek AI analysis to compile an investigation report, store it as JSON on Walrus, and log it to the database.

* **Response** (`ReportResponse` - `201 Created`):
  ```json
  {
    "id": "f8a92d19-94b2-4d1a-8cfa-c31d20c9213f",
    "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "walrus_blob_id": "blob_id_report_json",
    "report_json": {
      "executive_summary": "Deep-dive analysis of Midnight financial records...",
      "key_findings": [...],
      "risk_assessment": {...},
      "recommendations": [...]
    },
    "created_at": "2026-06-02T11:40:00Z"
  }
  ```

---

### `GET /api/reports/case/{case_id}`
Retrieve the latest generated investigation report for a case.

* **Response** (`ReportResponse`): Returns the same structure as above.

---

### `POST /api/timeline/generate?case_id={case_id}`
Collate all evidence items in chronological order via DeepSeek AI processing, store on Walrus, and save timeline database record.

* **Response** (`TimelineResponse` - `201 Created`):
  ```json
  {
    "id": "c1a938df-2b47-49f3-8ef8-112dfcd112d3",
    "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "walrus_blob_id": "blob_id_timeline_json",
    "timeline_json": {
      "events": [
        {
          "date": "2026-05-15",
          "event": "Company incorp",
          "evidence_linked": "ledger_export.csv"
        }
      ]
    },
    "created_at": "2026-06-02T11:41:00Z"
  }
  ```

---

### `GET /api/timeline/case/{case_id}`
Retrieve the latest generated timeline events for a case.

* **Response** (`TimelineResponse`): Returns the same structure as above.

---

### `POST /api/graph/generate?case_id={case_id}`
Run entity extraction (people, locations, contracts, money transfers) across all uploaded evidence to build a relationship graph dataset.

* **Response** (`GraphResponse` - `201 Created`):
  ```json
  {
    "id": "b8a1c9fd-429b-439d-b827-8e7c2e8c234a",
    "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
    "walrus_blob_id": "blob_id_graph_json",
    "graph_json": {
      "nodes": [
        {"id": "entity-1", "label": "Corp Ltd", "type": "organization"},
        {"id": "entity-2", "label": "Miller Trust", "type": "trust"}
      ],
      "edges": [
        {"source": "entity-1", "target": "entity-2", "relationship": "subsidiary"}
      ]
    },
    "created_at": "2026-06-02T11:42:00Z"
  }
  ```

---

### `GET /api/graph/{case_id}`
Retrieve the latest relationship graph dataset for a case vault.

* **Response** (`GraphResponse`): Returns the same structure as above.

---

## 🔍 Public Verification API

### `POST /api/verification/verify`
Public endpoint allowing anyone to verify a file's integrity and transaction proof on SUI testnet. Does not require authentication.

* **Request Body** (`VerifyRequest`):
  ```json
  {
    "file_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "sui_tx_hash": "0x78af3b18d22c9a...ef01"
  }
  ```
* **Response** (`VerifyResponse` - `200 OK`):
  ```json
  {
    "verified": true,
    "details": {
      "evidence_found": true,
      "blockchain_verified": true,
      "sui_transaction_hash": "0x78af3b18d22c9a...ef01",
      "case_title": "Operation Midnight Sun",
      "case_id": "d7c182a9-7ebf-4122-8df7-f31f9d20c5e3",
      "blockchain_details": {
        "tx_hash": "0x78af3b18d22c9a...ef01",
        "verified": true,
        "status": "success",
        "network": "testnet"
      },
      "evidence_metadata": {
        "id": "bc98a3f1-28cd-41e9-91a5-812ea490dc61",
        "filename": "ledger_export.csv",
        "file_type": "text/csv",
        "file_size": 245910,
        "verification_status": "verified",
        "created_at": "2026-06-02T11:35:00Z"
      },
      "proof_metadata": {
        "id": "e4f8d229-873b-419b-ab82-4467dcf82d1c",
        "proof_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "timestamp": "2026-06-02T11:35:02Z",
        "verification_status": "verified"
      }
    }
  }
  ```
