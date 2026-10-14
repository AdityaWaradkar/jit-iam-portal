"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { IssueCredentialResponse } from "@/lib/api";

type Props = {
  credential: IssueCredentialResponse | null;
  onClose: () => void;
};

function formatRemaining(seconds: number): string {
  if (seconds <= 0) return "expired";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function envBlock(credential: IssueCredentialResponse): string {
  return [
    `export AWS_ACCESS_KEY_ID="${credential.access_key_id}"`,
    `export AWS_SECRET_ACCESS_KEY="${credential.secret_access_key}"`,
    `export AWS_SESSION_TOKEN="${credential.session_token}"`,
  ].join("\n");
}

export function CredentialModal({ credential, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!credential) return;

    const update = () => {
      const now = Date.now();
      const expiry = new Date(credential.expires_at).getTime();
      setRemaining(Math.max(0, Math.floor((expiry - now) / 1000)));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [credential]);

  if (!credential) return null;

  const isExpired = remaining <= 0;

  async function copyEnv() {
    if (!credential) return;
    await navigator.clipboard.writeText(envBlock(credential));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={credential !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ephemeral credentials issued</DialogTitle>
          <DialogDescription>
            These credentials are shown only once. Copy them now. They
            expire automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Expires in</span>
            <Badge variant={isExpired ? "destructive" : "secondary"}>
              {formatRemaining(remaining)}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-muted-foreground">Assumed role</span>
            <code className="rounded bg-secondary px-2 py-0.5 text-xs">
              {credential.assumed_role_arn}
            </code>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Access Key ID</label>
            <Input readOnly value={credential.access_key_id} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Secret Access Key</label>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setRevealed((r) => !r)}
              >
                {revealed ? "Hide" : "Reveal"}
              </Button>
            </div>
            <Input
              readOnly
              value={
                revealed ? credential.secret_access_key : "•".repeat(40)
              }
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Session Token</label>
            <Input
              readOnly
              value={
                revealed
                  ? credential.session_token
                  : "•".repeat(40)
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={copyEnv}>
              {copied ? "Copied" : "Copy as environment variables"}
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            These credentials cannot be retrieved again. The portal stores
            only hashes of the secret and token.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}