"use client";

const TOKEN_KEY = "jit-iam-portal-token";
const USER_KEY = "jit-iam-portal-user";

export type PersonaRole = "engineer" | "approver" | "auditor";

export type AuthUser = {
  id: string;
  email: string;
  full_name: string;
  persona: PersonaRole;
};

export type AuthSession = {
  access_token: string;
  expires_in_minutes: number;
  user: AuthUser;
};

export function saveSession(session: AuthSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, session.access_token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}