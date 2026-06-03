export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const TOKEN_KEY = "verdictchain_access_token";
const ACTIVE_CASE_ID_KEY = "verdictchain_active_case_id";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  wallet_address?: string | null;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user?: UserProfile;
}

export interface CaseRecord {
  id: string;
  title: string;
  description: string;
  status: "active" | "archived" | "closed" | string;
  trust_score: number;
  owner_id: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
}

export interface EvidenceRecord {
  id: string;
  case_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  sha256_hash: string;
  walrus_blob_id?: string | null;
  verification_status: string;
  created_at: string;
}

export interface ProofRecord {
  id: string;
  case_id: string;
  evidence_id: string;
  sui_transaction_hash?: string | null;
  proof_hash: string;
  timestamp: string;
  verification_status: string;
}

export interface EvidenceUploadApiResponse {
  evidence: EvidenceRecord;
  proof?: ProofRecord | null;
  walrus_metadata: {
    provider?: string;
    blob_id?: string;
    job_id?: string;
    status?: string;
    raw?: Record<string, unknown>;
  };
  message: string;
}

export interface TimelineRecord {
  id: string;
  case_id: string;
  walrus_blob_id?: string | null;
  timeline_json: {
    events?: Array<Record<string, unknown>>;
    [key: string]: unknown;
  };
  created_at: string;
}

export interface ReportRecord {
  id: string;
  case_id: string;
  walrus_blob_id?: string | null;
  report_json: Record<string, unknown>;
  created_at: string;
}

export interface GraphRecord {
  id: string;
  case_id: string;
  walrus_blob_id?: string | null;
  graph_json: {
    nodes?: Array<{
      id: string;
      label?: string;
      type?: string;
      metadata?: Record<string, unknown>;
    }>;
    edges?: Array<{
      source: string;
      target: string;
      label?: string;
      weight?: number;
    }>;
    [key: string]: unknown;
  };
  created_at: string;
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
    evidence_metadata?: EvidenceRecord | null;
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

export interface SuiWalletChallenge {
  wallet_address: string;
  nonce: string;
  message: string;
  expires_at: string;
}

export function isApiConfigured(): boolean {
  return API_BASE_URL.length > 0;
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function storeAuthToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ACTIVE_CASE_ID_KEY);
}

export function getActiveCaseId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_CASE_ID_KEY);
}

export function setActiveCaseId(caseId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CASE_ID_KEY, caseId);
}

function requireApiBaseUrl() {
  if (!isApiConfigured()) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured.");
  }
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> {
  requireApiBaseUrl();

  const headers = new Headers(init.headers);
  if (options.auth) {
    const token = getStoredToken();
    if (!token) {
      throw new Error("Authentication required. Sign in before using this workspace.");
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getCurrentUser(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/auth/me", {}, { auth: true });
}

export async function requestSuiWalletChallenge(walletAddress: string): Promise<SuiWalletChallenge> {
  return apiRequest<SuiWalletChallenge>("/api/auth/wallet/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
}

export async function loginWithSuiWalletSignature(input: {
  wallet_address: string;
  nonce: string;
  message_bytes: string;
  signature: string;
}): Promise<AuthSession> {
  const tokenResponse = await apiRequest<{ access_token: string; token_type: "bearer" }>(
    "/api/auth/wallet/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  storeAuthToken(tokenResponse.access_token);
  const user = await getCurrentUser();
  return { token: tokenResponse.access_token, user };
}

export async function listCases(): Promise<CaseRecord[]> {
  const cases = await apiRequest<CaseRecord[]>("/api/cases", {}, { auth: true });
  const activeCaseId = getActiveCaseId();
  if ((!activeCaseId || !cases.some((item) => item.id === activeCaseId)) && cases[0]) {
    setActiveCaseId(cases[0].id);
  }
  return cases;
}

export async function createCase(input: { title: string; description: string }): Promise<CaseRecord> {
  const created = await apiRequest<CaseRecord>(
    "/api/cases",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
    { auth: true },
  );
  setActiveCaseId(created.id);
  return created;
}

export async function getCase(caseId: string): Promise<CaseRecord> {
  return apiRequest<CaseRecord>(`/api/cases/${encodeURIComponent(caseId)}`, {}, { auth: true });
}

export async function listEvidenceByCase(caseId: string): Promise<EvidenceRecord[]> {
  return apiRequest<EvidenceRecord[]>(
    `/api/evidence/case/${encodeURIComponent(caseId)}`,
    {},
    { auth: true },
  );
}

export async function uploadEvidenceToApi(
  file: File,
  caseId: string,
): Promise<EvidenceUploadApiResponse> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Authentication required. Sign in before uploading evidence.");
  }

  requireApiBaseUrl();
  const formData = new FormData();
  formData.append("case_id", caseId);
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/evidence/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401) {
    clearAuthSession();
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Evidence upload failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as EvidenceUploadApiResponse;
}

export async function getTatumWalrusJobStatus(jobId: string): Promise<TatumWalrusJobStatus> {
  return apiRequest<TatumWalrusJobStatus>(
    `/api/evidence/walrus/status/${encodeURIComponent(jobId)}`,
    {},
    { auth: true },
  );
}

export async function getCaseTimeline(caseId: string): Promise<TimelineRecord | null> {
  try {
    return await apiRequest<TimelineRecord>(
      `/api/timeline/case/${encodeURIComponent(caseId)}`,
      {},
      { auth: true },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function generateCaseTimeline(caseId: string): Promise<TimelineRecord> {
  return apiRequest<TimelineRecord>(
    `/api/timeline/generate?case_id=${encodeURIComponent(caseId)}`,
    { method: "POST" },
    { auth: true },
  );
}

export async function getCaseReport(caseId: string): Promise<ReportRecord | null> {
  try {
    return await apiRequest<ReportRecord>(
      `/api/reports/case/${encodeURIComponent(caseId)}`,
      {},
      { auth: true },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function generateCaseReport(caseId: string): Promise<ReportRecord> {
  return apiRequest<ReportRecord>(
    `/api/reports/generate?case_id=${encodeURIComponent(caseId)}`,
    { method: "POST" },
    { auth: true },
  );
}

export async function getCaseGraph(caseId: string): Promise<GraphRecord | null> {
  try {
    return await apiRequest<GraphRecord>(
      `/api/graph/${encodeURIComponent(caseId)}`,
      {},
      { auth: true },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("(404)")) return null;
    throw error;
  }
}

export async function generateCaseGraph(caseId: string): Promise<GraphRecord> {
  return apiRequest<GraphRecord>(
    `/api/graph/generate?case_id=${encodeURIComponent(caseId)}`,
    { method: "POST" },
    { auth: true },
  );
}

export async function verifyEvidenceHash(
  fileHash: string,
  suiTxHash?: string,
): Promise<VerifyApiResponse> {
  return apiRequest<VerifyApiResponse>("/api/verification/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file_hash: fileHash,
      sui_tx_hash: suiTxHash || null,
    }),
  });
}

export async function calculateFileSha256(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
