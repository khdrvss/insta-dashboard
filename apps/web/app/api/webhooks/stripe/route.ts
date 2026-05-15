import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const clerkId = session.metadata?.clerk_id;
      if (clerkId) {
        await prisma.user.update({
          where: { clerkId },
          data: { plan: "pro" },
        });
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as any;
      const clerkId = sub.metadata?.clerk_id;
      if (clerkId) {
        await prisma.user.update({
          where: { clerkId },
          data: { plan: "free" },
        });
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
