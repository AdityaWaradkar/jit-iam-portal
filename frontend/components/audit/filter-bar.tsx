"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUDIT_EVENT_TYPES } from "@/lib/audit-types";
import type { AuditFilters } from "@/lib/api";

type Props = {
  filters: AuditFilters;
  onChange: (next: AuditFilters) => void;
};

export function FilterBar({ filters, onChange }: Props) {
  function set<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) {
    onChange({ ...filters, [key]: value, offset: 0 });
  }

  function clearAll() {
    onChange({ limit: filters.limit ?? 50, offset: 0 });
  }

  const hasAny =
    Boolean(filters.event_type) ||
    Boolean(filters.actor_id) ||
    Boolean(filters.request_id) ||
    Boolean(filters.lease_id) ||
    Boolean(filters.since) ||
    Boolean(filters.until);

  return (
    <div className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-3 lg:grid-cols-6">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Event type</label>
        <Select
          value={filters.event_type ?? "__all__"}
          onValueChange={(value) => {
            if (value === null) return;
            set("event_type", value === "__all__" ? undefined : value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All types</SelectItem>
            {AUDIT_EVENT_TYPES.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Actor ID</label>
        <Input
          value={filters.actor_id ?? ""}
          onChange={(e) => set("actor_id", e.target.value || undefined)}
          placeholder="User UUID"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Request ID</label>
        <Input
          value={filters.request_id ?? ""}
          onChange={(e) => set("request_id", e.target.value || undefined)}
          placeholder="Request UUID"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Lease ID</label>
        <Input
          value={filters.lease_id ?? ""}
          onChange={(e) => set("lease_id", e.target.value || undefined)}
          placeholder="Lease UUID"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Since</label>
        <Input
          type="datetime-local"
          value={filters.since ?? ""}
          onChange={(e) =>
            set("since", e.target.value ? new Date(e.target.value).toISOString() : undefined)
          }
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Until</label>
        <Input
          type="datetime-local"
          value={filters.until ?? ""}
          onChange={(e) =>
            set("until", e.target.value ? new Date(e.target.value).toISOString() : undefined)
          }
        />
      </div>

      <div className="col-span-full flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {hasAny ? "Filters applied." : "No filters applied."}
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={clearAll}
          disabled={!hasAny}
        >
          Clear filters
        </Button>
      </div>
    </div>
  );
}