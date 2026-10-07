"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealth, type HealthResponse } from "@/lib/api";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export function BackendStatus() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getHealth();
        if (!cancelled) setStatus({ kind: "ok", data });
      } catch (error) {
        if (!cancelled) {
          setStatus({
            kind: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Backend status</CardTitle>
        {status.kind === "ok" ? (
          <Badge className="bg-success text-success-foreground">
            {status.data.status}
          </Badge>
        ) : status.kind === "error" ? (
          <Badge variant="destructive">unreachable</Badge>
        ) : (
          <Badge variant="secondary">checking</Badge>
        )}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {status.kind === "loading" && <p>Contacting API...</p>}
        {status.kind === "ok" && (
          <dl className="grid grid-cols-2 gap-2">
            <dt>Service</dt>
            <dd className="text-foreground">{status.data.service}</dd>
            <dt>Environment</dt>
            <dd className="text-foreground">{status.data.environment}</dd>
            <dt>Last check</dt>
            <dd className="text-foreground">{status.data.timestamp}</dd>
          </dl>
        )}
        {status.kind === "error" && <p>{status.message}</p>}
      </CardContent>
    </Card>
  );
}