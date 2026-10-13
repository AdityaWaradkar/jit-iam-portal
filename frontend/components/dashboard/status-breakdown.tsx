"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardStatusCount } from "@/lib/api";
import { REQUEST_STATUS_LABEL } from "@/lib/constants";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  auto_approved: "default",
  approved: "default",
  denied: "destructive",
  expired: "outline",
  revoked: "outline",
};

export function StatusBreakdown({ items }: { items: DashboardStatusCount[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Requests by status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div
            key={item.status}
            className="flex items-center justify-between"
          >
            <Badge variant={STATUS_VARIANT[item.status] ?? "secondary"}>
              {REQUEST_STATUS_LABEL[item.status] ?? item.status}
            </Badge>
            <span className="text-sm font-medium">{item.count}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}