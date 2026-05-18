export const COMPETITOR_FILTER_PROMPT_VERSION = "v2.0.0";

export function buildCompetitorFilterPrompt(params: {
  niche: string;
  location: string;
  candidates: Array<{ handle: string; bio?: string; followers?: number }>;
}): string {
  return `You are an Instagram competitive intelligence expert specializing in the Uzbekistan real estate market.

BUSINESS CONTEXT:
The client sells PREMIUM RESIDENTIAL REAL ESTATE (cottages, villas, townhouses, elite apartments) in and around Tashkent, Uzbekistan. Their brand is "buston.village" — a premium cottage village project.

TASK:
From the candidate Instagram accounts below, select ONLY the accounts that are DIRECT COMPETITORS — meaning they sell or rent RESIDENTIAL REAL ESTATE (houses, apartments, villas, cottages, land plots, or new housing developments) in Uzbekistan.

STRICT INCLUSION CRITERIA (account must meet ALL of these):
1. The account represents a COMPANY or DEVELOPER that SELLS or RENTS real estate properties
2. Properties are located in Uzbekistan (Tashkent, Tashkent region, or other Uzbek cities)
3. The account actively markets properties (new buildings, cottages, villas, elite apartments, land)

STRICT EXCLUSION LIST — IMMEDIATELY REJECT these account types (do NOT include them, score them 0):
- Content agencies, SMM studios, marketing bureaus (e.g. "contnt_buro", any "smm", "marketing", "agency")
- CRM tools, business software, client management platforms (e.g. "clientouz", "crm", "saas")
- Renovation / interior design / repair companies (e.g. "remont", "dizayn", "interior")
- Educational platforms, training centers, courses (any "edu", "course", "school", "academy")
- Construction material suppliers (bricks, cement, tiles, etc.)
- Personal accounts / influencers without a real estate product
- Businesses outside Uzbekistan
- Any account that cannot clearly be identified as a real estate seller/developer

CANDIDATE ACCOUNTS (${params.candidates.length} total):
${JSON.stringify(params.candidates, null, 2)}

Return a JSON object with this EXACT structure (no markdown, no extra text):
{
  "filtered": [
    {
      "handle": "string",
      "relevance_score": number (70-100 for confirmed real estate, 0 for excluded),
      "reasoning": "string — explain WHY this is a real estate company: what they sell, where, and how they compete with a premium cottage village"
    }
  ],
  "excluded_count": number,
  "exclusion_reasons": ["reason1", "reason2"]
}

Rules:
- Only include accounts with relevance_score >= 70
- Maximum 10 accounts in "filtered"
- Sort by relevance_score descending
- When in doubt, EXCLUDE — it is better to miss one competitor than to include irrelevant noise
- NEVER include content agencies, CRM tools, renovation companies, or educational accounts`;
}
