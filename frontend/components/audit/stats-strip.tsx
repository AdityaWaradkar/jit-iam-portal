"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AuditStats } from "@/lib/api";
import { eventTypeLabel } from "@/lib/audit-types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function StatsStrip({ stats }: { stats: AuditStats }) {
  const topTypes = stats.by_type.slice(0, 6);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{stats.total_events}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Log range
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs">
          <p>
            <span className="text-muted-foreground">First:</span>{" "}
            {formatDate(stats.first_event_at)}
          </p>
          <p>
            <span className="text-muted-foreground">Last:</span>{" "}
            {formatDate(stats.last_event_at)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Top event types
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {topTypes.map((item) => (
            <div
              key={item.event_type}
              className="flex items-center justify-between text-xs"
            >
              <Badge variant="secondary" className="text-xs">
                {eventTypeLabel(item.event_type)}
              </Badge>
              <span className="font-medium">{item.count}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}