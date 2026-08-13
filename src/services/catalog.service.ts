import { API_CATALOG } from "@/config/api";
import publicApi from "@/lib/public-api";
import type { Profession, ToolDetail, ToolListItem } from "@/types/catalog";

export async function fetchProfessions(): Promise<Profession[]> {
  const res = await publicApi.get<Profession[]>(API_CATALOG.PROFESSIONS);
  return res.data ?? [];
}

export async function fetchTools(params?: {
  profession?: string;
  q?: string;
}): Promise<ToolListItem[]> {
  const res = await publicApi.get<ToolListItem[]>(API_CATALOG.TOOLS, {
    params: {
      profession: params?.profession || undefined,
      q: params?.q || undefined,
    },
  });
  return res.data ?? [];
}

export async function fetchToolDetail(slug: string): Promise<ToolDetail> {
  const res = await publicApi.get<ToolDetail>(API_CATALOG.TOOL_DETAIL(slug));
  return res.data;
}

export async function fetchFeaturedTools(): Promise<ToolListItem[]> {
  const tools = await fetchTools();
  return tools.filter((t) => t.is_featured);
}
