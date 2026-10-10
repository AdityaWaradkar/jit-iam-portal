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

export function RequestList({ items }: { items: AccessRequest[] }) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No requests yet. Submit one above to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Your requests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((request) => (
          <div
            key={request.id}
            className="rounded-md border border-border p-3"
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
              </div>
              <Badge variant={STATUS_VARIANT[request.status]}>
                {REQUEST_STATUS_LABEL[request.status] ?? request.status}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}