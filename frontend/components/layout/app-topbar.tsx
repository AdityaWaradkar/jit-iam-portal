"use client";

import { PersonaSwitcher } from "@/components/auth/persona-switcher";
import { ResetButton } from "@/components/demo/reset-button";
import { Badge } from "@/components/ui/badge";

export function AppTopbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="text-xs">
          Sandbox Mode
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        <ResetButton />
        <PersonaSwitcher />
      </div>
    </header>
  );
}