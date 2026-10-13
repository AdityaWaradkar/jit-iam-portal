"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AccessRequest } from "@/lib/api";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function RequestDetail({ request }: { request: AccessRequest }) {
  return (
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
      </CardContent>
    </Card>
  );
}