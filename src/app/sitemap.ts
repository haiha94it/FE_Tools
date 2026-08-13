import { getSiteUrl, PUBLIC_ROUTES } from "@/config/seo";
import { fetchProfessions, fetchTools } from "@/services/catalog.service";
import type { MetadataRoute } from "next";

/** Sitemap public gồm route tĩnh và slug catalog lấy từ API. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();
  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${siteUrl}${route.path === "/" ? "" : route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  try {
    const [professions, tools] = await Promise.all([fetchProfessions(), fetchTools()]);
    return [
      ...staticRoutes,
      ...professions.map((item) => ({ url: `${siteUrl}/${item.slug}`, lastModified, changeFrequency: "weekly" as const, priority: 0.8 })),
      ...tools.map((item) => ({ url: `${siteUrl}/${item.slug}`, lastModified, changeFrequency: "monthly" as const, priority: 0.7 })),
    ];
  } catch {
    return staticRoutes;
  }
}
