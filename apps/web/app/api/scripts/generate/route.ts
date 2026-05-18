import { getAuth as auth } from "@/lib/mock-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@instagram-dashboard/db";
import OpenAI from "openai";
import { buildScriptGenerationPrompt } from "@instagram-dashboard/ai";
import { z } from "zod";
import mockScripts from "@/mock/generated_scripts.json";

const generateSchema = z.object({
  goal: z.enum(["brand_awareness", "direct_sales", "lead_generation"]),
  platform: z.enum(["reels", "ads"]),
  lengthSecs: z.union([z.literal(15), z.literal(30), z.literal(60)]),
  tone: z.enum(["formal", "friendly", "bold", "educational"]).default("friendly"),
});

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});
// google/gemini-2.0-flash-001 — cheap, fast, excellent Uzbek/multilingual support
const MODEL = process.env.SCRIPT_MODEL ?? "google/gemini-2.0-flash-001";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 422 });
  }

  // Return mock data when USE_MOCK_DATA=true
  if (process.env.USE_MOCK_DATA === "true") {
    await new Promise((r) => setTimeout(r, 1500)); // simulate generation delay
    return NextResponse.json({ scripts: mockScripts.scripts, mock: true });
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check rate limit (free tier: 5 scripts/month)
  if (user.plan === "free") {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    const count = await prisma.generatedScript.count({
      where: { userId: user.id, createdAt: { gte: thisMonth } },
    });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Monthly script limit reached. Upgrade to Pro for unlimited scripts." },
        { status: 429 }
      );
    }
  }

  const { goal, platform, lengthSecs, tone } = parsed.data;

  const prompt = buildScriptGenerationPrompt({
    niche: user.niche ?? "general",
    brandVoice: user.brandVoice,
    tone: tone,
    goal,
    platform,
    lengthSecs,
    productsServices: user.productsServices ?? undefined,
    targetAudience: user.targetAudience ?? undefined,
    winningHooks: [
      { type: "question", example: "Did you know most people get this wrong?" },
      { type: "shock", example: "This one mistake cost us $50,000" },
    ],
    topFormats: [
      { format: "talking-head", description: "Direct address builds trust" },
      { format: "before-after", description: "Visual transformation drives engagement" },
    ],
    powerPhrases: ["Before & After", "Watch this", "Nobody tells you", "Real results"],
    ctaGuidelines: ["Link in bio", "DM us", "Book a free call"],
  });

  const startTime = Date.now();
  const message = await openai.chat.completions.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const durationMs = Date.now() - startTime;
  const rawText = message.choices[0].message.content ?? "{}";

  let parsed_scripts;
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    parsed_scripts = JSON.parse(jsonMatch?.[0] ?? rawText);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 });
  }

  // Persist script + log usage (fire-and-forget — don't block the response)
  Promise.all([
    prisma.generatedScript.create({
      data: {
        userId: user.id,
        goal,
        tone,
        platform,
        lengthSecs,
        niche: user.niche ?? undefined,
        scriptJson: JSON.stringify(parsed_scripts),
        modelUsed: MODEL,
        tokenCount: (message.usage?.prompt_tokens ?? 0) + (message.usage?.completion_tokens ?? 0),
      },
    }),
    prisma.aiUsageLog.create({
      data: {
        userId: user.id,
        model: MODEL,
        operation: "script_generation",
        inputTokens: message.usage?.prompt_tokens ?? 0,
        outputTokens: message.usage?.completion_tokens ?? 0,
        durationMs,
      },
    }),
  ]).catch((e) => console.error("[scripts/generate] persist failed:", e));

  return NextResponse.json({ scripts: parsed_scripts.scripts ?? [] });
}
