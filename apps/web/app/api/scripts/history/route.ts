import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ history: [] });

  const records = await prisma.generatedScript.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const history = records.map((rec) => {
    let scripts: any[] = [];
    try {
      const parsed = JSON.parse(rec.scriptJson ?? "{}");
      scripts = parsed.scripts ?? [];
    } catch { /* silent */ }

    return {
      id: rec.id,
      goal: rec.goal,
      platform: rec.platform,
      lengthSecs: rec.lengthSecs,
      tone: rec.tone,
      scripts,
      createdAt: rec.createdAt,
    };
  });

  return NextResponse.json({ history });
}
