import { getToken } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const headers = new Headers(options.headers);
  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const parsed = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      `Request failed with status ${response.status}`,
      response.status,
      parsed,
    );
  }

  return parsed as T;
}

export type HealthResponse = {
  status: string;
  service: string;
  environment: string;
  timestamp: string;
};

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/v1/health");
}

// --- Auth ---

export type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: {
    id: string;
    email: string;
    full_name: string;
    persona: string;
  };
};

export function login(email: string, password = "demo"): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function getMe(): Promise<{ user: LoginResponse["user"] }> {
  return apiFetch("/api/v1/auth/me");
}

export function logout(): Promise<void> {
  return apiFetch("/api/v1/auth/logout", { method: "POST" });
}

// --- Access Requests ---

export type Environment =
  | "development"
  | "staging"
  | "production"
  | "production-db";

export type RequestStatus =
  | "pending"
  | "auto_approved"
  | "approved"
  | "denied"
  | "expired"
  | "revoked";

export type AccessRequest = {
  id: string;
  requester_id: string;
  environment: Environment;
  requested_role: string;
  duration_minutes: number;
  justification: string;
  status: RequestStatus;
  policy_decision: string | null;
  policy_reason: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AccessRequestList = {
  items: AccessRequest[];
  total: number;
};

export type CreateAccessRequest = {
  environment: Environment;
  requested_role: string;
  duration_minutes: number;
  justification: string;
};

export function createAccessRequest(
  payload: CreateAccessRequest,
): Promise<AccessRequest> {
  return apiFetch<AccessRequest>("/api/v1/access/requests", {
    method: "POST",
    body: payload,
  });
}

export function listAccessRequests(): Promise<AccessRequestList> {
  return apiFetch<AccessRequestList>("/api/v1/access/requests");
}

export function getAccessRequest(id: string): Promise<AccessRequest> {
  return apiFetch<AccessRequest>(`/api/v1/access/requests/${id}`);
}

// --- Dashboard ---

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardRecentEvent = {
  id: string;
  event_type: string;
  request_id: string | null;
  created_at: string;
};

export type DashboardSummary = {
  total_requests: number;
  requests_by_status: DashboardStatusCount[];
  active_leases: number;
  pending_approvals: number;
  average_decision_seconds: number | null;
  recent_events: DashboardRecentEvent[];
  generated_at: string;
};

export function getDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>("/api/v1/dashboard/summary");
}

// --- Approver ---

export type PendingRequest = {
  id: string;
  requester_id: string;
  environment: Environment;
  requested_role: string;
  duration_minutes: number;
  justification: string;
  status: RequestStatus;
  policy_decision: string | null;
  policy_reason: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
  requester_name: string;
  requester_email: string;
  requester_persona: string;
};

export type PendingRequestList = {
  items: PendingRequest[];
  total: number;
};

export function listPendingRequests(): Promise<PendingRequestList> {
  return apiFetch<PendingRequestList>("/api/v1/approver/pending");
}

export function approveRequest(
  id: string,
  reason = "",
): Promise<{ status: string; request_id: string }> {
  return apiFetch(`/api/v1/approver/requests/${id}/approve`, {
    method: "POST",
    body: { reason },
  });
}

export function denyRequest(
  id: string,
  reason = "",
): Promise<{ status: string; request_id: string }> {
  return apiFetch(`/api/v1/approver/requests/${id}/deny`, {
    method: "POST",
    body: { reason },
  });
}

// --- Credentials ---

export type IssueCredentialResponse = {
  lease_id: string;
  access_key_id: string;
  secret_access_key: string;
  session_token: string;
  issued_at: string;
  expires_at: string;
  duration_minutes: number;
  assumed_role_arn: string;
  assumed_role_name: string;
};

export function issueCredentials(
  requestId: string,
): Promise<IssueCredentialResponse> {
  return apiFetch<IssueCredentialResponse>(
    `/api/v1/access/requests/${requestId}/issue`,
    { method: "POST" },
  );
}

// --- Leases ---

export type LeaseStatus = "active" | "expired" | "revoked";

export type Lease = {
  id: string;
  request_id: string;
  user_id: string;
  access_key_id: string;
  assumed_role_arn: string | null;
  assumed_role_name: string | null;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  status: LeaseStatus;
};

export type LeaseList = {
  items: Lease[];
  total: number;
};

export function listLeases(): Promise<LeaseList> {
  return apiFetch<LeaseList>("/api/v1/leases");
}

export function getLease(id: string): Promise<Lease> {
  return apiFetch<Lease>(`/api/v1/leases/${id}`);
}

// --- Terminal ---

export type TerminalResponse = {
  exit_code: number;
  stdout: string;
  stderr: string;
};

export type TerminalRequest = {
  access_key_id: string;
  secret_access_key: string;
  session_token: string;
  command: string;
};

export function runTerminalCommand(
  payload: TerminalRequest,
): Promise<TerminalResponse> {
  return apiFetch<TerminalResponse>("/api/v1/terminal/run", {
    method: "POST",
    body: payload,
  });
}