"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { t, type Lang, type Translations } from "./translations";

// Cast helper — satisfies `Translations` without literal-type clashes
function asT(obj: typeof t.uz | typeof t.en): Translations {
  return obj as unknown as Translations;
}

// ─── Context ─────────────────────────────────────────────────────────────────
interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  T: Translations;
}

const LangContext = createContext<LangCtx>({
  lang: "uz",
  setLang: () => {},
  T: asT(t.uz),
});

// ─── Provider ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "instaintel_lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz"); // default: Uzbek

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved === "en" || saved === "uz") setLangState(saved);
    } catch {}
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(STORAGE_KEY, l); } catch {}
  }, []);

  return (
    <LangContext.Provider value={{ lang, setLang, T: asT(t[lang]) }}>
      {children}
    </LangContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useLang() {
  return useContext(LangContext);
}
