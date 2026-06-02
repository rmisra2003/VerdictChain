export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "verdictchain_demo_token";
const CASE_ID_KEY = "verdictchain_demo_case_id";

export interface DemoSession {
  access_token: string;
  token_type: "bearer";
  case_id: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface EvidenceUploadApiResponse {
  evidence: {
    id: string;
    case_id: string;
    filename: string;
    file_type: string;
    file_size: number;
    sha256_hash: string;
    walrus_blob_id?: string | null;
    verification_status: string;
    created_at: string;
  };
  proof?: {
    id: string;
    case_id: string;
    evidence_id: string;
    sui_transaction_hash?: string | null;
    proof_hash: string;
    timestamp: string;
    verification_status: string;
  } | null;
  walrus_metadata: {
    provider?: string;
    blob_id?: string;
    job_id?: string;
    status?: string;
    raw?: Record<string, unknown>;
  };
  message: string;
}

export interface VerifyApiResponse {
  verified: boolean;
  details: {
    evidence_found?: boolean;
    blockchain_verified?: boolean;
    walrus_verified?: boolean;
    certification_pending?: boolean;
    sui_transaction_hash?: string | null;
    case_title?: string | null;
    case_id?: string | null;
    blockchain_details?: Record<string, unknown>;
    walrus_details?: Record<string, unknown>;
    evidence_metadata?: {
      id: string;
      filename: string;
      file_type: string;
      file_size: number;
      verification_status: string;
      created_at: string;
    } | null;
    proof_metadata?: {
      id: string;
      proof_hash: string;
      timestamp: string;
      verification_status: string;
    } | null;
  };
}

export interface TatumWalrusJobStatus {
  job_id?: string;
  jobId?: string;
  provider?: string;
  status?: string;
  state?: string;
  blobId?: string;
  blob_id?: string;
  [key: string]: unknown;
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

function getStoredSession(): { token: string; caseId: string } | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const caseId = window.localStorage.getItem(CASE_ID_KEY);
  if (!token || !caseId) return null;
  return { token, caseId };
}

function storeSession(session: DemoSession) {
  window.localStorage.setItem(TOKEN_KEY, session.access_token);
  window.localStorage.setItem(CASE_ID_KEY, session.case_id);
}

async function bootstrapDemoSession(): Promise<{ token: string; caseId: string } | null> {
  if (!isApiConfigured() || process.env.NEXT_PUBLIC_ENABLE_DEMO_BOOTSTRAP !== "true") {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/demo/bootstrap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Demo bootstrap failed (${response.status})`);
  }

  const session = (await response.json()) as DemoSession;
  storeSession(session);
  return { token: session.access_token, caseId: session.case_id };
}

export async function ensureApiSession(): Promise<{ token: string; caseId: string }> {
  const stored = getStoredSession();
  if (stored) return stored;

  const bootstrapped = await bootstrapDemoSession();
  if (bootstrapped) return bootstrapped;

  const envToken = process.env.NEXT_PUBLIC_DEMO_ACCESS_TOKEN;
  const envCaseId = process.env.NEXT_PUBLIC_DEMO_CASE_ID;
  if (envToken && envCaseId) {
    return { token: envToken, caseId: envCaseId };
  }

  throw new Error("Backend API is configured, but no demo session or case ID is available.");
}

export async function uploadEvidenceToApi(file: File): Promise<EvidenceUploadApiResponse> {
  const session = await ensureApiSession();
  const formData = new FormData();
  formData.append("case_id", session.caseId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/evidence/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Evidence upload failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as EvidenceUploadApiResponse;
}

export async function getTatumWalrusJobStatus(jobId: string): Promise<TatumWalrusJobStatus> {
  const session = await ensureApiSession();
  const response = await fetch(
    `${API_BASE_URL}/api/evidence/walrus/status/${encodeURIComponent(jobId)}`,
    {
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Tatum Walrus status lookup failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as TatumWalrusJobStatus;
}

export async function verifyEvidenceHash(
  fileHash: string,
  suiTxHash?: string,
): Promise<VerifyApiResponse> {
  if (!isApiConfigured()) {
    throw new Error("Backend API is not configured.");
  }

  const response = await fetch(`${API_BASE_URL}/api/verification/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_hash: fileHash,
      sui_tx_hash: suiTxHash || null,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Verification failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as VerifyApiResponse;
}

export async function calculateFileSha256(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
