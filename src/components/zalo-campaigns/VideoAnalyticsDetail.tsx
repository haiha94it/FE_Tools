"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import {
  deletePublicComment,
  likePublicComment,
  replyPublicComment,
} from "@/lib/zalo-video/comments-public-api";
import {
  fetchVideoAnalytics,
  fetchVideoParentComments,
  formatZaloTimestamp,
} from "@/lib/zalo-video/creator-public-api";
import { toast } from "@/lib/toast";
import type { ZaloPublicCommentItem, ZaloPublicVideoItem } from "@/types/zalo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEye,
  HiOutlineHeart,
  HiOutlineShare,
  HiOutlineTrash,
  HiOutlineXMark,
} from "react-icons/hi2";
import ZaloHlsPlayer from "./ZaloHlsPlayer";

interface VideoAnalyticsDetailProps {
  accountId: number;
  video: ZaloPublicVideoItem;
  onBack: () => void;
}

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pickNum(
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
): number | null {
  if (!obj) return null;
  for (const k of keys) {
    if (k in obj) {
      const n = num(obj[k]);
      if (n != null) return n;
    }
  }
  return null;
}

function pickStr(
  obj: Record<string, unknown> | null | undefined,
  keys: string[],
): string {
  if (!obj) return "";
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function deepGet(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const p of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

function commentLikeCount(c: ZaloPublicCommentItem): number {
  return (
    num(c.stats?.likes) ??
    num(c.likeCount) ??
    num(c.totalLike) ??
    num(c.likes) ??
    0
  ) as number;
}

function commentReplyCount(c: ZaloPublicCommentItem): number {
  return (
    num(c.stats?.replies) ??
    num(c.replyCount) ??
    num(c.totalReply) ??
    0
  ) as number;
}

function commentCreatedLabel(c: ZaloPublicCommentItem): string {
  const t = c.createdTime ?? c.created_time ?? c.time ?? c.timestamp;
  if (t == null) return "";
  return formatZaloTimestamp(Number(t));
}

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <Tooltip content={label} side="top">
      <span
        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold tabular-nums text-gray-700 dark:bg-white/[0.06] dark:text-gray-200"
        aria-label={`${label}: ${value.toLocaleString("vi-VN")}`}
      >
        <span className="text-gray-400" aria-hidden>
          {icon}
        </span>
        {value.toLocaleString("vi-VN")}
      </span>
    </Tooltip>
  );
}

/**
 * Viewer chi tiết video — thiết kế cho modal fixed-height.
 * Desktop: player | sidebar comments
 * Mobile: player trên (chiều cao cố định), comments dưới (scroll)
 */
