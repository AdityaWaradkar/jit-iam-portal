"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatusBreakdown } from "@/components/dashboard/status-breakdown";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { DecisionLatency } from "@/components/security/decision-latency";
import { ElevationHeatmap } from "@/components/security/elevation-heatmap";
import { RecentCredentials } from "@/components/security/recent-credentials";
import { TopRequesters } from "@/components/security/top-requesters";
import { ZspCard } from "@/components/security/zsp-card";
import { Button } from "@/components/ui/button";
import {
  getDashboardSummary,
  getSecurityOverview,
  type DashboardSummary,
  type SecurityOverview,
} from "@/lib/api";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAuditor = user?.persona === "auditor";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {isAuditor
            ? "Security posture overview of the platform."
            : "Overview of your access requests, active leases, and recent activity."}
        </p>
      </div>

      {isAuditor ? <SecurityOverviewView /> : <PersonalDashboardView />}
    </div>
  );
}

function PersonalDashboardView() {
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

  async function handleRefresh() {
    try {
      const data = await getDashboardSummary();
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    }
  }

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

function SecurityOverviewView() {
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getSecurityOverview();
        if (!cancelled) {
          setOverview(data);
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load overview",
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

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        Loading security overview...
      </p>
    );
  }

  if (error && !overview) {
    return (
      <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        Last updated: {new Date(overview.generated_at).toLocaleTimeString()}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <ZspCard zsp={overview.zsp} />
        <DecisionLatency latency={overview.decision_latency} />
      </div>

      <ElevationHeatmap days={overview.elevations_last_seven_days} />

      <div className="grid gap-6 lg:grid-cols-2">
        <TopRequesters items={overview.top_requesters} />
        <RecentCredentials items={overview.recent_credentials} />
      </div>
    </div>
  );
}