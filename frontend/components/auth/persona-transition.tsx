"use client";

import { useEffect, useRef, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";

export function PersonaTransition() {
  const { user, ready } = useAuth();
  const [visible, setVisible] = useState<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready) return;

    if (user === null) {
      lastUserIdRef.current = null;
      return;
    }

    if (user.id === lastUserIdRef.current) return;
    lastUserIdRef.current = user.id;

    queueMicrotask(() => {
      setVisible(`${user.full_name} (${user.persona})`);
    });

    const timeout = setTimeout(() => setVisible(null), 1800);
    return () => clearTimeout(timeout);
  }, [user, ready]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-20 z-[9999] -translate-x-1/2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-lg"
      style={{ animation: "fadeInOut 1.8s ease-in-out" }}
    >
      <span className="text-muted-foreground">Signed in as </span>
      <span className="font-medium">{visible}</span>
    </div>
  );
}