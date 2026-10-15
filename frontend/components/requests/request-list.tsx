"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccessRequest, RequestStatus } from "@/lib/api";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";
import { KeyRound } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

const STATUS_VARIANT: Record<
  RequestStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  auto_approved: "default",
  approved: "default",
  denied: "destructive",
  expired: "outline",
  revoked: "outline",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function RequestList({
  items,
  onSelect,
}: {
  items: AccessRequest[];
  onSelect?: (request: AccessRequest) => void;
}) {
  if (items.length === 0) {
    return (
      <Card data-tour="request-list">
        <CardHeader>
          <CardTitle className="text-base">Your requests</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={KeyRound}
            title="No requests yet"
            description="Submit a request above to see it appear here with a policy decision and status."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-tour="request-list">
      <CardHeader>
        <CardTitle className="text-base">Your requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((request) => (
          <button
            key={request.id}
            type="button"
            onClick={() => onSelect?.(request)}
            className="w-full rounded-md border border-border p-3 text-left transition-colors hover:bg-secondary/50"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {request.requested_role}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {request.environment}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Duration: {request.duration_minutes} minutes
                </p>
                <p className="text-xs text-muted-foreground">
                  Submitted: {formatDate(request.created_at)}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {request.justification}
                </p>
                {request.policy_reason && (
                  <p className="mt-2 rounded border border-border bg-secondary/50 p-2 text-xs text-muted-foreground">
                    <span className="font-medium">Policy:</span>{" "}
                    {request.policy_reason}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[request.status]}>
                {REQUEST_STATUS_LABEL[request.status] ?? request.status}
              </Badge>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}