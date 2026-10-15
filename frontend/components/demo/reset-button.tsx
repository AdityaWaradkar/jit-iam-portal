"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { clearLatestCredential } from "@/lib/credentials-store";

export function ResetButton() {
  const [busy, setBusy] = useState(false);

  async function handleReset() {
    setBusy(true);
    try {
      await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
        }/api/v1/demo/reset`,
        { method: "POST" },
      );
      clearLatestCredential();
      window.location.reload();
    } catch {
      // Ignore. The reload will happen regardless of the fetch result.
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={handleReset}
      disabled={busy}
      title="Reset the demo to its initial state"
    >
      <RotateCcw className="mr-1 h-3 w-3" />
      {busy ? "Resetting..." : "Reset"}
    </Button>
  );
}