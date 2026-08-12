import {
  ensureCsrfToken,
  getAccountSession,
} from "@/lib/zalo-video/session";
import type {
  ZaloCommentListCursor,
  ZaloPublicCommentListResponse,
} from "@/types/zalo-video";

/** Khớp query Zalo Creator /comments/list */
export type ZaloCommentOrderBy = 1 | 2;
/** 0 = tất cả bình luận, 1 = bình luận chưa trả lời */
export type ZaloCommentStatusFilter = 0 | 1;
/** 0 = tất cả video, 1 = video đang chạy quảng cáo */
export type ZaloCommentAdsFilter = 0 | 1;

/**
 * Decode HTML entities (`&gt;` → `>`) để hiển thị text — không render HTML (tránh XSS).
 */
export function decodeHtmlEntities(input: string): string {
  if (!input) return "";
  // Named + numeric entities phổ biến (SSR + client)
  let s = input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'");
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
    const code = parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _;
  });
  s = s.replace(/&#(\d+);/g, (_, dec: string) => {
    const code = Number(dec);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _;
  });
  // Browser: decode nốt entity còn lại qua textarea (text only)
  if (typeof document !== "undefined") {
    const ta = document.createElement("textarea");
    ta.innerHTML = s;
    return ta.value;
  }
  return s;
}

export async function fetchPublicCommentList(options: {
  accountId: number;
  /** 1 = bình luận mới nhất, 2 = video mới nhất */
  orderBy?: ZaloCommentOrderBy;
  status?: ZaloCommentStatusFilter;
  ads?: ZaloCommentAdsFilter;
  cursor?: ZaloCommentListCursor | null;
  /** Legacy page/rows — bỏ qua khi dùng cursor Zalo */
  page?: number;
  rows?: number;
}): Promise<ZaloPublicCommentListResponse> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    return { results: [], count: 0, hasMore: false, nextCursor: null };
  }

  const body: Record<string, unknown> = {
    clientCookie: session.clientCookie,
    proxy: session.proxy,
    orderBy: options.orderBy ?? 1,
    status: options.status ?? 0,
    ads: options.ads ?? 0,
  };

  if (options.cursor?.prevCmtId) {
    body.prevCmtId = options.cursor.prevCmtId;
    if (options.cursor.prevVidId != null && options.cursor.prevVidId !== "") {
      body.prevVidId = options.cursor.prevVidId;
    }
    if (options.cursor.lastIndex != null) {
      body.lastIndex = options.cursor.lastIndex;
    }
  }

  const response = await fetch("/next-api/get_comment_public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error("Không tải được danh sách bình luận");
  }

  return (await response.json()) as ZaloPublicCommentListResponse;
}

export async function likePublicComment(options: {
  accountId: number;
  commentId: string | number;
  status: "like" | "unlike";
}): Promise<void> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    throw new Error("Chưa có phiên đăng nhập kênh video.");
  }

  const csrf = await ensureCsrfToken(options.accountId);

  const response = await fetch("/next-api/like_comment_public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      id_comment: options.commentId,
      csrf,
      status: options.status,
      proxy: session.proxy,
    }),
  });

  if (!response.ok) {
    throw new Error("Không thực hiện được thao tác thích bình luận");
  }
}

export async function deletePublicComment(options: {
  accountId: number;
  commentId: string | number;
}): Promise<void> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    throw new Error("Chưa có phiên đăng nhập kênh video.");
  }

  const csrf = await ensureCsrfToken(options.accountId);

  const response = await fetch("/next-api/delete_comments_video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      id_comment: options.commentId,
      csrf,
      proxy: session.proxy,
    }),
  });

  if (!response.ok) {
    throw new Error("Không xóa được bình luận");
  }
}

export async function replyPublicComment(options: {
  accountId: number;
  commentId: string | number;
  content: string;
  attachmentId?: string | number | null;
}): Promise<void> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    throw new Error("Chưa có phiên đăng nhập kênh video.");
  }

  const csrf = await ensureCsrfToken(options.accountId);
  const trimmed = options.content.trim();
  if (!trimmed) {
    throw new Error("Nội dung trả lời không được để trống.");
  }

  const response = await fetch("/next-api/post_reply_comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      csrf,
      id_attach: options.attachmentId ?? null,
      content: trimmed,
      id_cmt: options.commentId,
      proxy: session.proxy,
    }),
  });

  if (!response.ok) {
    throw new Error("Không gửi được trả lời bình luận");
  }
}
