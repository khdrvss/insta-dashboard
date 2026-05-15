import { getAuth as auth, getCurrentUser } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId, interval } = await req.json().catch(() => ({}));
  const resolvedPriceId =
    priceId ??
    (interval === "annual"
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID);

  if (!resolvedPriceId || !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_placeholder") {
    // Dev mode: redirect to a mock success page
    return NextResponse.json({ url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=demo` });
  }

  const clerkUser = await getCurrentUser();
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

  const emailAddress =
    clerkUser && "primaryEmailAddress" in clerkUser
      ? (clerkUser as any).primaryEmailAddress?.emailAddress
      : (clerkUser as any)?.emailAddresses?.[0]?.emailAddress;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: emailAddress,
    line_items: [{ price: resolvedPriceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`,
    metadata: { clerk_id: userId, user_id: user?.id ?? "" },
  });

  return NextResponse.json({ url: session.url });
}
