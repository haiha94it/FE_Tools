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
    let msg = "Yêu cầu thất bại";
    try {
      const errBody = (await response.json()) as {
        msg?: string;
        message?: string;
        error?: string | number;
        details?: string;
      };
      if (typeof errBody?.msg === "string" && errBody.msg) msg = errBody.msg;
      else if (typeof errBody?.message === "string" && errBody.message)
        msg = errBody.message;
      else if (typeof errBody?.details === "string" && errBody.details)
        msg = errBody.details;
      else if (typeof errBody?.error === "string" && errBody.error)
        msg = errBody.error;
    } catch {
      /* ignore parse */
    }
    throw new Error(msg);
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

/** Zalo public-api: `{ error: 0 }` — error ≠ 0 = thất bại nghiệp vụ. */
function assertZaloBusinessOk(data: unknown, fallbackMsg: string): void {
  if (!data || typeof data !== "object") return;
  const row = data as {
    error?: number | string;
    msg?: string;
    message?: string;
  };
  if (!("error" in row) || row.error === undefined || row.error === null) return;
  const code = row.error;
  if (code === 0 || code === "0") return;
  throw new Error(
    (typeof row.msg === "string" && row.msg) ||
      (typeof row.message === "string" && row.message) ||
      fallbackMsg,
  );
}

/**
 * Bật/tắt hiển thị trang trên hồ sơ = store/update-privacy (Care3).
 * visible 1 → privacy=2 (công khai) · 0 → privacy=1 (riêng tư).
 */
export async function updatePageVisibility(
  accountId: number,
  visible: 0 | 1,
): Promise<void> {
  const privacy = visible === 1 ? 2 : 1;
  const data = await postJson<unknown>(
    "/next-api/update_page_privacy",
    accountId,
    { privacy },
    { csrf: true },
  );
  assertZaloBusinessOk(data, "Zalo từ chối đổi trạng thái hiển thị trang.");
}

/**
 * Legacy store/update-status (showed) — không phải switch «Hiển thị» Creator.
 * UI chính dùng updatePageVisibility → update-privacy.
 */
