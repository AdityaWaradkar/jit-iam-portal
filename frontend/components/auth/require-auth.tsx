"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth/auth-provider";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useAuth();

  const isPublic = pathname === "/login";

  useEffect(() => {
    if (ready && !user && !isPublic) {
      router.replace("/login");
    }
  }, [ready, user, isPublic, router]);

  if (isPublic) return <>{children}</>;

  if (!ready) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}