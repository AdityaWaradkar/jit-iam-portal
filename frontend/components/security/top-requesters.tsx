"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TopRequester } from "@/lib/api";

export function TopRequesters({ items }: { items: TopRequester[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top requesters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No requests yet.</p>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.actor_id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  #{idx + 1}
                </span>
                <span>{item.actor_name}</span>
              </div>
              <span className="font-medium">{item.request_count}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}