import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({
      scriptCount: 0,
      scriptLimit: 5,
      totalTokens: 0,
      estimatedCostUsd: 0,
      byOperation: [],
    });
  }

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [usageGroups, scriptCount] = await Promise.all([
    prisma.aiUsageLog.groupBy({
      by: ["operation"],
      where: { userId: user.id, createdAt: { gte: start } },
      _sum: { inputTokens: true, outputTokens: true },
      _count: true,
    }),
    prisma.generatedScript.count({
      where: { userId: user.id, createdAt: { gte: start } },
    }),
  ]);

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const byOperation = usageGroups.map((g) => {
    const input = g._sum.inputTokens ?? 0;
    const output = g._sum.outputTokens ?? 0;
    totalInputTokens += input;
    totalOutputTokens += output;
    return {
      operation: g.operation,
      count: g._count,
      inputTokens: input,
      outputTokens: output,
      costUsd: input * 0.000000075 + output * 0.0000003,
    };
  });

  const totalTokens = totalInputTokens + totalOutputTokens;
  const estimatedCostUsd = totalInputTokens * 0.000000075 + totalOutputTokens * 0.0000003;

  return NextResponse.json({
    scriptCount,
    scriptLimit: 5,
    totalTokens,
    estimatedCostUsd,
    byOperation,
  });
}
