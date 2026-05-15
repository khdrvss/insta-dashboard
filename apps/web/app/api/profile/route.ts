import { getAuth as auth } from "@/lib/mock-auth";
import { NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import mockProfile from "@/mock/user_profile.json";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (process.env.USE_MOCK_DATA === "true") {
    return NextResponse.json({ ...mockProfile, mock: true });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { instagramAccount: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      instagramHandle: user.instagramHandle,
      niche: user.niche,
      location: user.location,
      brandVoice: user.brandVoice,
      plan: user.plan,
    },
    instagram: user.instagramAccount,
    connected: !!user.metaAccessToken,
  });
}
