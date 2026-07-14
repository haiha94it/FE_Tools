import {
  ensureCsrfToken,
  getAccountSession,
} from "@/lib/zalo-video/session";
import type { ZaloPublicCommentListResponse } from "@/types/zalo-video";

export async function fetchPublicCommentList(options: {
  accountId: number;
  page?: number;
  rows?: number;
}): Promise<ZaloPublicCommentListResponse> {
  const session = getAccountSession(options.accountId);
  if (!session?.clientCookie) {
    return { results: [], count: 0 };
  }

  const response = await fetch("/next-api/get_comment_public", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientCookie: session.clientCookie,
      number_per_page: options.rows ?? 50,
      page: options.page ?? 1,
      proxy: session.proxy,
    }),
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