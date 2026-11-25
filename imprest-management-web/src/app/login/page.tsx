"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Globe, Moon, Sun } from "lucide-react";
import { authService } from "@/services/auth.service";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { lang, setLang, t, theme, toggleTheme, refreshUser } = useApp();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.login(username.trim(), password);
      await refreshUser();
      router.push("/records");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg-app)] p-4">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLang(lang === "fa" ? "en" : "fa")}
          className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <Globe className="h-4 w-4" />
          <span>{lang === "fa" ? "EN" : "FA"}</span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <img src="/icon.svg" alt="" className="h-11 w-11 rounded-xl" />
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{t.appName}</h1>
            <p className="text-xs text-[var(--text-muted)]">{t.appSubtitle}</p>
          </div>
        </div>

        <h2 className="mb-1 text-lg font-semibold">{t.loginTitle}</h2>
        <p className="mb-6 text-sm text-[var(--text-muted)]">{t.loginSubtitle}</p>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[var(--status-danger)]/40 bg-[var(--status-danger)]/10 px-4 py-3 text-sm text-[var(--status-danger)]"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-username" className="mb-1.5 block text-sm font-medium">
              {t.username}
            </label>
            <input
              id="login-username"
              name="username"
              type="text"
              required
              autoComplete="username"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="min-h-[48px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 text-base outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium">
              {t.password}
            </label>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3.5 pe-11 text-base outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                type="button"
                aria-pressed={showPassword}
                aria-label={showPassword ? t.hidePassword : t.showPassword}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 end-0 flex items-center px-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 min-h-[48px] w-full rounded-xl bg-[var(--accent-primary)] px-4 font-semibold text-white transition hover:bg-[var(--accent-primary-hover)] disabled:opacity-60"
          >
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>
      </div>
    </main>
  );
}
