import { prisma } from "@instagram-dashboard/db";
import { CompetitorsClient } from "./CompetitorsClient";
import { getCurrentUser } from "@/lib/mock-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Competitors" };

async function getConfirmedCompetitors(clerkId: string) {
  if (process.env.USE_MOCK_DATA === "true") {
    // Return a mix of confirmed + unconfirmed to show the UI properly
    return [];
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return [];

  const rows = await prisma.competitor.findMany({
    where: { userId: user.id, confirmed: true },
    orderBy: { relevanceScore: "desc" },
    include: { _count: { select: { posts: true } } },
  });
  // Serialize Date objects for client component props
  return rows.map((r) => ({
    ...r,
    lastAnalyzedAt: r.lastAnalyzedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export default async function CompetitorsPage() {
  const user = await getCurrentUser();
  const confirmed = await getConfirmedCompetitors(user!.id);

  return <CompetitorsClient initialConfirmed={confirmed} />;
}
