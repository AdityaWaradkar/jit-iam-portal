"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RecentCredential } from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function RecentCredentials({
  items,
}: {
  items: RecentCredential[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent credentials</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No credentials issued yet.
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.lease_id}
              className="rounded border border-border p-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">
                  {item.assumed_role_name ?? "Unknown role"}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {item.user_name}
                </Badge>
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {item.access_key_id}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Issued: {formatDate(item.issued_at)}</span>
                <span>Expires: {formatDate(item.expires_at)}</span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}