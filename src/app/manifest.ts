import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/config/seo";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Quản trị Zalo`,
    short_name: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#465fff",
    lang: "vi",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/images/logo/logo-icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/logo/logo-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}