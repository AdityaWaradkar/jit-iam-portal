"use client";

import { useEffect, useState } from "react";

import { EventDrawer } from "@/components/audit/event-drawer";
import { EventTable } from "@/components/audit/event-table";
import { FilterBar } from "@/components/audit/filter-bar";
import { StatsStrip } from "@/components/audit/stats-strip";
import { Button } from "@/components/ui/button";
import {
  getAuditStats,
  listAuditEvents,
  type AuditEvent,
  type AuditFilters,
  type AuditStats,
} from "@/lib/api";
import { eventsToCsv, downloadCsv } from "@/lib/csv";

const DEFAULT_LIMIT = 50;

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({
    limit: DEFAULT_LIMIT,
    offset: 0,
  });
  const [items, setItems] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [selected, setSelected] = useState<AuditEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const [listResult, statsResult] = await Promise.all([
          listAuditEvents(filters),
          getAuditStats(),
        ]);
        if (cancelled) return;
        setItems(listResult.items);
        setTotal(listResult.total);
        setStats(statsResult);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load events");
        setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  async function handleExportCsv() {
    setExporting(true);
    setError(null);
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
        }/api/v1/audit/export`,
        {
          headers: {
            Authorization: `Bearer ${
              typeof window !== "undefined"
                ? window.localStorage.getItem("jit-iam-portal-token") ?? ""
                : ""
            }`,
          },
        },
      );
      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }
      const text = await response.text();
      const events = text
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => JSON.parse(line) as AuditEvent);
      const csv = eventsToCsv(events);
      const filename = `audit-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      downloadCsv(filename, csv);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit</h1>
          <p className="text-sm text-muted-foreground">
            Immutable log of every access decision and credential issuance.
          </p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {stats && <StatsStrip stats={stats} />}

      <FilterBar filters={filters} onChange={setFilters} />

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading events...</p>
      ) : (
        <EventTable
          items={items}
          total={total}
          limit={filters.limit ?? DEFAULT_LIMIT}
          offset={filters.offset ?? 0}
          onSelect={setSelected}
          onPage={(nextOffset) =>
            setFilters((prev) => ({ ...prev, offset: nextOffset }))
          }
        />
      )}

      <EventDrawer event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}