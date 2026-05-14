export const COMPETITOR_FILTER_PROMPT_VERSION = "v1.0.0";

export function buildCompetitorFilterPrompt(params: {
  niche: string;
  location: string;
  candidates: Array<{ handle: string; bio?: string; followers?: number }>;
}): string {
  return `You are an Instagram marketing intelligence expert. Your task is to filter a list of Instagram accounts to find the most relevant competitors for a business.

BUSINESS CONTEXT:
- Niche: ${params.niche}
- Location/Market: ${params.location}

CANDIDATE ACCOUNTS (${params.candidates.length} total):
${JSON.stringify(params.candidates, null, 2)}

TASK:
Analyze each account and select the 15 most relevant public BUSINESS accounts (not personal accounts, influencers without products, or spam accounts) that compete in the "${params.niche}" niche targeting "${params.location}".

Return a JSON object with this exact structure:
{
  "filtered": [
    {
      "handle": "string",
      "relevance_score": number (0-100),
      "reasoning": "string (1-2 sentences explaining why this account is relevant)"
    }
  ],
  "excluded_count": number,
  "exclusion_reasons": ["reason1", "reason2"]
}

Sort by relevance_score descending. Only include accounts with relevance_score >= 50.`;
}
