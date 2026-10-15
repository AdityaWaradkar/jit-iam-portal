import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { PersonaTransition } from "@/components/auth/persona-transition";
import { AppShell } from "@/components/layout/app-shell";
import { TourProvider } from "@/components/tour/tour-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "JIT IAM Portal",
  description: "Zero Trust Ephemeral Access and Just In Time Cloud IAM Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <TourProvider>
            <AppShell>{children}</AppShell>
            <PersonaTransition />
          </TourProvider>
        </AuthProvider>
      </body>
    </html>
  );
}