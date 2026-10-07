"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
        <div className="text-right">
          <p className="text-xs font-medium">Not signed in</p>
          <p className="text-xs text-muted-foreground">
            Persona switcher coming soon
          </p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}