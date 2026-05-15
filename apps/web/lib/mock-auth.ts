/**
 * Mock auth helpers for USE_MOCK_DATA=true mode.
 * When real Clerk keys are not configured, these return a synthetic dev user
 * so every server component and API route behaves as if someone is logged in.
 */

const MOCK_CLERK_ID = "dev_mock_user_001";

// Mimics the shape of Clerk's User object (just the fields we use)
export const MOCK_USER = {
  id: MOCK_CLERK_ID,
  primaryEmailAddress: { emailAddress: "dev@instaintel.local" },
  firstName: "Dev",
  lastName: "User",
  imageUrl: "",
  fullName: "Dev User",
} as const;

export function isMockMode() {
  return (
    process.env.USE_MOCK_DATA === "true" ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "pk_test_placeholder"
  );
}

/** Drop-in for Clerk's currentUser() that works in mock mode */
export async function getCurrentUser() {
  if (isMockMode()) return MOCK_USER;
  const { currentUser } = await import("@clerk/nextjs/server");
  return currentUser();
}

/** Drop-in for Clerk's auth() that returns {userId} — works in mock mode */
export async function getAuth() {
  if (isMockMode()) return { userId: MOCK_CLERK_ID };
  const { auth } = await import("@clerk/nextjs/server");
  return auth();
}
