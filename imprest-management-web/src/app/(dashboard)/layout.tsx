"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api-client";
import { useApp } from "@/context/AppContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, refreshUser, t } = useApp();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      const token = getStoredToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      if (!user) {
        await refreshUser();
      }
      setChecking(false);
    };
    init();
  }, [router, user, refreshUser]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] text-sm text-[var(--text-muted)]">
        {t.loading}
      </div>
    );
  }

  return <>{children}</>;
}
