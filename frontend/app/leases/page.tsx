"use client";

import { useEffect, useState } from "react";

import { Countdown } from "@/components/leases/countdown";
import { Terminal } from "@/components/leases/terminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listLeases, type IssueCredentialResponse, type Lease } from "@/lib/api";
import {
  getLatestCredential,
  subscribeLatestCredential,
} from "@/lib/credentials-store";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function LeasesPage() {
  const [items, setItems] = useState<Lease[]>([]);
  const [selected, setSelected] = useState<Lease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [storedCredential, setStoredCredential] =
    useState<IssueCredentialResponse | null>(() => getLatestCredential());
  const [terminalCredential, setTerminalCredential] =
    useState<IssueCredentialResponse | null>(null);

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

  useEffect(() => {
    const unsubscribe = subscribeLatestCredential(() => {
      setStoredCredential(getLatestCredential());
    });
    return unsubscribe;
  }, []);

  function handleUseInTerminal(lease: Lease) {
    if (!storedCredential) return;
    if (storedCredential.lease_id !== lease.id) return;
    setTerminalCredential(storedCredential);
  }

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
            {items.map((lease) => {
              const canTest =
                lease.status === "active" &&
                storedCredential !== null &&
                storedCredential.lease_id === lease.id;
              return (
                <div
                  key={lease.id}
                  className="rounded-md border border-border p-3"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(lease)}
                    className="w-full text-left"
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
                  {canTest && (
                    <div className="mt-3 border-t border-border pt-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUseInTerminal(lease)}
                      >
                        Use in terminal
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Terminal</CardTitle>
        </CardHeader>
        <CardContent>
          <Terminal credentials={terminalCredential} />
          {!terminalCredential && (
            <p className="mt-2 text-xs text-muted-foreground">
              Issue a credential from the Requests page, then click
              &quot;Use in terminal&quot; on a matching lease.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}