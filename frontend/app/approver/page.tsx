import { PendingQueue } from "@/components/approver/pending-queue";

export default function ApproverPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Approver queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Review pending access requests and approve or deny them.
        </p>
      </div>

      <PendingQueue />
    </div>
  );
}