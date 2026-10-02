"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { translations, Language, Translations } from "./translations";

interface LanguageContextType {
  language: Language;
  t: Translations;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try { localStorage.setItem("vellum_language", lang); } catch { /* ignore */ }
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "id" : "en");
  }, [language, setLanguage]);

  // Load from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("vellum_language") as Language | null;
      if (saved === "en" || saved === "id") setLanguageState(saved);
    } catch { /* ignore */ }
  }, []);

  const t = translations[language] as Translations;

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
