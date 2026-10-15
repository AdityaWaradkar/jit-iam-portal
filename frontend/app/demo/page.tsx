"use client";

import Link from "next/link";
import {
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import { useTour } from "@/components/tour/tour-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const QUICK_LINKS = [
  {
    href: "/",
    label: "Dashboard",
    description: "Personal activity or security overview, depending on persona.",
    icon: LayoutDashboard,
  },
  {
    href: "/requests",
    label: "Requests",
    description: "Submit an access request and track its lifecycle.",
    icon: KeyRound,
  },
  {
    href: "/approver",
    label: "Approver queue",
    description: "Review pending requests. Approver persona only.",
    icon: UserCheck,
  },
  {
    href: "/leases",
    label: "Leases",
    description: "Active credentials with live countdowns and a terminal.",
    icon: ShieldCheck,
  },
  {
    href: "/audit",
    label: "Audit",
    description: "Filterable audit trail with CSV export. Auditor persona only.",
    icon: ScrollText,
  },
  {
    href: "/demo",
    label: "Demo",
    description: "This page. Restart the tour or reset the data.",
    icon: FlaskConical,
  },
];

export default function DemoPage() {
  const { startTour } = useTour();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Demo</h1>
        <p className="text-sm text-muted-foreground">
          Guided walkthrough, quick links, and demo controls.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Guided tour</CardTitle>
          <CardDescription>
            A short walkthrough of the portal&apos;s core workflow, from
            access request to audit trail.
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
          <CardTitle className="text-base">Quick links</CardTitle>
          <CardDescription>
            The pages that best demonstrate what the portal does.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md border border-border p-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </Link>
              );
            })}
          </div>
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
                // Reload happens regardless.
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