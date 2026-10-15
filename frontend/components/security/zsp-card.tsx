"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ZeroStandingPrivilegesStatus } from "@/lib/api";

export function ZspCard({ zsp }: { zsp: ZeroStandingPrivilegesStatus }) {
  const green = zsp.zero_standing;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">
          Zero Standing Privileges
        </CardTitle>
        <Badge
          className={
            green
              ? "bg-success text-success-foreground"
              : "bg-warning text-warning-foreground"
          }
        >
          {green ? "Compliant" : "Elevations active"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-semibold">{zsp.active_leases}</p>
        <p className="text-xs text-muted-foreground">
          Active ephemeral credentials
        </p>
        <p className="text-sm text-muted-foreground">{zsp.message}</p>
      </CardContent>
    </Card>
  );
}