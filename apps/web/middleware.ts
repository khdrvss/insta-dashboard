/**
 * Middleware — Clerk auth gate (production) or open pass-through (dev/mock).
 *
 * With real Clerk keys: protects all non-public routes.
 * Without real Clerk keys (USE_MOCK_DATA mode): every route is public so
 * the app runs fully without signing in.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/(.*)",
]);

// When no real Clerk key is configured, bypass auth entirely
const MOCK_MODE =
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_placeholder" ||
  process.env.USE_MOCK_DATA === "true";

export default MOCK_MODE
  ? (_req: NextRequest) => NextResponse.next()
  : clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        const { userId } = await auth();
        if (!userId) {
          const signInUrl = new URL("/sign-in", req.url);
          signInUrl.searchParams.set("redirect_url", req.url);
          return NextResponse.redirect(signInUrl);
        }
      }
    });

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
