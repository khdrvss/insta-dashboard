import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ job_id: "mock-job-001", status: "done", progress: 100, mock: true });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { competitors: { where: { confirmed: true } } },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (!user.competitors.length) {
    return NextResponse.json({ error: "No confirmed competitors to analyze" }, { status: 400 });
  }

  // Create analysis job
  const job = await prisma.analysisJob.create({
    data: {
      userId: user.id,
      type: "content_analysis",
      status: "pending",
      metadata: JSON.stringify({ competitor_ids: user.competitors.map((c) => c.id) }),
    },
  });

  // Kick off async analysis on FastAPI
  const apiBase = process.env.API_BASE_URL ?? "http://localhost:8000";
  fetch(`${apiBase}/analyze/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Internal-Secret": process.env.INTERNAL_API_SECRET ?? "",
    },
    body: JSON.stringify({
      job_id: job.id,
      user_id: user.id,
      niche: user.niche,
      competitor_handles: user.competitors.map((c) => c.handle),
    }),
  }).catch((e) => console.error("[analyze/start] FastAPI call failed:", e));

  return NextResponse.json({ job_id: job.id, status: "pending", progress: 0 });
}
