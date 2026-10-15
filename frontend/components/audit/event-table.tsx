"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AuditEvent } from "@/lib/api";
import { eventTypeLabel } from "@/lib/audit-types";

type Props = {
  items: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
  onSelect: (event: AuditEvent) => void;
  onPage: (nextOffset: number) => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function payloadSummary(event: AuditEvent): string {
  const payload = event.payload as Record<string, unknown>;
  if (typeof payload.decision === "string") return `decision: ${payload.decision}`;
  if (typeof payload.access_key_id === "string") return `key: ${payload.access_key_id}`;
  if (typeof payload.environment === "string") return `env: ${payload.environment}`;
  if (typeof payload.email === "string") return `email: ${payload.email}`;
  if (typeof payload.reason === "string") return payload.reason;
  return "";
}

export function EventTable({
  items,
  total,
  limit,
  offset,
  onSelect,
  onPage,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        No events match the current filters.
      </div>
    );
  }

  const page = Math.floor(offset / limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Timestamp</th>
              <th className="px-3 py-2 text-left font-medium">Event</th>
              <th className="px-3 py-2 text-left font-medium">Actor</th>
              <th className="px-3 py-2 text-left font-medium">Summary</th>
            </tr>
          </thead>
          <tbody>
            {items.map((event) => (
              <tr
                key={event.id}
                className="cursor-pointer border-t border-border hover:bg-secondary/40"
                onClick={() => onSelect(event)}
              >
                <td className="whitespace-nowrap px-3 py-2 text-xs text-muted-foreground">
                  {formatDate(event.created_at)}
                </td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="text-xs">
                    {eventTypeLabel(event.event_type)}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-xs">
                  {event.actor_name ?? "System"}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {payloadSummary(event)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {page} of {totalPages} · {total} total events
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={!hasPrev}
            onClick={() => onPage(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={!hasNext}
            onClick={() => onPage(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}