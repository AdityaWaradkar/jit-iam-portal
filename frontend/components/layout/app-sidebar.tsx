"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FlaskConical,
  KeyRound,
  LayoutDashboard,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/requests", label: "Requests", icon: KeyRound },
  { href: "/leases", label: "Leases", icon: ShieldCheck },
  { href: "/audit", label: "Audit", icon: ScrollText },
  { href: "/demo", label: "Demo", icon: FlaskConical },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-card">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold tracking-tight">
            JIT IAM Portal
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <p className="text-xs text-muted-foreground">Zero Standing Privileges</p>
      </div>
    </aside>
  );
}