"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ElevationDay } from "@/lib/api";

function intensity(count: number, max: number): string {
  if (max === 0 || count === 0) return "rgba(46, 182, 125, 0.05)";
  const ratio = count / max;
  // Single color ramp from light to saturated.
  const alpha = 0.15 + ratio * 0.75;
  return `rgba(46, 182, 125, ${alpha.toFixed(2)})`;
}

function formatDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ElevationHeatmap({ days }: { days: ElevationDay[] }) {
  const max = Math.max(...days.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Elevations · last 7 days
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => (
            <div key={day.day} className="space-y-1 text-center">
              <div
                className="flex h-16 items-center justify-center rounded-md border border-border text-sm font-medium"
                style={{ backgroundColor: intensity(day.count, max) }}
                title={Object.entries(day.by_environment)
                  .map(([env, count]) => `${env}: ${count}`)
                  .join("\n")}
              >
                {day.count}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDay(day.day)}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Fewer</span>
          <div className="flex items-center gap-1">
            {[0.15, 0.3, 0.5, 0.7, 0.9].map((alpha) => (
              <span
                key={alpha}
                className="inline-block h-3 w-3 rounded-sm border border-border"
                style={{ backgroundColor: `rgba(46, 182, 125, ${alpha})` }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}