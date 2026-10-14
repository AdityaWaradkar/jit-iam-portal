"use client";

import { useEffect, useState } from "react";

import { Countdown } from "@/components/leases/countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listLeases, type Lease } from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function LeasesPage() {
  const [items, setItems] = useState<Lease[]>([]);
  const [selected, setSelected] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listLeases();
        if (!cancelled) {
          setItems(data.items);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load leases");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leases</h1>
        <p className="text-sm text-muted-foreground">
          Active ephemeral credentials and their remaining lifetimes.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading leases...</p>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No leases yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once you issue credentials for an approved request, they will
              appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            {items.map((lease) => (
              <button
                key={lease.id}
                type="button"
                onClick={() => setSelected(lease)}
                className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-secondary/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {lease.assumed_role_name ?? "Unknown role"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Key: {lease.access_key_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {formatDate(lease.issued_at)}
                    </p>
                  </div>
                  <Countdown
                    expiresAt={lease.expires_at}
                    status={lease.status}
                  />
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lease details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-muted-foreground">Lease ID</span>
                  <span className="break-all font-mono text-xs">
                    {selected.id}
                  </span>

                  <span className="text-muted-foreground">Request ID</span>
                  <span className="break-all font-mono text-xs">
                    {selected.request_id}
                  </span>

                  <span className="text-muted-foreground">Access Key ID</span>
                  <span className="font-mono text-xs">
                    {selected.access_key_id}
                  </span>

                  <span className="text-muted-foreground">Assumed role</span>
                  <span className="font-mono text-xs">
                    {selected.assumed_role_arn ?? "—"}
                  </span>

                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="secondary">{selected.status}</Badge>

                  <span className="text-muted-foreground">Issued at</span>
                  <span>{formatDate(selected.issued_at)}</span>

                  <span className="text-muted-foreground">Expires at</span>
                  <span>{formatDate(selected.expires_at)}</span>

                  {selected.revoked_at && (
                    <>
                      <span className="text-muted-foreground">Revoked at</span>
                      <span>{formatDate(selected.revoked_at)}</span>
                    </>
                  )}
                </div>

                <div className="border-t border-border pt-4">
                  <Countdown
                    expiresAt={selected.expires_at}
                    status={selected.status}
                  />
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelected(null)}
                >
                  Close
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}