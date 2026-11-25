import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CashTrack — Imprest & Petty Cash Manager",
    short_name: "CashTrack",
    description: "Bilingual Imprest & Expense Receipt Management PWA",
    start_url: "/records",
    display: "standalone",
    background_color: "#0B1220",
    theme_color: "#F97316",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
