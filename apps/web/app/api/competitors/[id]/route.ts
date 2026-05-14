import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Verify ownership before delete
  const competitor = await prisma.competitor.findFirst({
    where: { id: params.id, userId: user.id },
  });

  if (!competitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.competitor.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { confirmed } = body as { confirmed?: boolean };

  const updated = await prisma.competitor.updateMany({
    where: { id: params.id, userId: user.id },
    data: { confirmed: confirmed ?? true },
  });

  return NextResponse.json({ updated: updated.count });
}
