import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@instagram-dashboard/db";
import { CompetitorsClient } from "./CompetitorsClient";

export const metadata = { title: "Competitors" };

async function getConfirmedCompetitors(clerkId: string) {
  if (process.env.USE_MOCK_DATA === "true") {
    // Return a mix of confirmed + unconfirmed to show the UI properly
    return [];
  }

  const user = await prisma.user.findUnique({ where: { clerkId } });
  if (!user) return [];

  return prisma.competitor.findMany({
    where: { userId: user.id, confirmed: true },
    orderBy: { relevanceScore: "desc" },
    include: { _count: { select: { posts: true } } },
  });
}

export default async function CompetitorsPage() {
  const user = await currentUser();
  const confirmed = await getConfirmedCompetitors(user!.id);

  return <CompetitorsClient initialConfirmed={confirmed} />;
}
