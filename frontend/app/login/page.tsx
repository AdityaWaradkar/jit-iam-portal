"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const personas = [
  {
    email: "alex@example.com",
    name: "Alex Rivera",
    role: "Senior Backend Engineer",
    description: "Request temporary access to cloud resources.",
    persona: "engineer" as const,
  },
  {
    email: "sarah@example.com",
    name: "Sarah Chen",
    role: "Security Lead",
    description: "Approve or deny just in time access requests.",
    persona: "approver" as const,
  },
  {
    email: "marcus@example.com",
    name: "Marcus Patel",
    role: "Compliance Auditor",
    description: "Review the immutable audit trail.",
    persona: "auditor" as const,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { loginAs } = useAuth();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(email: string) {
    setPending(email);
    setError(null);
    try {
      await loginAs(email);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose a persona
        </h1>
        <p className="text-sm text-muted-foreground">
          The sandbox demo provides three preconfigured accounts so you can
          experience each role. No password required.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {personas.map((persona) => (
          <Card key={persona.email}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{persona.name}</CardTitle>
                <Badge variant="secondary" className="text-xs capitalize">
                  {persona.persona}
                </Badge>
              </div>
              <CardDescription>{persona.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {persona.description}
              </p>
              <Button
                className="w-full"
                disabled={pending !== null}
                onClick={() => handleLogin(persona.email)}
              >
                {pending === persona.email ? "Signing in..." : "Sign in"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}