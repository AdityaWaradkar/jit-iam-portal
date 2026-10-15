"use client";

import { useState } from "react";

import { SlackAvatar } from "@/components/slack/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveRequest,
  denyRequest,
  type PendingRequest,
} from "@/lib/api";

type Decision = "approved" | "denied";

type Props = {
  request: PendingRequest;
  approverName: string;
  onDecided: (id: string) => void;
};

function formatTime(iso: string): string {
  const date = new Date(iso);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function roleBadgeColor(persona: string): string {
  switch (persona) {
    case "engineer":
      return "#2EB67D";
    case "approver":
      return "#E01E5A";
    case "auditor":
      return "#ECB22E";
    default:
      return "#6B7280";
  }
}

export function SlackApprovalCard({
  request,
  approverName,
  onDecided,
}: Props) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setBusy(true);
    setError(null);
    try {
      await approveRequest(request.id, reason);
      // Simulate the delay Slack takes to update the message.
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDecision("approved");
      onDecided(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeny() {
    setBusy(true);
    setError(null);
    try {
      await denyRequest(request.id, reason);
      await new Promise((resolve) => setTimeout(resolve, 900));
      setDecision("denied");
      onDecided(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        padding: "8px 0",
        borderBottom: "1px solid #1f2226",
      }}
    >
      <SlackAvatar name={request.requester_name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontWeight: 700,
              color: "#e6e6e6",
              fontSize: 15,
            }}
          >
            {request.requester_name}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "#fff",
              backgroundColor: roleBadgeColor(request.requester_persona),
              padding: "1px 6px",
              borderRadius: 3,
              textTransform: "uppercase",
            }}
          >
            {request.requester_persona}
          </span>
          <span style={{ fontSize: 12, color: "#868686" }}>
            {formatTime(request.created_at)}
          </span>
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 14,
            color: "#e6e6e6",
            lineHeight: 1.4,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            JIT access request
          </div>
          <div style={{ color: "#b9bbbe" }}>
            <div>
              <strong>Environment:</strong> {request.environment}
            </div>
            <div>
              <strong>Role:</strong> {request.requested_role}
            </div>
            <div>
              <strong>Duration:</strong> {request.duration_minutes} minutes
            </div>
          </div>
          <div style={{ marginTop: 8, color: "#e6e6e6" }}>
            {request.justification}
          </div>
          {request.policy_reason && (
            <div
              style={{
                marginTop: 8,
                color: "#868686",
                fontSize: 12,
                fontStyle: "italic",
              }}
            >
              Policy: {request.policy_reason}
            </div>
          )}
        </div>

        {decision ? (
          <div
            style={{
              marginTop: 12,
              padding: "8px 12px",
              backgroundColor:
                decision === "approved" ? "#1f3d2f" : "#3d1f1f",
              borderLeft:
                decision === "approved"
                  ? "3px solid #2EB67D"
                  : "3px solid #E01E5A",
              borderRadius: 4,
              color: "#e6e6e6",
              fontSize: 13,
            }}
          >
            {decision === "approved" ? (
              <>
                <strong>Approved</strong> by {approverName}
              </>
            ) : (
              <>
                <strong>Denied</strong> by {approverName}
              </>
            )}
            {reason && (
              <div style={{ marginTop: 4, color: "#b9bbbe" }}>
                {reason}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: 12 }}>
            <Input
              placeholder="Optional decision note"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={busy}
              style={{
                backgroundColor: "#1a1d21",
                borderColor: "#383c42",
                color: "#e6e6e6",
                marginBottom: 8,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                size="sm"
                disabled={busy}
                onClick={handleApprove}
                style={{
                  backgroundColor: "#2EB67D",
                  color: "#fff",
                }}
              >
                {busy ? "Working..." : "Approve"}
              </Button>
              <Button
                size="sm"
                disabled={busy}
                variant="outline"
                onClick={handleDeny}
                style={{
                  borderColor: "#E01E5A",
                  color: "#E01E5A",
                  backgroundColor: "transparent",
                }}
              >
                Deny
              </Button>
            </div>
            {error && (
              <div
                style={{
                  marginTop: 8,
                  color: "#E01E5A",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}