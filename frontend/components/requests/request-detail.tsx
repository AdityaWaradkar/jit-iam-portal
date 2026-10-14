"use client";

import { useState } from "react";

import { CredentialModal } from "@/components/credentials/credential-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  issueCredentials,
  type AccessRequest,
  type IssueCredentialResponse,
} from "@/lib/api";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function RequestDetail({ request }: { request: AccessRequest }) {
  const [credential, setCredential] =
    useState<IssueCredentialResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canIssue =
    request.status === "approved" || request.status === "auto_approved";

  async function handleIssue() {
    setBusy(true);
    setError(null);
    try {
      const data = await issueCredentials(request.id);
      setCredential(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Issuance failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Environment</span>
            <span>{request.environment}</span>

            <span className="text-muted-foreground">Role</span>
            <span>{request.requested_role}</span>

            <span className="text-muted-foreground">Duration</span>
            <span>{request.duration_minutes} minutes</span>

            <span className="text-muted-foreground">Status</span>
            <Badge variant="secondary">
              {REQUEST_STATUS_LABEL[request.status] ?? request.status}
            </Badge>

            <span className="text-muted-foreground">Decision</span>
            <span>{request.policy_decision ?? "pending"}</span>

            <span className="text-muted-foreground">Submitted</span>
            <span>{formatDate(request.created_at)}</span>

            {request.decided_at && (
              <>
                <span className="text-muted-foreground">Decided</span>
                <span>{formatDate(request.decided_at)}</span>
              </>
            )}
          </div>

          {request.policy_reason && (
            <div className="rounded border border-border bg-secondary/50 p-2 text-xs">
              <span className="font-medium">Policy reason:</span>{" "}
              {request.policy_reason}
            </div>
          )}

          {canIssue && (
            <div className="space-y-2 border-t border-border pt-4">
              <Button
                size="sm"
                disabled={busy}
                onClick={handleIssue}
              >
                {busy ? "Issuing..." : "Issue credentials"}
              </Button>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CredentialModal
        credential={credential}
        onClose={() => setCredential(null)}
      />
    </>
  );
}