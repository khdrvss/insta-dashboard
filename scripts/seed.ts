import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { clerkId: "user_001" },
    update: {},
    create: {
      clerkId: "user_001",
      email: "admin@instaintel.local",
      instagramHandle: "",
      niche: "",
      location: "",
      brandVoice: "friendly",
      plan: "pro",
      onboardingDone: false,
    },
  });
  console.log("Seeded user:", user.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
