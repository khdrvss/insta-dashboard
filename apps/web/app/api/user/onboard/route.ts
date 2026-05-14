import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import { z } from "zod";

const onboardSchema = z.object({
  instagramHandle: z.string().optional(),
  niche: z.string().min(2, "Niche is required"),
  location: z.string().min(2, "Location is required"),
  targetAudience: z.string().optional(),
  brandVoice: z.enum(["formal", "friendly", "bold", "educational"]).default("friendly"),
  productsServices: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = onboardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const data = parsed.data;

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      instagramHandle: data.instagramHandle,
      niche: data.niche,
      location: data.location,
      targetAudience: data.targetAudience,
      brandVoice: data.brandVoice,
      productsServices: data.productsServices,
      onboardingDone: true,
    },
    create: {
      clerkId: userId,
      email: "",
      instagramHandle: data.instagramHandle,
      niche: data.niche,
      location: data.location,
      targetAudience: data.targetAudience,
      brandVoice: data.brandVoice,
      productsServices: data.productsServices,
      onboardingDone: true,
    },
  });

  return NextResponse.json({ success: true, user: { id: user.id, niche: user.niche } });
}
