"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, type Lang } from "@/lib/i18n";
import type { User } from "@/types/auth";
import { authService } from "@/services/auth.service";
import { getStoredToken } from "@/lib/api-client";

export type ThemePreference = "system" | "light" | "dark";

interface AppContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)["fa"] | (typeof translations)["en"];
  theme: ThemePreference;
  toggleTheme: () => void;
  user: User | null;
  setUser: (u: User | null) => void;
  refreshUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");
  const [theme, setThemeState] = useState<ThemePreference>("dark");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedLang = localStorage.getItem("imprest_lang") as Lang | null;
    if (savedLang === "en" || savedLang === "fa") {
      setLangState(savedLang);
      document.documentElement.lang = savedLang;
      document.documentElement.dir = savedLang === "fa" ? "rtl" : "ltr";
    }

    const savedTheme = localStorage.getItem("color-scheme") as ThemePreference | null;
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
    } else {
      // Default to Dark Navy + Orange if no preference stored
      setThemeState("dark");
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) meta.setAttribute("content", "dark");
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === "color-scheme") {
        const val = (e.newValue as ThemePreference) || "system";
        setThemeState(val);
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.setAttribute("content", val === "system" ? "light dark" : val);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem("imprest_lang", newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === "fa" ? "rtl" : "ltr";
  };

  const toggleTheme = () => {
    const next: ThemePreference = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    try {
      localStorage.setItem("color-scheme", next);
    } catch {
      // Ignore storage restriction
    }
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute("content", next);
  };

  const refreshUser = async () => {
    if (!getStoredToken()) {
      setUser(null);
      return;
    }
    try {
      const me = await authService.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        theme,
        toggleTheme,
        user,
        setUser,
        refreshUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
