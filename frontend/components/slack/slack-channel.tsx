"use client";

import { SlackApprovalCard } from "@/components/slack/slack-approval-card";
import type { PendingRequest } from "@/lib/api";

type Props = {
  requests: PendingRequest[];
  approverName: string;
  onDecided: (id: string) => void;
};

export function SlackChannel({ requests, approverName, onDecided }: Props) {
  return (
    <div
      style={{
        backgroundColor: "#1a1d21",
        color: "#e6e6e6",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid #383c42",
        fontFamily:
          'Slack-Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #383c42",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}># jit-approvals</div>
          <div style={{ fontSize: 12, color: "#868686" }}>
            Sandbox Workspace · 3 members
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            color: "#2EB67D",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: "#2EB67D",
            }}
          />
          Connected
        </div>
      </div>

      <div style={{ padding: "8px 16px" }}>
        {requests.length === 0 ? (
          <div
            style={{
              padding: "24px 0",
              textAlign: "center",
              color: "#868686",
              fontSize: 13,
            }}
          >
            No pending requests. When someone submits a request that needs
            approval, it will appear here.
          </div>
        ) : (
          requests.map((request) => (
            <SlackApprovalCard
              key={request.id}
              request={request}
              approverName={approverName}
              onDecided={onDecided}
            />
          ))
        )}
      </div>
    </div>
  );
}