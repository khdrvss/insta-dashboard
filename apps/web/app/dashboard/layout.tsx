export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { OAuthToast } from "@/components/dashboard/OAuthToast";
import { DashboardProviders } from "./DashboardProviders";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/mock-auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <DashboardProviders>
      <div className="flex h-screen bg-[#0d1117] overflow-hidden">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
        <Suspense fallback={null}>
          <OAuthToast />
        </Suspense>
        <MobileNav />
      </div>
    </DashboardProviders>
  );
}
