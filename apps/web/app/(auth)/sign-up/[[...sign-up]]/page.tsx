import { redirect } from "next/navigation";

const CLERK_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const USE_CLERK = CLERK_KEY.startsWith("pk_") && !CLERK_KEY.includes("placeholder");

export default function SignUpPage() {
  // In mock/dev mode (no real Clerk keys), skip auth and go straight to onboarding
  if (!USE_CLERK) {
    redirect("/onboarding");
  }

  const { SignUp } = require("@clerk/nextjs");
  return <SignUp />;
}
