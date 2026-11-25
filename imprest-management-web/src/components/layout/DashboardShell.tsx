"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Globe,
  LogOut,
  Moon,
  Plus,
  Receipt,
  Settings,
  Sun,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { authService } from "@/services/auth.service";

interface DashboardShellProps {
  children: React.ReactNode;
  onAddReceiptClick?: () => void;
}

export function DashboardShell({ children, onAddReceiptClick }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang, setLang, t, theme, toggleTheme, user, setUser } = useApp();

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    router.push("/login");
  };

  const navItems = [
    { href: "/records", label: t.expenses, icon: Receipt },
    ...(user?.role === "admin" || user?.role === "super_admin"
      ? [{ href: "/settings", label: t.settings, icon: Settings }]
      : []),
  ];

  return (
    <div className="flex min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-[var(--border-subtle)] bg-[var(--bg-surface)] md:flex">
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-5 py-4">
          <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl" />
          <div>
            <div className="text-base font-bold leading-tight">{t.appName}</div>
            <div className="text-xs text-[var(--text-muted)]">{t.appSubtitle}</div>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1.5 p-3">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--accent-primary)] text-white shadow-md shadow-orange-500/20"
                    : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-subtle)] p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--status-danger)] hover:bg-[var(--status-danger)]/10"
          >
            <LogOut className="h-4 w-4" />
            <span>{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 px-4 py-3 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-2.5 md:hidden">
            <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
            <span className="font-bold">{t.appName}</span>
          </div>

          <div className="hidden text-sm font-medium text-[var(--text-muted)] md:block">
            {pathname.startsWith("/settings") ? t.settings : t.expenses}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setLang(lang === "fa" ? "en" : "fa")}
              className="flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--accent-primary)]"
            >
              <Globe className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              <span>{lang === "fa" ? "EN | FA" : "FA | EN"}</span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user && (
              <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-primary)] text-xs font-bold text-white">
                  {user.full_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden text-xs sm:block">
                  <div className="font-semibold leading-none">{user.full_name}</div>
                  <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">{user.role}</div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>

      {/* Mobile PWA Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-2 md:hidden"
      >
        <Link
          href="/records"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] ${
            pathname.startsWith("/records")
              ? "font-semibold text-[var(--accent-primary)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          <FileSpreadsheet className="h-5 w-5" />
          <span>{t.expenses}</span>
        </Link>

        {onAddReceiptClick ? (
          <button
            type="button"
            onClick={onAddReceiptClick}
            aria-label={t.addReceipt}
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-lg shadow-orange-500/40"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : (
          <Link
            href="/records"
            aria-label={t.addReceipt}
            className="-mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-primary)] text-white shadow-lg shadow-orange-500/40"
          >
            <Plus className="h-6 w-6" />
          </Link>
        )}

        {(user?.role === "admin" || user?.role === "super_admin") ? (
          <Link
            href="/settings"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] ${
              pathname.startsWith("/settings")
                ? "font-semibold text-[var(--accent-primary)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span>{t.settings}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleLogout}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] text-[var(--status-danger)]"
          >
            <LogOut className="h-5 w-5" />
            <span>{t.logout}</span>
          </button>
        )}
      </nav>
    </div>
  );
}
