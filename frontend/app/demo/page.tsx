"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTour } from "@/components/tour/tour-provider";

export default function DemoPage() {
  const { startTour } = useTour();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Demo</h1>
        <p className="text-sm text-muted-foreground">
          Guided walkthrough and persona switcher.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guided tour</CardTitle>
          <CardDescription>
            A short walkthrough of the portal&apos;s core workflow, from access
            request to audit trail.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={startTour}>Start the guided tour</Button>
          <p className="text-xs text-muted-foreground">
            The tour auto-starts on your first visit to the dashboard. Use
            this button to run it again at any time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reset demo data</CardTitle>
          <CardDescription>
            Restore the demo to a fresh state with the seeded personas,
            requests, and leases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="secondary"
            onClick={async () => {
              try {
                await fetch(
                  `${
                    process.env.NEXT_PUBLIC_API_BASE_URL ??
                    "http://localhost:8000"
                  }/api/v1/demo/reset`,
                  { method: "POST" },
                );
                window.location.reload();
              } catch {
                // Ignore errors. The page will refresh regardless.
              }
            }}
          >
            Reset demo data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}