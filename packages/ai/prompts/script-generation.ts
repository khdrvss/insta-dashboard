export const SCRIPT_GENERATION_PROMPT_VERSION = "v1.0.0";

export interface ScriptGenerationParams {
  niche: string;
  brandVoice: string;
  tone: string;
  goal: "brand_awareness" | "direct_sales" | "lead_generation";
  platform: "reels" | "ads";
  lengthSecs: 15 | 30 | 60;
  productsServices?: string;
  targetAudience?: string;
  winningHooks: Array<{ type: string; example: string }>;
  topFormats: Array<{ format: string; description: string }>;
  powerPhrases: string[];
  ctaGuidelines: string[];
}

export function buildScriptGenerationPrompt(params: ScriptGenerationParams): string {
  const goalMap = {
    brand_awareness: "Build brand recognition and trust",
    direct_sales: "Drive immediate purchase decisions",
    lead_generation: "Capture leads (DMs, link clicks, form fills)",
  };

  const platformMap = {
    reels: "Instagram Reels (organic, algorithm-friendly)",
    ads: "Meta Ads (paid, conversion-optimized)",
  };

  return `You are an expert video scriptwriter specializing in high-converting ${platformMap[params.platform]} for the ${params.niche} industry.

BRAND PROFILE:
- Niche: ${params.niche}
- Brand Voice: ${params.brandVoice}
- Tone: ${params.tone}
- Products/Services: ${params.productsServices || "Not specified"}
- Target Audience: ${params.targetAudience || "General audience"}

CAMPAIGN GOAL: ${goalMap[params.goal]}
PLATFORM: ${platformMap[params.platform]}
VIDEO LENGTH: ${params.lengthSecs} seconds

WINNING PATTERNS FROM YOUR NICHE (use these as inspiration, create original content):
Top Hook Styles:
${params.winningHooks.map((h) => `- ${h.type}: "${h.example}"`).join("\n")}

Top Content Formats:
${params.topFormats.map((f) => `- ${f.format}: ${f.description}`).join("\n")}

Power Phrases That Drive Engagement:
${params.powerPhrases.slice(0, 10).join(", ")}

CTA Guidelines:
${params.ctaGuidelines.join(", ")}

TASK: Generate 3 ORIGINAL, HIGH-CONVERTING video script variations. Each must be structurally inspired by winning patterns but contain 100% original content — no copying competitor scripts verbatim.

Return EXACTLY this JSON structure:
{
  "scripts": [
    {
      "variation": 1,
      "concept_title": "string (catchy name for this concept)",
      "hook_type": "string",
      "borrowed_pattern": "string (which winning pattern this is inspired by and why it works)",
      "scenes": [
        {
          "timecode": "0:00-0:03",
          "visual": "string (what the camera/visuals show)",
          "on_screen_text": "string or null",
          "audio": "string (exact spoken words or sound description)"
        }
      ],
      "suggested_audio_style": "string (e.g. 'upbeat trending sound', 'voiceover only', 'trending audio + voiceover')",
      "caption": "string (Instagram caption, 150-200 chars)",
      "hashtags": ["10 relevant hashtags without #"],
      "thumbnail_idea": "string (describe the ideal thumbnail frame)",
      "predicted_strength": "hook" | "retention" | "cta" | "balanced"
    }
  ]
}

Write scenes that fill exactly ${params.lengthSecs} seconds. Be specific, vivid, and actionable. The scripts must feel authentic to the ${params.brandVoice} brand voice.`;
}
