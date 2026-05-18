export const VIDEO_ANALYSIS_PROMPT_VERSION = "v1.0.0";

export function buildVideoAnalysisPrompt(params: {
  caption?: string;
  niche: string;
}): string {
  return `You are an expert short-form video content analyst specializing in Instagram Reels and Meta Ads.

NICHE: ${params.niche}

${params.caption ? `CAPTION:\n${params.caption}\n` : ""}

Analyze this video content and return a JSON object with this EXACT structure:
{
  "hook_text": "string (the exact first 3 seconds of spoken/on-screen text)",
  "hook_type": "question" | "shock" | "promise" | "story" | "statistic" | "challenge",
  "hook_duration_s": number (estimated seconds for hook, typically 2-4),
  "value_prop": "string (core value proposition delivered in the video)",
  "cta_text": "string (call-to-action text, e.g. 'Link in bio', 'DM us')",
  "pacing_style": "fast_cut" | "talking_head" | "b_roll" | "text_only" | "mixed",
  "sentiment": "positive" | "urgent" | "educational" | "entertaining" | "inspirational",
  "content_format": "string (e.g. 'tutorial', 'testimonial', 'day-in-life', 'product-demo', 'trend')",
  "power_words": ["array", "of", "high", "impact", "words", "used"],
  "engagement_drivers": ["what makes this content engaging"]
}

Be specific and extract actual text from the caption. If information is not available, use null.`;
}

export function buildNicheSummaryPrompt(params: {
  niche: string;
  location: string;
  postCount: number;
  analyses: Array<Record<string, unknown>>;
}): string {
  return `You are an Instagram marketing strategist. You have analyzed ${params.postCount} top-performing posts in the "${params.niche}" niche targeting "${params.location}".

ANALYZED VIDEO DATA:
${JSON.stringify(params.analyses, null, 2)}

Synthesize this data into a comprehensive niche intelligence report. Return EXACTLY this JSON structure:
{
  "winning_patterns": [
    {
      "pattern": "string",
      "frequency": number (0-100 percentage of top posts using this),
      "why_it_works": "string"
    }
  ],
  "best_hook_styles": [
    {
      "type": "string",
      "example": "string (actual example from the data)",
      "effectiveness_score": number (0-100)
    }
  ],
  "top_content_formats": [
    {
      "format": "string",
      "avg_engagement_lift": number (percentage above average),
      "description": "string"
    }
  ],
  "power_phrases": ["array of high-performing phrases from the data"],
  "best_posting_patterns": {
    "times": ["HH:MM format recommendations"],
    "days": ["day names"],
    "frequency": "string (e.g. '5-7x per week')"
  },
  "cta_effectiveness": [
    {
      "cta": "string",
      "avg_engagement": number
    }
  ],
  "summary": "string (2-3 sentence executive summary of what's winning in this niche)"
}`;
}
