"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DecisionLatency as DecisionLatencyType } from "@/lib/api";

function formatSeconds(value: number | null): string {
  if (value === null) return "—";
  if (value < 60) return `${Math.round(value)}s`;
  if (value < 3600) return `${Math.round(value / 60)}m`;
  return `${(value / 3600).toFixed(1)}h`;
}

export function DecisionLatency({
  latency,
}: {
  latency: DecisionLatencyType;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decision latency</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <span className="text-muted-foreground">Sample size</span>
          <span>{latency.sample_size}</span>

          <span className="text-muted-foreground">Average</span>
          <span>{formatSeconds(latency.average_seconds)}</span>

          <span className="text-muted-foreground">Median (p50)</span>
          <span>{formatSeconds(latency.p50_seconds)}</span>

          <span className="text-muted-foreground">p95</span>
          <span>{formatSeconds(latency.p95_seconds)}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Latency is measured from request submission to the moment the
          request left the pending state.
        </p>
      </CardContent>
    </Card>
  );
}