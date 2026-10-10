"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createAccessRequest,
  type AccessRequest,
  type Environment,
} from "@/lib/api";
import { ALLOWED_ROLES, ENVIRONMENTS } from "@/lib/constants";

const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "4 hours" },
];

export function RequestForm({
  onCreated,
}: {
  onCreated: (request: AccessRequest) => void;
}) {
  const [environment, setEnvironment] = useState<Environment>("staging");
  const [role, setRole] = useState<string>(ALLOWED_ROLES.staging[0]);
  const [duration, setDuration] = useState<number>(30);
  const [justification, setJustification] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleEnvironmentChange(next: Environment) {
    setEnvironment(next);
    setRole(ALLOWED_ROLES[next][0]);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const request = await createAccessRequest({
        environment,
        requested_role: role,
        duration_minutes: duration,
        justification,
      });
      setSuccess(`Request ${request.id.slice(0, 8)} submitted.`);
      setJustification("");
      onCreated(request);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setPending(false);
    }
  }

  const availableRoles = ALLOWED_ROLES[environment];

  return (
    <Card>
      <CardHeader>
        <CardTitle>New access request</CardTitle>
        <CardDescription>
          Request temporary elevated permissions. Requests are valid only for
          the duration you specify.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="environment">Environment</Label>
              <select
                id="environment"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={environment}
                onChange={(e) =>
                  handleEnvironmentChange(e.target.value as Environment)
                }
              >
                {ENVIRONMENTS.map((env) => (
                  <option key={env.value} value={env.value}>
                    {env.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {availableRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <select
              id="duration"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              {DURATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="justification">Justification</Label>
            <Input
              id="justification"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="Ticket reference and reason for access"
              minLength={10}
              maxLength={2000}
              required
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md border border-success bg-success/10 p-3 text-sm text-success">
              {success}
            </div>
          )}

          <Button type="submit" disabled={pending}>
            {pending ? "Submitting..." : "Submit request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}