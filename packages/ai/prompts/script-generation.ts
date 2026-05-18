export const SCRIPT_GENERATION_PROMPT_VERSION = "v2.0.0";

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
  const goalMap: Record<string, string> = {
    brand_awareness: "Brend tanilishini va ishonchini oshirish",
    direct_sales:    "Darhol sotib olish qarorini qabul qildirish",
    lead_generation: "Liderlarni jalb qilish (DM, link, ariza)",
  };

  const platformMap: Record<string, string> = {
    reels: "Instagram Reels (organik, algoritm uchun optimallashtirilgan)",
    ads:   "Meta Ads (pulli, konversiyaga yo'naltirilgan)",
  };

  const toneMap: Record<string, string> = {
    formal:      "Rasmiy va professional",
    friendly:    "Do'stona va iliq",
    bold:        "Dadil va ishonchli",
    educational: "Ta'limiy va ma'lumot beruvchi",
  };

  return `Siz O'zbekiston bozori uchun yuqori konversiyali ${platformMap[params.platform]} video skriptlar yozuvchi mutaxasssissiz.

BREND MA'LUMOTLARI:
- Soha (Niche): ${params.niche}
- Brend ovozi: ${params.brandVoice}
- Ton: ${toneMap[params.tone] ?? params.tone}
- Mahsulot/Xizmatlar: ${params.productsServices ?? "Ko'rsatilmagan"}
- Maqsadli auditoriya: ${params.targetAudience ?? "Umumiy auditoriya"}

KAMPANIYA MAQSADI: ${goalMap[params.goal] ?? params.goal}
PLATFORMA: ${platformMap[params.platform]}
VIDEO DAVOMIYLIGI: ${params.lengthSecs} soniya

NISHADAGI G'OLIB NAMUNALAR (ilhom manbai sifatida foydalaning, original kontent yarating):
Eng yaxshi Hook turlari:
${params.winningHooks.map((h) => `- ${h.type}: "${h.example}"`).join("\n")}

Eng samarali kontent formatlari:
${params.topFormats.map((f) => `- ${f.format}: ${f.description}`).join("\n")}

Jalb qiluvchi kuchli so'zlar:
${params.powerPhrases.slice(0, 10).join(", ")}

CTA yo'riqnomalari:
${params.ctaGuidelines.join(", ")}

VAZIFA: 3 ta ORIGINAL, YUQORI KONVERSIYALI video skript variantini yarating.

MUHIM QOIDALAR:
1. BARCHA matn O'ZBEK TILIDA bo'lishi SHART (lotin alifbosi — "concept_title", "borrowed_pattern", "visual", "on_screen_text", "caption", "thumbnail_idea" hammasi o'zbek tilida)
2. Hashtag'lar ham o'zbek va ingliz tilida aralash bo'lishi mumkin, lekin asosiy matnlar faqat o'zbek tilida
3. Raqobatchi skriptlarni so'zma-so'z ko'chirmang — g'oyalardan ilhom oling, original kontent yarating
4. O'zbekiston auditoriyasiga mos, Toshkent bozorini hisobga olgan holda yozing
5. Har bir sahna (scene) aniq, jonli va amaliy bo'lsin

AYNAN QUYIDAgI JSON STRUKTURASINI QAYTARING (boshqa hech narsa yo'q, faqat JSON):
{
  "scripts": [
    {
      "variation": 1,
      "concept_title": "string (o'zbek tilida, qiziqarli sarlavha)",
      "hook_type": "string (hook turi: savol/shok/va'da/hikoya/statistika/pov)",
      "borrowed_pattern": "string (qaysi g'olib namunadan ilhom olindi va nima uchun samarali — O'ZBEK TILIDA)",
      "scenes": [
        {
          "timecode": "0:00-0:03",
          "visual": "string (kamera/vizual ko'rsatadi nima — O'ZBEK TILIDA)",
          "on_screen_text": "string yoki null (ekrandagi yozuv — O'ZBEK TILIDA)"
        }
      ],
      "caption": "string (Instagram caption, 150-200 belgi, O'ZBEK TILIDA)",
      "hashtags": ["10 ta tegishli hashtag # belgisisiz"],
      "thumbnail_idea": "string (ideal thumbnail kadr tavsifi — O'ZBEK TILIDA)",
      "predicted_strength": "hook" yoki "retention" yoki "cta" yoki "balanced"
    }
  ]
}

Sahnalar aynan ${params.lengthSecs} soniyani to'ldirsin. O'zbekiston premium ko'chmas mulk bozori uchun jonli, aniq va ta'sirchan yozing.`;
}
