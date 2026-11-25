"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    router.replace(token ? "/records" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] text-[var(--text-muted)]">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--accent-primary)] border-t-transparent" />
    </div>
  );
}
