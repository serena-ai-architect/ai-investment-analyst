"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

// ═══════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}>({ theme: "system", setTheme: () => {}, resolved: "light" });

export function useTheme() {
  return useContext(ThemeContext);
}

// ═══════════════════════════════════════════════════════════════
// Language
// ═══════════════════════════════════════════════════════════════

const LangContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}>({ locale: "en", setLocale: () => {}, t: (k) => k });

export function useLang() {
  return useContext(LangContext);
}

// ═══════════════════════════════════════════════════════════════
// Combined Provider
// ═══════════════════════════════════════════════════════════════

export function Providers({ children }: { children: ReactNode }) {
  // Theme state
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) setThemeState(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    setResolved(isDark ? "dark" : "light");
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle("dark", e.matches);
      setResolved(e.matches ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  // Language state
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved) setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }

  function t(key: TranslationKey): string {
    return translations[locale][key] ?? key;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>
      <LangContext.Provider value={{ locale, setLocale, t }}>
        {children}
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