export default function VideoAnalyticsDetail({
  accountId,
  video,
  onBack,
}: VideoAnalyticsDetailProps) {
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [commentList, setCommentList] = useState<ZaloPublicCommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [nextPrevCmtId, setNextPrevCmtId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [actionCmtId, setActionCmtId] = useState<string | number | null>(null);
  const commentsScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreLock = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      setCommentsLoading(true);
      setCommentList([]);
      setHasMoreComments(false);
      setNextPrevCmtId(null);
      void (async () => {
        try {
          const [a, c] = await Promise.allSettled([
            fetchVideoAnalytics(accountId, video.id),
            fetchVideoParentComments(accountId, video.id),
          ]);
          if (cancelled) return;
          if (a.status === "fulfilled") setInfo(a.value);
          else setInfo(null);
          if (c.status === "fulfilled") {
            setCommentList(c.value.results ?? []);
            setHasMoreComments(Boolean(c.value.hasMore));
            setNextPrevCmtId(c.value.nextPrevCmtId);
          } else {
            setCommentList([]);
            setHasMoreComments(false);
            setNextPrevCmtId(null);
          }
          if (a.status === "rejected") {
            toast.error("Không tải được chi tiết video");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setCommentsLoading(false);
          }
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [accountId, video.id]);

  const loadMoreComments = useCallback(async () => {
    if (!hasMoreComments || !nextPrevCmtId || loadMoreLock.current || loadingMore) {
      return;
    }
    loadMoreLock.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchVideoParentComments(accountId, video.id, {
        prevCmtId: nextPrevCmtId,
      });
      setCommentList((prev) => {
        const seen = new Set(prev.map((x) => String(x.id)));
        const added = (page.results ?? []).filter((x) => !seen.has(String(x.id)));
        return [...prev, ...added];
      });
      const more =
        Boolean(page.hasMore) &&
        Boolean(page.nextPrevCmtId) &&
        page.nextPrevCmtId !== nextPrevCmtId &&
        (page.results?.length ?? 0) > 0;
      setHasMoreComments(more);
      setNextPrevCmtId(more ? page.nextPrevCmtId : null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải thêm bình luận");
      setHasMoreComments(false);
    } finally {
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [accountId, video.id, hasMoreComments, nextPrevCmtId, loadingMore]);

  const onCommentsScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (nearBottom) void loadMoreComments();
    },
    [loadMoreComments],
  );

  useEffect(() => {
    const root = commentsScrollRef.current;
    const target = sentinelRef.current;
    if (!root || !target || !hasMoreComments) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          void loadMoreComments();
        }
      },
      { root, rootMargin: "80px", threshold: 0 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [hasMoreComments, loadMoreComments, commentList.length]);

  const handleLike = async (item: ZaloPublicCommentItem) => {
    const nextStatus = item.isLikedByAuthor ? "unlike" : "like";
    setActionCmtId(item.id);
    try {
      await likePublicComment({
        accountId,
        commentId: item.id,
        status: nextStatus,
      });
      setCommentList((prev) =>
        prev.map((c) => {
          if (c.id !== item.id) return c;
          const likes = commentLikeCount(c);
          const delta = nextStatus === "like" ? 1 : -1;
          const nextLikes = Math.max(0, likes + delta);
          return {
            ...c,
            isLikedByAuthor: !c.isLikedByAuthor,
            likeCount: nextLikes,
            likes: nextLikes,
            stats: { ...(c.stats ?? {}), likes: nextLikes },
          };
        }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lỗi thích bình luận");
    } finally {
      setActionCmtId(null);
    }
  };

  const handleDelete = async (item: ZaloPublicCommentItem) => {
    if (!window.confirm("Xóa bình luận này?")) return;
    setActionCmtId(item.id);
    try {
      await deletePublicComment({ accountId, commentId: item.id });
      setCommentList((prev) => prev.filter((c) => c.id !== item.id));
      toast.success("Đã xóa bình luận");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa bình luận thất bại");
    } finally {
      setActionCmtId(null);
    }
  };

  const handleSendReply = async (item: ZaloPublicCommentItem) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyPublicComment({
        accountId,
        commentId: item.id,
        content: replyText.trim(),
        attachmentId: video.id,
      });
      toast.success("Đã gửi phản hồi");
      setReplyingId(null);
      setReplyText("");
      setCommentList((prev) =>
        prev.map((c) => {
          if (c.id !== item.id) return c;
          const replies = commentReplyCount(c) + 1;
          return {
            ...c,
            isRepliedByAuthor: true,
            replyCount: replies,
            totalReply: replies,
            stats: { ...(c.stats ?? {}), replies },
          };
        }),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gửi phản hồi thất bại");
    } finally {
      setSendingReply(false);
    }
  };

  const merged = useMemo(() => {
    const base: Record<string, unknown> = { ...(info ?? {}) };
    const nested = deepGet(info, ["stats"]);
    if (nested && typeof nested === "object") {
      Object.assign(base, nested as object);
    }
    return base;
  }, [info]);

  const description =
    pickStr(merged, ["description", "desc", "caption", "title"]) ||
    video.description ||
    "Không có tiêu đề";

  const streamUrl =
    pickStr(merged, ["streamUrl", "stream_url", "playUrl", "play_url", "hlsUrl"]) ||
    pickStr(video as unknown as Record<string, unknown>, [
      "streamUrl",
      "stream_url",
      "playUrl",
    ]) ||
    "";

  const createdTime =
    pickNum(merged, ["createdTime", "created_time", "createTime"]) ??
    video.created_time ??
    video.createdTime;

  const views =
    pickNum(merged, ["views", "viewCount", "view_count", "totalViews"]) ??
    video.views ??
    0;
  const likes =
    pickNum(merged, ["likes", "likeCount", "like_count", "totalLikes"]) ??
    video.likes ??
    0;
  const comments =
    pickNum(merged, ["comments", "commentCount", "comment_count", "totalComments"]) ??
    video.comments ??
    0;
  const shares =
    pickNum(merged, ["shares", "shareCount", "share_count", "totalShares"]) ?? 0;

  const thumb =
    video.thumbnail || pickStr(merged, ["thumbnail", "thumb", "cover"]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-white dark:bg-gray-900">
      {/* Header bar */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-2 py-1.5 dark:border-gray-800 sm:px-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-gray-700 transition duration-150 hover:bg-gray-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:text-gray-200 dark:hover:bg-white/[0.05] dark:hover:text-brand-400"
        >
          <HiOutlineArrowLeft size={18} className="shrink-0" aria-hidden />
          <span className="hidden sm:inline">Quay lại danh sách</span>
          <span className="sm:hidden">Quay lại</span>
        </button>
        <Tooltip content="Đóng" side="left">
          <button
            type="button"
            onClick={onBack}
            aria-label="Đóng"
            className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-gray-400 transition duration-150 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <HiOutlineXMark size={22} aria-hidden />
          </button>
        </Tooltip>
      </header>

      {loading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <span className="size-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            <p className="text-sm text-gray-500">Đang tải chi tiết video…</p>
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,22rem)]">
          {/* —— Player —— */}
          <section
            aria-label="Trình phát video"
            className="relative min-h-0 bg-black max-lg:h-[min(42dvh,20rem)] max-lg:shrink-0 lg:h-auto"
          >
            <div className="absolute inset-0">
              <ZaloHlsPlayer
                streamUrl={streamUrl || null}
                poster={thumb || null}
                className="h-full w-full"
              />
            </div>
          </section>

          {/* —— Sidebar: caption + comments —— */}
          <section
            aria-label="Thông tin và bình luận"
            className="flex min-h-0 min-w-0 flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800 lg:border-l lg:border-t-0"
          >
            <div className="shrink-0 space-y-2.5 border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
              <p className="text-[11px] font-medium text-gray-400">
                {formatZaloTimestamp(createdTime ?? undefined)}
              </p>
              <p className="line-clamp-3 text-sm font-medium leading-relaxed text-gray-800 dark:text-white/90">
                {description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <StatChip
                  icon={<HiOutlineEye size={14} aria-hidden />}
                  value={views}
                  label="Lượt xem"
                />
                <StatChip
                  icon={<HiOutlineHeart size={14} aria-hidden />}
                  value={likes}
                  label="Lượt thích"
                />
                <StatChip
                  icon={<HiOutlineChatBubbleLeftRight size={14} aria-hidden />}
                  value={comments}
                  label="Bình luận"
                />
                <StatChip
                  icon={<HiOutlineShare size={14} aria-hidden />}
                  value={shares}
                  label="Chia sẻ"
                />
              </div>
            </div>

            <div className="flex shrink-0 items-center px-3 py-2 sm:px-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                Bình luận
                <span className="ml-1.5 text-xs font-semibold text-gray-400">
                  ({commentList.length || comments})
                </span>
              </h4>
            </div>

            <div
              ref={commentsScrollRef}
              onScroll={onCommentsScroll}
              className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 sm:px-4"
            >
              {commentsLoading ? (
                <div className="flex justify-center py-10">
                  <span className="size-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : commentList.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-400 dark:bg-gray-800">
                    <HiOutlineChatBubbleLeftRight size={18} aria-hidden />
                  </span>
                  <p className="text-xs text-gray-400">
                    Chưa có bình luận trên video này
                  </p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {commentList.map((c) => {
                    const name = c.owner?.info?.name || "Người dùng";
                    const avatar = c.owner?.info?.avatar || "";
                    const likeN = commentLikeCount(c);
                    const replyN = commentReplyCount(c);
                    const busy = actionCmtId === c.id;
                    const isReplying = replyingId === c.id;
                    return (
                      <li key={String(c.id)} className="space-y-2">
                        <div className="flex gap-2.5">
                          <div className="relative mt-0.5 size-9 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            {avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={avatar}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="flex h-full items-center justify-center text-[11px] font-bold text-gray-500">
                                {name[0]?.toUpperCase() ?? "?"}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {name}
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-gray-700 dark:text-gray-200">
                              {c.content || "—"}
                            </p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-gray-400">
                              <span>{commentCreatedLabel(c)}</span>
                              <button
                                type="button"
                                disabled={busy || sendingReply}
                                onClick={() => {
                                  if (isReplying) {
                                    setReplyingId(null);
                                    setReplyText("");
                                  } else {
                                    setReplyingId(c.id);
                                    setReplyText("");
                                  }
                                }}
                                className="min-h-8 cursor-pointer font-semibold text-gray-600 transition hover:text-brand-600 disabled:opacity-50 dark:text-gray-300 dark:hover:text-brand-400"
                              >
                                {isReplying ? "Hủy" : "Trả lời"}
                                {replyN > 0 ? ` (${replyN})` : ""}
                              </button>
                              <Tooltip content="Xóa bình luận" side="top">
                                <button
                                  type="button"
                                  disabled={busy}
                                  aria-label="Xóa bình luận"
                                  onClick={() => void handleDelete(c)}
                                  className="inline-flex min-h-8 cursor-pointer items-center gap-0.5 font-semibold text-error-500 transition hover:text-error-600 disabled:opacity-50"
                                >
                                  <HiOutlineTrash size={12} aria-hidden />
                                  Xóa
                                </button>
                              </Tooltip>
                              {c.isRepliedByAuthor ? (
                                <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                                  Đã trả lời
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <Tooltip
                            content={c.isLikedByAuthor ? "Bỏ thích" : "Thích"}
                            side="left"
                          >
                            <button
                              type="button"
                              disabled={busy}
                              aria-label={c.isLikedByAuthor ? "Bỏ thích" : "Thích"}
                              onClick={() => void handleLike(c)}
                              className="flex min-h-11 min-w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg text-gray-400 transition duration-150 hover:bg-gray-50 hover:text-error-500 disabled:opacity-50 dark:hover:bg-white/[0.04]"
                            >
                              {busy && actionCmtId === c.id ? (
                                <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <HiOutlineHeart
                                  size={16}
                                  className={
                                    c.isLikedByAuthor
                                      ? "fill-error-500 text-error-500"
                                      : ""
                                  }
                                  aria-hidden
                                />
                              )}
                              <span className="text-[10px] font-semibold tabular-nums">
                                {likeN}
                              </span>
                            </button>
                          </Tooltip>
                        </div>

                        {isReplying ? (
                          <div className="ml-11 space-y-2 rounded-xl border border-gray-200 bg-gray-50/80 p-2.5 dark:border-gray-700 dark:bg-gray-900/50">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              rows={2}
                              placeholder={`Trả lời ${name}…`}
                              disabled={sendingReply}
                              className="w-full resize-none rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-xs leading-relaxed outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                disabled={sendingReply}
                                onClick={() => {
                                  setReplyingId(null);
                                  setReplyText("");
                                }}
                                className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                disabled={sendingReply || !replyText.trim()}
                                onClick={() => void handleSendReply(c)}
                                className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
                              >
                                {sendingReply ? (
                                  <span className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                  "Gửi"
                                )}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                  <li aria-hidden className="list-none">
                    <div ref={sentinelRef} className="h-4 w-full" />
                  </li>
                </ul>
              )}
              {loadingMore ? (
                <div className="flex justify-center py-3">
                  <span className="size-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
