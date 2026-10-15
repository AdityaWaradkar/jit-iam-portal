"use client";

import { Button } from "@/components/ui/button";
import type { AuditEvent } from "@/lib/api";
import { eventTypeLabel } from "@/lib/audit-types";

type Props = {
  event: AuditEvent | null;
  onClose: () => void;
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function EventDrawer({ event, onClose }: Props) {
  if (!event) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <p className="text-xs text-muted-foreground">Audit event</p>
          <p className="text-sm font-medium">
            {eventTypeLabel(event.event_type)}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <span className="text-muted-foreground">ID</span>
          <span className="col-span-2 break-all font-mono">{event.id}</span>

          <span className="text-muted-foreground">Timestamp</span>
          <span className="col-span-2">{formatDate(event.created_at)}</span>

          <span className="text-muted-foreground">Actor</span>
          <span className="col-span-2">
            {event.actor_name ?? "System"}
            {event.actor_id && (
              <span className="ml-2 break-all font-mono text-xs text-muted-foreground">
                {event.actor_id}
              </span>
            )}
          </span>

          <span className="text-muted-foreground">Request</span>
          <span className="col-span-2 break-all font-mono text-xs">
            {event.request_id ?? "—"}
          </span>

          <span className="text-muted-foreground">Lease</span>
          <span className="col-span-2 break-all font-mono text-xs">
            {event.lease_id ?? "—"}
          </span>
        </div>

        <div>
          <p className="mb-2 text-xs text-muted-foreground">Payload</p>
          <pre className="overflow-x-auto rounded border border-border bg-secondary/40 p-3 text-xs">
{JSON.stringify(event.payload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}