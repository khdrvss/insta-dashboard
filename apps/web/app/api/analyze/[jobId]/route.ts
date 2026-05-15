import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { jobId } = await params;

  if (jobId === "mock-job-001") {
    return NextResponse.json({ job_id: "mock-job-001", status: "done", progress: 100 });
  }

  const job = await prisma.analysisJob.findFirst({
    where: { id: jobId },
  });

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    progress: job.progress,
    error: job.errorMsg,
    started_at: job.startedAt,
    completed_at: job.completedAt,
  });
}
