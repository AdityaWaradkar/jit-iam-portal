"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  approveRequest,
  denyRequest,
  listPendingRequests,
  type PendingRequest,
} from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function PendingQueue() {
  const [items, setItems] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listPendingRequests();
        if (!cancelled) {
          setItems(data.items);
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

  async function handleAction(id: string, action: "approve" | "deny") {
    setBusyId(id);
    setError(null);
    const reason = reasons[id] ?? "";

    const previous = items;
    setItems((prev) => prev.filter((item) => item.id !== id));

    try {
      if (action === "approve") {
        await approveRequest(id, reason);
      } else {
        await denyRequest(id, reason);
      }
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">Loading queue...</p>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pending queue</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No pending requests. The queue is empty.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {items.length} pending {items.length === 1 ? "request" : "requests"}
      </p>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {items.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-base">
                  {item.requester_name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {item.requester_email} · {item.requester_persona}
                </p>
              </div>
              <Badge variant="secondary">{item.environment}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Role</span>
              <span>{item.requested_role}</span>

              <span className="text-muted-foreground">Duration</span>
              <span>{item.duration_minutes} minutes</span>

              <span className="text-muted-foreground">Submitted</span>
              <span>{formatDate(item.created_at)}</span>
            </div>

            <div className="rounded border border-border bg-secondary/40 p-2 text-sm">
              <span className="font-medium">Justification:</span>{" "}
              {item.justification}
            </div>

            {item.policy_reason && (
              <div className="rounded border border-border bg-secondary/40 p-2 text-xs text-muted-foreground">
                <span className="font-medium">Policy:</span>{" "}
                {item.policy_reason}
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Optional decision reason"
                value={reasons[item.id] ?? ""}
                onChange={(e) =>
                  setReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                }
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={busyId === item.id}
                  onClick={() => handleAction(item.id, "approve")}
                >
                  {busyId === item.id ? "Working..." : "Approve"}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busyId === item.id}
                  onClick={() => handleAction(item.id, "deny")}
                >
                  Deny
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}