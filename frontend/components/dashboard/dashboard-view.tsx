"use client";

import { useCallback, useEffect, useState } from "react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";

export function DashboardView() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDashboardSummary();
        if (!cancelled) {
          setSummary(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load summary",
          );
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    }
  }, []);

  if (loading && !summary) {
    return (
      <p className="text-sm text-muted-foreground">Loading dashboard...</p>
    );
  }

  if (error && !summary) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date(summary.generated_at).toLocaleTimeString()}
        </p>
        <Button size="sm" variant="secondary" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <SummaryCards summary={summary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBreakdown items={summary.requests_by_status} />
        <ActivityFeed events={summary.recent_events} />
      </div>
    </div>
  );
}