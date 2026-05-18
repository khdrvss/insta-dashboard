"use client";

import { createContext, useContext, useRef, useState, useCallback } from "react";

export interface GeneratedScript {
  variation: number;
  concept_title: string;
  hook_type: string;
  borrowed_pattern: string;
  scenes: { timecode: string; visual: string; on_screen_text: string | null }[];
  caption: string;
  hashtags: string[];
  thumbnail_idea: string;
  predicted_strength: "hook" | "retention" | "cta" | "balanced";
}

interface ScriptsState {
  scripts: GeneratedScript[];
  loading: boolean;
  error: string | null;
  goal: "brand_awareness" | "direct_sales" | "lead_generation";
  platform: "reels" | "ads";
  lengthSecs: 15 | 30 | 60;
  tone: "formal" | "friendly" | "bold" | "educational";
  setGoal: (v: "brand_awareness" | "direct_sales" | "lead_generation") => void;
  setPlatform: (v: "reels" | "ads") => void;
  setLengthSecs: (v: 15 | 30 | 60) => void;
  setTone: (v: "formal" | "friendly" | "bold" | "educational") => void;
  generate: () => void;
}

const ScriptsContext = createContext<ScriptsState | null>(null);

export function ScriptsProvider({ children }: { children: React.ReactNode }) {
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<"brand_awareness" | "direct_sales" | "lead_generation">("brand_awareness");
  const [platform, setPlatform] = useState<"reels" | "ads">("reels");
  const [lengthSecs, setLengthSecs] = useState<15 | 30 | 60>(30);
  const [tone, setTone] = useState<"formal" | "friendly" | "bold" | "educational">("friendly");

  // Use a ref so the promise is not bound to component lifecycle
  const controllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(async () => {
    // Cancel any previous in-flight request
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setScripts([]);

    try {
      const res = await fetch("/api/scripts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, platform, lengthSecs, tone }),
        // keepalive keeps the request alive even if the page unmounts
        keepalive: true,
      });

      if (controller.signal.aborted) return;

      const data = await res.json();

      if (controller.signal.aborted) return;

      if (!res.ok) {
        setError(data.error ?? "Xatolik yuz berdi");
      } else if (data.scripts) {
        setScripts(data.scripts);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return; // deliberate cancel, not an error
      setError("Tarmoq xatosi — qayta urinib ko'ring");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [goal, platform, lengthSecs, tone]);

  return (
    <ScriptsContext.Provider value={{
      scripts, loading, error,
      goal, platform, lengthSecs, tone,
      setGoal, setPlatform, setLengthSecs, setTone,
      generate,
    }}>
      {children}
    </ScriptsContext.Provider>
  );
}

export function useScripts() {
  const ctx = useContext(ScriptsContext);
  if (!ctx) throw new Error("useScripts must be used inside ScriptsProvider");
  return ctx;
}
