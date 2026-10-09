"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { login as apiLogin, logout as apiLogout } from "@/lib/api";
import {
  type AuthUser,
  clearSession,
  getToken,
  getUser,
  saveSession,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  loginAs: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  // Rehydrate session AFTER hydration completes.
  // This effect runs only in the browser, so localStorage is available.
  useEffect(() => {
    if (getToken()) {
      const cached = getUser();
      if (cached) setUser(cached);
    }
    setReady(true);
  }, []);

  const loginAs = useCallback(async (email: string) => {
    const response = await apiLogin(email);
    saveSession({
      access_token: response.access_token,
      expires_in_minutes: response.expires_in_minutes,
      user: response.user as AuthUser,
    });
    setUser(response.user as AuthUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Ignore network errors on logout; the token is discarded regardless.
    }
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, loginAs, logout }),
    [user, ready, loginAs, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}