"use client";

import { Button } from "@/components/ui/button";

export type ApproverView = "queue" | "slack";

type Props = {
  view: ApproverView;
  onChange: (view: ApproverView) => void;
};

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant={view === "queue" ? "secondary" : "ghost"}
        onClick={() => onChange("queue")}
      >
        Queue view
      </Button>
      <Button
        size="sm"
        variant={view === "slack" ? "secondary" : "ghost"}
        onClick={() => onChange("slack")}
      >
        Slack view
      </Button>
    </div>
  );
}