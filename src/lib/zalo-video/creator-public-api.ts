import {
  ensureCsrfToken,
  getAccountSession,
} from "@/lib/zalo-video/session";
import type {
  ZaloCategoryVideoItem,
  ZaloPageInfoResponse,
  ZaloPlaylistListResponse,
  ZaloPlaylistVideoItem,
  ZaloPublicVideoListResponse,
  ZaloStoreProductItem,
} from "@/types/zalo-video";

async function postJson<T>(
  path: string,
  accountId: number,
  body: Record<string, unknown> = {},
  options?: { csrf?: boolean },
): Promise<T> {
  const session = getAccountSession(accountId);
  if (!session?.clientCookie) {
    throw new Error("Chưa có phiên đăng nhập kênh video.");
  }

  const payload: Record<string, unknown> = {
    clientCookie: session.clientCookie,
    proxy: session.proxy,
    ...body,
  };

  if (options?.csrf) {
    payload.csrf = await ensureCsrfToken(accountId);
  }

  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Yêu cầu thất bại");
  }

  return (await response.json()) as T;
}

function normalizeArray<T>(data: T[] | { data?: T[] } | unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { data?: T[] }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

export function formatZaloTimestamp(timestamp?: number): string {
  if (!timestamp) return "—";
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLegacyQueryId(searchParams: URLSearchParams): string | null {
  const keys = Array.from(searchParams.keys());
  return keys[0] ?? null;
}

// ——— Playlist ———

export async function fetchPlaylistList(
  accountId: number,
  page = 1,
  rows = 50,
): Promise<ZaloPlaylistListResponse> {
  return postJson<ZaloPlaylistListResponse>(
    "/next-api/get_play_list_video",
    accountId,
    { page, number_per_page: rows },
  );
}

export async function fetchPlaylistVideos(
  accountId: number,
  playlistId: string | number,
): Promise<ZaloPlaylistVideoItem[]> {
  const data = await postJson<ZaloPlaylistVideoItem[]>(
    "/next-api/get_video_in_play_list",
    accountId,
    { id: playlistId },
  );
  return normalizeArray(data);
}

export async function createPlaylist(options: {
  accountId: number;
  title: string;
  status: "1" | "2";
  videoIds: Array<string | number>;
}): Promise<void> {
  await postJson("/next-api/create_playlist_video", options.accountId, {
    title: options.title,
    status: options.status,
    videoIds: options.videoIds,
  }, { csrf: true });
}

export async function updatePlaylistPrivacy(options: {
  accountId: number;
  playlistId: string | number;
  status: "1" | "2";
}): Promise<void> {
  await postJson("/next-api/update_status_play_list", options.accountId, {
    id: options.playlistId,
    status: options.status,
  }, { csrf: true });
}

export async function updatePlaylistInfo(options: {
  accountId: number;
  playlistId: string | number;
  title: string;
  status: "1" | "2";
}): Promise<void> {
  await postJson("/next-api/update_infor_play_list", options.accountId, {
    id: options.playlistId,
    title: options.title,
    status: options.status,
  }, { csrf: true });
}

export async function addVideosToPlaylist(options: {
  accountId: number;
  playlistId: string | number;
  videoIds: Array<string | number>;
}): Promise<void> {
  await postJson("/next-api/update_infor_play_list_video", options.accountId, {
    id: options.playlistId,
    videoIds: options.videoIds,
  }, { csrf: true });
}

export async function deletePlaylist(
  accountId: number,
  playlistId: string | number,
): Promise<void> {
  await postJson("/next-api/delete_playlist", accountId, {
    id: playlistId,
  }, { csrf: true });
}

export async function removeVideoFromPlaylist(options: {
  accountId: number;
  playlistId: string | number;
  videoId: string | number;
}): Promise<void> {
  await postJson("/next-api/remove_video_play_list", options.accountId, {
    id: options.playlistId,
    videoIds: options.videoId,
  }, { csrf: true });
}

// ——— Trang thông tin ———

export async function fetchPageInfo(accountId: number): Promise<ZaloPageInfoResponse> {
  return postJson<ZaloPageInfoResponse>("/next-api/get_page_infor", accountId);
}

export async function createChannelPage(options: {
  accountId: number;
  name: string;
  description: string;
  showed: 0 | 1;
}): Promise<ZaloPageInfoResponse> {
  return postJson<ZaloPageInfoResponse>(
    "/next-api/create_page_infor",
    options.accountId,
    {
      name: options.name,
      description: options.description,
      showed: options.showed,
    },
    { csrf: true },
  );
}

export async function fetchStoreProducts(
  accountId: number,
  type = 0,
): Promise<ZaloStoreProductItem[]> {
  const data = await postJson<ZaloStoreProductItem[] | { data?: ZaloStoreProductItem[] }>(
    "/next-api/get_list_products_page",
    accountId,
    { type },
  );
  return normalizeArray(data);
}

export async function updatePageField(options: {
  accountId: number;
  value: string;
  type: "name" | "description";
}): Promise<void> {
  await postJson("/next-api/update_infor_page_creator", options.accountId, {
    infor: options.value,
    type: options.type,
  }, { csrf: true });
}

export async function updatePageVisibility(
  accountId: number,
  status: 0 | 1,
): Promise<void> {
  await postJson("/next-api/update_status_page_creator", accountId, {
    status,
  }, { csrf: true });
}

export async function createStoreProduct(options: {
  accountId: number;
  name: string;
  link: string;
  thumbnails: string;
  privacy?: number;
  ctaType?: number;
}): Promise<void> {
  await postJson("/next-api/create_new_products_page", options.accountId, {
    name: options.name,
    link: options.link,
    thumbnails: options.thumbnails,
    privacy: options.privacy ?? 2,
    ctaType: options.ctaType ?? 1,
    keyUpdate: "create-store-item",
  }, { csrf: true });
}

export async function deleteStoreProduct(
  accountId: number,
  productId: string | number,
): Promise<void> {
  await postJson("/next-api/delete_product_page", accountId, {
    videoId: productId,
  }, { csrf: true });
}

// ——— Gán nhãn video ———

export async function fetchCategoryVideos(
  accountId: number,
): Promise<ZaloCategoryVideoItem[]> {
  const data = await postJson<ZaloCategoryVideoItem[]>(
    "/next-api/get_list_category_products",
    accountId,
  );
  return normalizeArray(data);
}

export async function fetchVideosForLabelPicker(
  accountId: number,
): Promise<ZaloCategoryVideoItem[]> {
  const data = await postJson<ZaloCategoryVideoItem[]>(
    "/next-api/get_list_video_category_creator",
    accountId,
  );
  return normalizeArray(data);
}

export async function addVideoLabel(options: {
  accountId: number;
  videoId: string | number;
  customText: string | number;
  type: "contact-label-cta" | "store-label-cta";
}): Promise<void> {
  await postJson("/next-api/add_contact_label_cta", options.accountId, {
    videoId: options.videoId,
    customText: options.customText,
    type: options.type,
  }, { csrf: true });
}

export async function removeVideoLabel(options: {
  accountId: number;
  videoId: string | number;
  ctaType?: string;
  type: "delete-label-cta" | "delete-cta-video";
}): Promise<void> {
  await postJson("/next-api/delete_label_category", options.accountId, {
    videoId: options.videoId,
    ctaType: options.ctaType ?? "",
    type: options.type,
  }, { csrf: true });
}

export async function fetchPublicVideosForPicker(
  accountId: number,
): Promise<ZaloPublicVideoListResponse> {
  return postJson<ZaloPublicVideoListResponse>(
    "/next-api/get_list_video_public",
    accountId,
    { page: 1, number_per_page: 100, status: "public" },
  );
}