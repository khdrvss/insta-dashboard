export type Lang = "uz" | "en";

export const t = {
  uz: {
    // ── Sidebar ─────────────────────────────────────────────────────────────
    nav: {
      profile:   "Profilingiz",
      competitors: "Raqobatchilar",
      analysis:  "Tahlil",
      insights:  "Kontent tushunchalari",
      hooks:     "Hook kutubxonasi",
      scripts:   "Skript generatori",
    },
    sidebar: {
      freePlan:    "Bepul reja",
      scriptQuota: "Oyiga 5 ta skript",
      upgradeCta:  "Pro ga o'tish",
    },

    // ── Header ───────────────────────────────────────────────────────────────
    header: {
      notifications: "Bildirishnomalar",
    },

    // ── Dashboard (Your Profile) ──────────────────────────────────────────
    dashboard: {
      pageTitle:       "Profilingiz",
      pageSubtitle:    "Instagram hisobingiz ko'rsatkichlari",
      followers:       "Obunachilar",
      avgEngagement:   "O'rtacha jalb darajasi",
      postsAnalyzed:   "Tahlil qilingan postlar",
      competitorsTracked: "Kuzatiladigan raqobatchilar",
      connectToSee:    "Ko'rish uchun Instagramni ulang",
      aiEstimated30:   "AI-baholangan · oxirgi 30 post",
      fromInstagram:   "Instagramingizdan",
      connectToStart:  "Boshlash uchun ulang",
      confirmedComps:  "Tasdiqlangan raqobatchilar",
      runDiscovery:    "Raqobatchilarni aniqlash",
      gettingStarted:  "Boshlash",
      steps: {
        s1title: "Profilingizni to'ldiring",
        s1desc:  "Nisha, joylashuv va brend ovozingizni qo'shing",
        s2title: "Instagramni ulang",
        s2desc:  "Meta OAuth orqali Instagram biznes hisobingizni ulang",
        s3title: "Raqobatchilarni toping",
        s3desc:  "Nishaingiz uchun AI-asosida raqobatchilarni aniqlang",
        s4title: "Eng yaxshi kontentni tahlil qiling",
        s4desc:  "Raqobatchi Reels'idan g'alaba qozonuvchi naqshlarni oling",
        s5title: "Birinchi skriptingizni yarating",
        s5desc:  "Soniyalarda yuqori konversiyali Reels skriptlarini yarating",
      },
    },

    // ── Competitors ───────────────────────────────────────────────────────
    competitors: {
      pageTitle:    "Raqobatchilar",
      pageSubtitle: "Nishadagi Instagram raqobatchi hisoblarni toping va kuzating",
      discoverMore: "Ko'proq topish",
      disclaimer:   "Ma'lumot oshkoraligi:",
      disclaimerText:
        "Barcha raqobatchi ko'rsatkichlari ommaviy signallar asosida AI tomonidan baholangan. Ma'lumotlar faqat ochiq profillardan Apify + Meta reklama kutubxonasi orqali olingan. Meta yoki Instagram bilan bog'liq emas.",
      statsTracked:  "Kuzatiladigan raqobatchilar",
      statsAnalyzed: "To'liq tahlil qilingan",
      statsPosts:    "Jami tahlil qilingan postlar",
      discoverMoreH2: "Ko'proq raqobatchilarni toping",
      cancel:        "Bekor qilish",
      confirmedH2:   "Tasdiqlangan raqobatchilar",
      howTitle:      "Raqobatchilarni aniqlash qanday ishlaydi",
      howSteps: [
        {
          title: "Hashteg qidiruvi",
          desc:  "Nisha + joylashuv hashteglari orqali faol biznes hisoblarni topadi",
        },
        {
          title: "Meta reklama kutubxonasi",
          desc:  "Meta rasmiy API'si orqali nisha kalit so'zlari bilan reklama berayotgan bizneslarni qidiradi",
        },
        {
          title: "AI baholash",
          desc:  "Claude 30+ nomzodni filtrlaydi, 0–100 ball beradi va ko'rib chiqish uchun eng yaxshi 15 tasini taqdim etadi",
        },
      ],
    },

    // ── Analysis ──────────────────────────────────────────────────────────
    analysis: {
      pageTitle:    "Kontent tahlili",
      pageSubtitle: "Raqobatchi ishlashi va g'alaba naqshlarini chuqur o'rganish",
      runningSubtitle: "AI hozirda raqobatchi kontentini tahlil qilmoqda",
      aiEstimated:  "AI-baholangan ma'lumotlar:",
      aiEstimatedText:
        "Barcha ko'rsatkichlar faqat ommaviy signallardan olingan. Rasmiy Instagram ma'lumotlari emas.",
      noDataTitle:  "Tahlil ma'lumotlari yo'q",
      noDataDesc:
        "Raqobatchilar bo'limida raqobatchilarni tasdiqlang, so'ng AI kontent tahlil dvigatelini ishga tushiring. Biz videolarni transkript qilamiz, hook'larni ajratamiz, tempni aniqlaymiz va nishadagi g'alaba naqshlarini topamiz.",
      runAnalysis:  "Kontent tahlilini boshlash",
      runningBtn:   "Boshlanmoqda...",
      timeEst:      "~2–5 daqiqa · Gemini + Claude",
      reAnalyze:    "Qayta tahlil",
      mockBadge:    "Test ma'lumotlari",
      complianceText:
        "Barcha raqobatchi ko'rsatkichlari ommaviy signallar asosida <b>AI-baholangan</b>. Meta yoki Instagram bilan bog'liq emas.",
      competitorComp: "Raqobatchilarni solishtirish",
      engagementTrend: "Jalb trendlari",
      contentFormat: "Kontent formati taqsimoti",
      nicheIntel:    "AI nisha intellekti",
      topPosts:      "Eng yaxshi postlar",
      topPostsSub:   "jalb ko'rsatkichi bo'yicha",
      nichePending:  "Nisha xulosasi tahlil tugagandan keyin yaratiladi",
    },

    // ── Insights ─────────────────────────────────────────────────────────
    insights: {
      pageTitle:    "Kontent tushunchalari",
      pageSubtitle: "Nishadagi g'alaba naqshlari, qudratli so'zlar va formulalar",
      aiEstimated:  "AI-baholangan:",
      aiEstimatedText:
        "Barcha naqshlar va tushunchalar faqat ommaviy kontent AI tahlili orqali aniqlangan.",
      mockBadge:    "Test ma'lumotlari — jonli tushunchalar uchun kontent tahlilini boshlang",
      noDataTitle:  "Tushunchalar yo'q",
      noDataDesc:
        "Tahlil bo'limida raqobatchi tahlilini boshlang — nisha intellekti, hook naqshlari va qudratli so'zlar yaratiladi.",
      hookPatterns:   "Hook naqshlari",
      contentFormats: "Eng yaxshi kontent formatlari",
      powerWords:     "Qudratli so'zlar va iboralar",
      hookScore:      "/100",
    },

    // ── Hook Library ──────────────────────────────────────────────────────
    hooks: {
      pageTitle:    "Hook kutubxonasi",
      pageSubtitle: "Raqobatchilardan olingan eng yaxshi hook'lar",
      searchPlaceholder: "Hook matnida qidirish...",
      allTypes:     "Barchasi",
      sortLikes:    "Ko'p like",
      sortNew:      "Eng yangi",
      sortAz:       "A–Z",
      copyHook:     "Hook nusxalash",
      copied:       "Nusxalandi!",
      viewCaption:  "Sarlavhani ko'rish",
      hideCaption:  "Yopish",
      noHooks:      "Hali hook'lar yo'q",
      noHooksDesc:  "Raqobatchi tahlilini boshlang — hook'lar avtomatik ajratib olinadi.",
      hooks:        "ta hook",
    },

    // ── Script History ────────────────────────────────────────────────────
    history: {
      tab:          "Tarix",
      generate:     "Yaratish",
      noHistory:    "Hali saqlangan skriptlar yo'q",
      noHistoryDesc: "Skript yaratgandan so'ng, ular bu yerda saqlanadi.",
      variations:   "ta variant",
      expand:       "Batafsil",
      collapse:     "Yopish",
    },

    // ── My Performance ────────────────────────────────────────────────────
    performance: {
      title:        "Mening kontentim samaradorligi",
      avgEr:        "O'rtacha ER",
      bestTime:     "Eng yaxshi vaqt",
      bestFormat:   "Eng yaxshi format",
      topPosts:     "Eng yaxshi postlar",
      worstPosts:   "Takomillashtirish kerak",
      connect:      "Instagram ulab, kontent samaradorligini kuzating",
      noData:       "Ma'lumot yo'q",
    },

    // ── Script Generator ──────────────────────────────────────────────────
    scripts: {
      pageTitle:    "Skript generatori",
      pageSubtitle: "Nishadagi g'alaba naqshlar asosida 3 ta original, yuqori konversiyali video skriptlar yarating",
      campaignGoal: "Kampaniya maqsadi",
      goals: {
        brand_awareness: "Brend tanilishi",
        direct_sales:    "To'g'ridan-to'g'ri savdo",
        lead_generation: "Lead yaratish",
      },
      platform:     "Platforma",
      platforms: {
        reels: "Instagram Reels",
        ads:   "Meta Ads",
      },
      length:       "Davomiyligi",
      tone:         "Ton",
      tones: {
        formal:      "Rasmiy",
        friendly:    "Do'stona",
        bold:        "Dadil",
        educational: "Ta'limiy",
      },
      generating:   "Yuqori konversiyali skriptlar yozilmoqda...",
      generateBtn:  "3 ta skript varianti yaratish",
      generatedH2:  "Yaratilgan skriptlar —",
      variations:   "ta variant",
      regenerate:   "Qayta yaratish",
      strongPrefix: "Kuchli",
      visual:       "Vizual:",
      text:         "Matn:",
      captionLabel: "Sarlavha:",
      copy:         "Nusxalash",
      copied:       "Nusxalandi!",
      noScripts:    "Skriptlar yo'q",
      noScriptsDesc:
        "Yuqoridagi maqsad, platforma va tonni tanlang, so'ng Yaratish tugmasini bosing. Skriptlar RAG texnologiyasi bilan ishlaydi — nishadagi g'alaba naqshlar asosida original kontent yaratadi.",
    },

    // ── Onboarding ────────────────────────────────────────────────────────
    onboarding: {
      welcome:   "Xush kelibsiz!",
      subtitle:  "Biznessingiz haqida ayting — raqobatchilarni topamiz va yutuqli kontentni yaratamiz.",
      step1title: "Instagram mavjudligingiz",
      handleLabel: "Instagram nomi",
      handlePlaceholder: "sizningnomingiz",
      nicheLabel: "Nisha / Soha",
      nichePlaceholder: '"qurilish Toshkent", "fitnes murabbiy", "non do\'koni NYC"',
      nicheHint:  "Aniq bo'ling — qancha ko'p kontekst, AI shuncha yaxshi ishlaydi",
      step2title: "Bozoringiz",
      locationLabel: "Joylashuv / Maqsadli bozor",
      locationPlaceholder: '"Toshkent, O\'zbekiston", "AQSh", "Janubi-Sharqiy Osiyo"',
      audienceLabel: "Maqsadli auditoriya tavsifi",
      audiencePlaceholder: '"30-55 yoshli uy egalari, Toshkentda ta\'mirlash istagan, byudjet ongli lekin sifatga e\'tibor beradi"',
      step3title: "Brendingiz",
      brandVoiceLabel: "Brend ovozi",
      brandVoices: {
        formal:      { label: "Rasmiy",    desc: "Professional, vakolatli" },
        friendly:    { label: "Do'stona",  desc: "Iliq, yaqinlashish mumkin" },
        bold:        { label: "Dadil",     desc: "To'g'ridan-to'g'ri, ishonchli" },
        educational: { label: "Ta'limiy",  desc: "Ma'lumotli, ekspert tomonidan" },
      },
      productsLabel: "Taklif qilinadigan mahsulotlar / xizmatlar",
      productsPlaceholder: '"Qurilish, ta\'mirlash, dizayn, loyiha boshqaruvi"',
      back:         "Orqaga",
      continue:     "Davom etish",
      settingUp:    "Sozlanmoqda...",
      launchBtn:    "Boshqaruv paneliga o'tish",
    },

    // ── Upgrade ───────────────────────────────────────────────────────────
    upgrade: {
      pageTitle:   "Pro ga o'tish",
      pageSubtitle: "To'liq tahlil va skript yaratish imkoniyatlarini oching",
      monthly:     "Oylik",
      annual:      "Yillik",
      save30:      "30% tejash",
      freeTitle:   "Bepul",
      forever:     "Abadiy",
      continueWithFree: "Bepul davom etish",
      mostPopular: "Eng mashhur",
      perMonth:    "oyiga",
      perMonthAnnual: "oyiga, yillik hisob",
      upgradeBtn:  "Pro ga o'tish",
      redirecting: "Yo'naltirilmoqda...",
      footer:      "Istalgan vaqt bekor qiling. Barcha narxlar AQSh dollarida. Stripe orqali xavfsiz to'lov.",
      featsFree: [
        "Oyiga 5 ta AI skript",
        "1 ta raqobatchi aniqlash",
        "Asosiy profil ko'rinishi",
        "Test ma'lumotlari rejimi",
      ],
      featsPro: [
        "Cheksiz AI skriptlar",
        "Cheksiz raqobatchilarni aniqlash",
        "To'liq kontent tahlil dvigatel",
        "Gemini + Claude video tahlili",
        "Pinecone RAG-asosida skriptlar",
        "Recharts ishlash paneli",
        "Ustuvor qo'llab-quvvatlash",
      ],
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  en: {
    nav: {
      profile:     "Your Profile",
      competitors: "Competitors",
      analysis:    "Analysis",
      insights:    "Content Insights",
      hooks:       "Hook Library",
      scripts:     "Script Generator",
    },
    sidebar: {
      freePlan:    "Free Plan",
      scriptQuota: "5 script generations/month",
      upgradeCta:  "Upgrade to Pro",
    },

    header: {
      notifications: "Notifications",
    },

    dashboard: {
      pageTitle:       "Your Profile",
      pageSubtitle:    "Overview of your Instagram account performance",
      followers:       "Followers",
      avgEngagement:   "Avg Engagement Rate",
      postsAnalyzed:   "Posts Analyzed",
      competitorsTracked: "Competitors Tracked",
      connectToSee:    "Connect Instagram to see",
      aiEstimated30:   "AI-estimated · last 30 posts",
      fromInstagram:   "From your Instagram",
      connectToStart:  "Connect to start",
      confirmedComps:  "Confirmed competitors",
      runDiscovery:    "Run competitor discovery",
      gettingStarted:  "Getting Started",
      steps: {
        s1title: "Complete your profile",
        s1desc:  "Add your niche, location, and brand voice",
        s2title: "Connect Instagram",
        s2desc:  "Link your Instagram Business account via Meta OAuth",
        s3title: "Discover competitors",
        s3desc:  "Run AI-powered competitor discovery for your niche",
        s4title: "Analyze top content",
        s4desc:  "Extract winning patterns from competitor Reels",
        s5title: "Generate your first script",
        s5desc:  "Create high-converting Reels scripts in seconds",
      },
    },

    competitors: {
      pageTitle:    "Competitors",
      pageSubtitle: "Discover and track competitor Instagram accounts in your niche",
      discoverMore: "Discover more",
      disclaimer:   "Data transparency:",
      disclaimerText:
        "All competitor metrics are AI-estimated based on publicly available signals. Competitor data is sourced only from public profiles via approved APIs (Apify + Meta Ad Library). Not affiliated with Meta or Instagram.",
      statsTracked:  "Competitors tracked",
      statsAnalyzed: "Fully analyzed",
      statsPosts:    "Posts analyzed total",
      discoverMoreH2: "Discover more competitors",
      cancel:        "Cancel",
      confirmedH2:   "Confirmed Competitors",
      howTitle:      "How competitor discovery works",
      howSteps: [
        {
          title: "Hashtag Search",
          desc:  "Scans top Instagram posts using your niche + location hashtags to extract active business accounts",
        },
        {
          title: "Meta Ad Library",
          desc:  "Queries the official Meta Ad Library API for businesses running ads with your niche keywords",
        },
        {
          title: "AI Scoring",
          desc:  "Claude filters 30+ candidates, scores relevance 0–100, returns top 15 for your review",
        },
      ],
    },

    analysis: {
      pageTitle:    "Content Analysis",
      pageSubtitle: "Deep dive into competitor performance and winning patterns",
      runningSubtitle: "AI is deconstructing competitor content right now",
      aiEstimated:  "AI-estimated data:",
      aiEstimatedText:
        "All metrics are derived from public signals only. Not official Instagram data.",
      noDataTitle:  "No analysis data yet",
      noDataDesc:
        "Confirm competitors in the Competitors tab, then run the AI content analysis engine. We'll transcribe videos, extract hooks, detect pacing, and surface the winning patterns in your niche.",
      runAnalysis:  "Run Content Analysis",
      runningBtn:   "Starting...",
      timeEst:      "~2–5 min · Gemini + Claude",
      reAnalyze:    "Re-analyze",
      mockBadge:    "Mock data",
      complianceText:
        "All competitor metrics are <b>AI-estimated</b> based on publicly available signals. Not affiliated with Meta or Instagram.",
      competitorComp: "Competitor Comparison",
      engagementTrend: "Engagement Trend",
      contentFormat: "Content Format Breakdown",
      nicheIntel:    "AI Niche Intelligence",
      topPosts:      "Top Performing Posts",
      topPostsSub:   "by engagement score",
      nichePending:  "Niche summary generates after analysis completes",
    },

    insights: {
      pageTitle:    "Content Insights",
      pageSubtitle: "Extracted patterns, power words, and winning formulas from your niche",
      aiEstimated:  "AI-estimated:",
      aiEstimatedText:
        "All patterns and insights are derived by AI analysis of publicly available content only.",
      mockBadge:    "Mock data — run content analysis to generate live insights",
      noDataTitle:  "No insights yet",
      noDataDesc:
        "Run competitor analysis from the Analysis tab to generate niche intelligence, hook patterns, and power phrases.",
      hookPatterns:   "Hook Patterns",
      contentFormats: "Best Content Formats",
      powerWords:     "Power Words & Phrases",
      hookScore:      "/100",
    },

    hooks: {
      pageTitle:    "Hook Library",
      pageSubtitle: "Best hooks extracted from competitor content",
      searchPlaceholder: "Search hook text...",
      allTypes:     "All types",
      sortLikes:    "Most likes",
      sortNew:      "Newest",
      sortAz:       "A–Z",
      copyHook:     "Copy hook",
      copied:       "Copied!",
      viewCaption:  "View caption",
      hideCaption:  "Hide",
      noHooks:      "No hooks yet",
      noHooksDesc:  "Run competitor analysis — hooks will be extracted automatically.",
      hooks:        "hooks",
    },

    history: {
      tab:          "History",
      generate:     "Generate",
      noHistory:    "No saved scripts yet",
      noHistoryDesc: "Scripts you generate will be saved here.",
      variations:   "variations",
      expand:       "Show all",
      collapse:     "Collapse",
    },

    performance: {
      title:        "My Content Performance",
      avgEr:        "Avg ER",
      bestTime:     "Best time",
      bestFormat:   "Best format",
      topPosts:     "Top posts",
      worstPosts:   "Needs improvement",
      connect:      "Connect Instagram to track content performance",
      noData:       "No data",
    },

    scripts: {
      pageTitle:    "Script Generator",
      pageSubtitle: "Generate 3 original, high-converting video scripts based on winning patterns in your niche",
      campaignGoal: "Campaign Goal",
      goals: {
        brand_awareness: "Brand Awareness",
        direct_sales:    "Direct Sales",
        lead_generation: "Lead Generation",
      },
      platform:     "Platform",
      platforms: {
        reels: "Instagram Reels",
        ads:   "Meta Ads",
      },
      length:       "Length",
      tone:         "Tone",
      tones: {
        formal:      "Formal",
        friendly:    "Friendly",
        bold:        "Bold",
        educational: "Educational",
      },
      generating:   "Writing high-converting scripts...",
      generateBtn:  "Generate 3 Script Variations",
      generatedH2:  "Generated Scripts —",
      variations:   "variations",
      regenerate:   "Regenerate",
      strongPrefix: "Strong",
      visual:       "Visual:",
      text:         "Text:",
      captionLabel: "Caption:",
      copy:         "Copy",
      copied:       "Copied!",
      noScripts:    "No scripts yet",
      noScriptsDesc:
        "Select your goal, platform, and tone above, then hit Generate. Scripts are powered by RAG — they use winning patterns from your niche to create original content.",
    },

    onboarding: {
      welcome:   "Welcome!",
      subtitle:  "Tell us about your business so we can find your competitors and generate winning content.",
      step1title: "Your Instagram Presence",
      handleLabel: "Instagram Handle",
      handlePlaceholder: "yourhandle",
      nicheLabel: "Your Niche / Industry",
      nichePlaceholder: '"construction Tashkent", "fitness coaching", "bakery NYC"',
      nicheHint:  "Be specific — the more context, the better AI performs",
      step2title: "Your Market",
      locationLabel: "Location / Target Market",
      locationPlaceholder: '"Tashkent, Uzbekistan", "United States", "Southeast Asia"',
      audienceLabel: "Target Audience Description",
      audiencePlaceholder: '"Homeowners aged 30-55 looking to renovate their homes in Tashkent, budget-conscious but quality-driven"',
      step3title: "Your Brand",
      brandVoiceLabel: "Brand Voice",
      brandVoices: {
        formal:      { label: "Formal",      desc: "Professional, authoritative" },
        friendly:    { label: "Friendly",    desc: "Warm, approachable" },
        bold:        { label: "Bold",        desc: "Direct, confident, punchy" },
        educational: { label: "Educational", desc: "Informative, expert-driven" },
      },
      productsLabel: "Products / Services Offered",
      productsPlaceholder: '"Construction, renovation, interior design, project management for residential buildings"',
      back:         "Back",
      continue:     "Continue",
      settingUp:    "Setting up...",
      launchBtn:    "Launch Dashboard",
    },

    upgrade: {
      pageTitle:   "Upgrade to Pro",
      pageSubtitle: "Unlock the full analysis and script generation engine",
      monthly:     "Monthly",
      annual:      "Annual",
      save30:      "save 30%",
      freeTitle:   "Free",
      forever:     "Forever",
      continueWithFree: "Continue with Free",
      mostPopular: "Most popular",
      perMonth:    "per month",
      perMonthAnnual: "per month, billed annually",
      upgradeBtn:  "Upgrade to Pro",
      redirecting: "Redirecting...",
      footer:      "Cancel anytime. All prices in USD. Secure checkout via Stripe.",
      featsFree: [
        "5 AI script generations / month",
        "1 competitor discovery run",
        "Basic profile overview",
        "Mock data mode",
      ],
      featsPro: [
        "Unlimited AI script generations",
        "Unlimited competitor discovery",
        "Full content analysis engine",
        "Gemini + Claude video analysis",
        "Pinecone RAG-powered scripts",
        "Recharts performance dashboards",
        "Priority support",
      ],
    },
  },
} as const;

// Widened structural type — all leaf values become string / readonly string[]
// so both UZ and EN objects satisfy it without clashing literal types.
type DeepString<T> = T extends string
  ? string
  : T extends readonly string[]
  ? readonly string[]
  : { [K in keyof T]: DeepString<T[K]> };

export type Translations = DeepString<typeof t.en>;
