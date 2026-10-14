"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";

type Props = {
  expiresAt: string;
  status: string;
};

function format(seconds: number): string {
  if (seconds <= 0) return "expired";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, "0")}m`;
  }
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function Countdown({ expiresAt, status }: Props) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (status !== "active") return;

    const interval = setInterval(() => {
      const next = Math.max(
        0,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemaining(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  if (status === "revoked") {
    return <Badge variant="destructive">Revoked</Badge>;
  }

  if (status === "expired" || remaining <= 0) {
    return <Badge variant="outline">Expired</Badge>;
  }

  const isUrgent = remaining <= 300;
  const variant = isUrgent ? "destructive" : "secondary";

  return <Badge variant={variant}>{format(remaining)}</Badge>;
}