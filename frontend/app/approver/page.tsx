"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { PendingQueue } from "@/components/approver/pending-queue";
import { SlackChannel } from "@/components/slack/slack-channel";
import {
  ViewToggle,
  type ApproverView,
} from "@/components/slack/view-toggle";
import { listPendingRequests, type PendingRequest } from "@/lib/api";

export default function ApproverPage() {
  const { user } = useAuth();
  const [view, setView] = useState<ApproverView>("queue");
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listPendingRequests();
        if (!cancelled) {
          setRequests(data.items);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load queue",
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

  function handleDecided(id: string) {
    setRequests((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Approver queue
          </h1>
          <p className="text-sm text-muted-foreground">
            Review pending access requests and approve or deny them.
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      ) : view === "queue" ? (
        <PendingQueue />
      ) : (
        <SlackChannel
          requests={requests}
          approverName={user?.full_name ?? "an approver"}
          onDecided={handleDecided}
        />
      )}
    </div>
  );
}