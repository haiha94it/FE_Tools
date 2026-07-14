import { getAccountSession } from "@/lib/zalo-video/session";
import type { ZaloPublicVideoListResponse } from "@/types/zalo-video";

export async function fetchPublicVideoList(options: {
  accountId: number;
  page?: number;
  rows?: number;
  status?: "public" | "private" | "scheduled";
}): Promise<ZaloPublicVideoListResponse> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    return { results: [], count: 0 };
  }

  const response = await fetch("/next-api/get_list_video_public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      number_per_page: options.rows ?? 50,
      page: options.page ?? 1,
      status: options.status ?? "public",
      proxy: session.proxy,
    }),
  });

  if (!response.ok) {
    throw new Error("Không tải được danh sách video");
  }

  return (await response.json()) as ZaloPublicVideoListResponse;
}