export async function updatePageShowedStatus(
  accountId: number,
  status: 0 | 1,
): Promise<void> {
  const data = await postJson<unknown>(
    "/next-api/update_status_page_creator",
    accountId,
    { status },
    { csrf: true },
  );
  assertZaloBusinessOk(data, "Zalo từ chối update-status trang.");
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

/** public | private | scheduled — list / private-list / scheduled-list */
export type ZaloChannelVideoListStatus = "public" | "private" | "scheduled";

export async function fetchChannelVideos(
  accountId: number,
  status: ZaloChannelVideoListStatus = "public",
  page = 1,
  rows = 100,
): Promise<ZaloPublicVideoListResponse> {
  return postJson<ZaloPublicVideoListResponse>(
    "/next-api/get_list_video_public",
    accountId,
    { page, number_per_page: rows, status },
  );
}

/** Xóa video kênh — Zalo video/remove. */
export async function deletePublicVideo(options: {
  accountId: number;
  videoId: string | number;
}): Promise<void> {
  const data = await postJson<unknown>(
    "/next-api/delete_video",
    options.accountId,
    { id: options.videoId },
    { csrf: true },
  );
  assertZaloBusinessOk(
    data,
    "Zalo từ chối xóa video (kiểm tra phiên / CSRF / quyền).",
  );
}

/**
 * Sửa nội dung (title/mô tả) video đã đặt lịch.
 * Zalo: POST video/update-schedule — form id + title.
 */
export async function updateScheduledVideoTitle(options: {
  accountId: number;
  videoId: string | number;
  title: string;
}): Promise<void> {
  const title = options.title.trim();
  if (!title) throw new Error("Nội dung không được để trống.");
  const data = await postJson<unknown>(
    "/next-api/update_video_schedule",
    options.accountId,
    { id: options.videoId, title },
    { csrf: true },
  );
  assertZaloBusinessOk(
    data,
    "Zalo từ chối cập nhật nội dung lịch (kiểm tra phiên / CSRF / quyền).",
  );
}

/** Ghim / bỏ ghim video — video/pin | video/unpin */
export async function pinChannelVideo(options: {
  accountId: number;
  videoId: string | number;
  pin: boolean;
}): Promise<void> {
  const data = await postJson<unknown>(
    "/next-api/pin_video",
    options.accountId,
    {
      id: options.videoId,
      status: options.pin ? "pin" : "unpin",
    },
    { csrf: true },
  );
  assertZaloBusinessOk(
    data,
    options.pin ? "Zalo từ chối ghim video." : "Zalo từ chối bỏ ghim video.",
  );
}

/**
 * Bật/tắt nút liên hệ trên video.
 * Zalo: video/update-contact-cta — form id=&enabled=0|1
 */
export async function updateVideoContactCta(options: {
  accountId: number;
  videoId: string | number;
  enabled: boolean;
}): Promise<void> {
  const data = await postJson<unknown>(
    "/next-api/update_video_contact_cta",
    options.accountId,
    {
      id: options.videoId,
      enabled: options.enabled ? 1 : 0,
    },
    { csrf: true },
  );
  assertZaloBusinessOk(data, "Zalo từ chối cập nhật nút liên hệ video.");
}

export function isVideoPinned(item: {
  isPinned?: boolean;
  is_pinned?: boolean;
  pinned?: boolean;
}): boolean {
  return Boolean(item.isPinned ?? item.is_pinned ?? item.pinned);
}

export function isVideoContactEnabled(item: {
  isContactEnabled?: boolean;
  is_contact_enabled?: boolean;
  contactEnabled?: boolean;
}): boolean {
  return Boolean(
    item.isContactEnabled ?? item.is_contact_enabled ?? item.contactEnabled,
  );
}

/** Unix schedule / publicTime nếu có trên item list. */
export function pickVideoScheduleUnix(item: unknown): number | undefined {
  if (!item || typeof item !== "object") return undefined;
  const r = item as Record<string, unknown>;
  const raw =
    r.publicTime ??
    r.public_time ??
    r.scheduleTime ??
    r.schedule_time ??
    r.publishTime ??
    r.publish_time;
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // ms vs s
  return n > 1e12 ? Math.floor(n / 1000) : Math.floor(n);
}

/** Danh mục sản phẩm store (proxy sẵn — UI có thể dùng sau). */
export async function fetchStoreProductCategories(
  accountId: number,
): Promise<unknown> {
  return postJson<unknown>(
    "/next-api/get_store_product_categories",
    accountId,
    {},
  );
}

// ——— Chi tiết / xem video ———

/** Chi tiết / thống kê cơ bản video — Zalo `video/analytics`. */
export async function fetchVideoAnalytics(
  accountId: number,
  videoId: string | number,
): Promise<Record<string, unknown>> {
  return postJson<Record<string, unknown>>("/next-api/get_infor_video", accountId, {
    id_video: videoId,
  });
}

/** Phân tích hiệu suất + nguồn traffic — Zalo `analytics-ad-stats`. */
export async function fetchVideoAdStats(
  accountId: number,
  videoId: string | number,
): Promise<Record<string, unknown>> {
  return postJson<Record<string, unknown>>("/next-api/get_video_ad_stats", accountId, {
    id_video: videoId,
  });
}

/**
 * Bình luận parent theo video — Zalo `comments/parent-list?videoId=&prevCmtId=`
 * Proxy: /next-api/get_list_comment_is_video
 */
export async function fetchVideoParentComments(
  accountId: number,
  videoId: string | number,
  options?: { prevCmtId?: string | null },
): Promise<{
  results: import("@/types/zalo-video").ZaloPublicCommentItem[];
  hasMore: boolean;
  nextPrevCmtId: string | null;
}> {
  const data = await postJson<{
    results?: import("@/types/zalo-video").ZaloPublicCommentItem[];
    hasMore?: boolean;
    nextPrevCmtId?: string | null;
  }>("/next-api/get_list_comment_is_video", accountId, {
    id_video: videoId,
    ...(options?.prevCmtId ? { prevCmtId: options.prevCmtId } : {}),
  });

  // Legacy: API cũ trả array thuần
  if (Array.isArray(data)) {
    const results = data as import("@/types/zalo-video").ZaloPublicCommentItem[];
    const last = results[results.length - 1];
    const nextPrevCmtId = last?.id != null ? String(last.id) : null;
    return {
      results,
      hasMore: results.length > 0 && Boolean(nextPrevCmtId),
      nextPrevCmtId,
    };
  }

  const results = Array.isArray(data?.results)
    ? data.results
    : normalizeArray<import("@/types/zalo-video").ZaloPublicCommentItem>(data);

  return {
    results,
    hasMore: Boolean(data?.hasMore && data?.nextPrevCmtId),
    nextPrevCmtId: data?.nextPrevCmtId ?? null,
  };
}