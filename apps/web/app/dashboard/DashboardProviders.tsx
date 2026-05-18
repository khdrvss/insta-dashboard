"use client";

import { ScriptsProvider } from "@/lib/scripts-context";

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return <ScriptsProvider>{children}</ScriptsProvider>;
}
