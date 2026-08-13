import { DEFAULT_DESCRIPTION, SITE_NAME } from "@/config/seo";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Máy tính online cho người làm nghề`,
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
        src: "/images/brand/cong-cu-nghe-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/images/brand/cong-cu-nghe-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
