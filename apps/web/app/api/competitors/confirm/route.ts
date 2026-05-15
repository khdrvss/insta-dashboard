import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import { z } from "zod";

const schema = z.object({
  competitors: z
    .array(
      z.object({
        handle: z.string().min(1),
        displayName: z.string().optional(),
        relevanceScore: z.number().min(0).max(100),
        relevanceReason: z.string().optional(),
        followersEst: z.number().optional(),
        discoverySource: z
          .enum(["hashtag_search", "ad_library", "manual"])
          .default("hashtag_search"),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  // Mock mode: return success without DB
  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({
      confirmed: parsed.data.competitors.length,
      competitors: parsed.data.competitors.map((c) => ({
        ...c,
        id: c.handle,
        confirmed: true,
      })),
      mock: true,
    });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Upsert each confirmed competitor
  const results = await Promise.all(
    parsed.data.competitors.map((c) =>
      prisma.competitor.upsert({
        where: { userId_handle: { userId: user.id, handle: c.handle } },
        update: {
          confirmed: true,
          relevanceScore: c.relevanceScore,
          relevanceReason: c.relevanceReason,
          followersEst: c.followersEst,
          displayName: c.displayName,
        },
        create: {
          userId: user.id,
          handle: c.handle,
          displayName: c.displayName,
          relevanceScore: c.relevanceScore,
          relevanceReason: c.relevanceReason,
          followersEst: c.followersEst,
          discoverySource: c.discoverySource,
          confirmed: true,
        },
      }),
    ),
  );

  return NextResponse.json({ confirmed: results.length, competitors: results });
}
