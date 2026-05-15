import { redirect } from "next/navigation";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const USE_CLERK = CLERK_KEY.startsWith("pk_") && !CLERK_KEY.includes("placeholder");

export default function SignInPage() {
  // In mock/dev mode (no real Clerk keys), skip auth and go straight to dashboard
  if (!USE_CLERK) {
    redirect("/dashboard");
  }

  // Dynamically render Clerk's SignIn — only reached when Clerk is configured
  const { SignIn } = require("@clerk/nextjs");
  return <SignIn />;
}
