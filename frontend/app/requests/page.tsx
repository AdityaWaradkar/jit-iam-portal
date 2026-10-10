"use client";

import { useEffect, useState } from "react";

import { RequestForm } from "@/components/requests/request-form";
import { RequestList } from "@/components/requests/request-list";
import { listAccessRequests, type AccessRequest } from "@/lib/api";

export default function RequestsPage() {
  const [items, setItems] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await listAccessRequests();
        if (!cancelled) {
          setItems(data.items);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load requests",
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

  function handleCreated(request: AccessRequest) {
    setItems((prev) => [request, ...prev]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
        <p className="text-sm text-muted-foreground">
          Submit and track just in time access requests.
        </p>
      </div>

      <RequestForm onCreated={handleCreated} />

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading requests...</p>
      ) : (
        <RequestList items={items} />
      )}
    </div>
  );
}