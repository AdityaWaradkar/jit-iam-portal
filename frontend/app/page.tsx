import { BackendStatus } from "@/components/dashboard/backend-status";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of active leases, pending approvals, and recent activity.
        </p>
      </div>

      <BackendStatus />
    </div>
  );
}