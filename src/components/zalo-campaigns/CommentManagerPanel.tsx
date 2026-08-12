"use client";

import { VIDEO_CREATOR_BASE } from "@/config/api";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  decodeHtmlEntities,
  deletePublicComment,
  fetchPublicCommentList,
  likePublicComment,
  replyPublicComment,
  type ZaloCommentAdsFilter,
  type ZaloCommentOrderBy,
  type ZaloCommentStatusFilter,
} from "@/lib/zalo-video/comments-public-api";
import { refreshCsrfToken } from "@/lib/zalo-video/session";
import { zaloVideoService } from "@/services/zalo-video.service";
import type {
  ZaloCommentListCursor,
  ZaloPublicCommentItem,
} from "@/types/zalo-video";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  HiChevronDown,
  HiOutlineChatBubbleLeftRight,
  HiOutlineHeart,
  HiOutlinePaperAirplane,
  HiOutlinePlay,
  HiOutlineTrash,
  HiOutlineVideoCamera,
} from "react-icons/hi2";

interface CommentManagerPanelProps {
  accountId: number;
}

const ORDER_OPTIONS: { value: ZaloCommentOrderBy; label: string }[] = [
  { value: 1, label: "Bình luận mới nhất" },
  { value: 2, label: "Video mới nhất" },
];

const STATUS_OPTIONS: { value: ZaloCommentStatusFilter; label: string }[] = [
  { value: 0, label: "Tất cả bình luận" },
  { value: 1, label: "Bình luận chưa trả lời" },
];

const VIDEO_SCOPE_OPTIONS: { value: ZaloCommentAdsFilter; label: string }[] = [
  { value: 0, label: "Tất cả video" },
  { value: 1, label: "Video đang chạy quảng cáo" },
];

function formatCommentDateShort(raw?: number | null): string {
  if (raw == null || raw === 0 || Number.isNaN(Number(raw))) return "";
  let ms = Number(raw);
  if (ms < 1e12) ms *= 1000;
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function pickCommentTimestamp(item: ZaloPublicCommentItem): number | undefined {
  const candidates = [
    item.createdTime,
    item.created_time,
    item.time,
    item.timestamp,
    item.parent?.createdTime,
    item.parent?.created_time,
  ];
  for (const c of candidates) {
    if (c != null && Number(c) > 0) return Number(c);
  }
  return undefined;
}

function isPinned(item: ZaloPublicCommentItem): boolean {
  return Boolean(item.is_pinned || item.isPinned);
}

function PillSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative inline-flex min-w-0">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-full border border-gray-200 bg-white py-1.5 pl-3.5 pr-8 text-xs font-semibold text-gray-800 outline-none transition hover:border-gray-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-600"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <HiChevronDown
        size={14}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
        aria-hidden
      />
    </div>
  );
}

/**
 * Bình luận kênh — layout Care3/Creator (TailAdmin):
 * thumb video | badge + ngày · avatar + tên · text · Thích/Trả lời/Xóa
 */
export default function CommentManagerPanel({
  accountId,
}: CommentManagerPanelProps) {
  const router = useRouter();
  const [comments, setComments] = useState<ZaloPublicCommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [replyingId, setReplyingId] = useState<string | number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [likingId, setLikingId] = useState<string | number | null>(null);

  const [orderBy, setOrderBy] = useState<ZaloCommentOrderBy>(1);
  const [statusFilter, setStatusFilter] = useState<ZaloCommentStatusFilter>(0);
  const [adsFilter, setAdsFilter] = useState<ZaloCommentAdsFilter>(0);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<ZaloCommentListCursor | null>(
    null,
  );

  const loadMoreLock = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const openVideoDetail = (item: ZaloPublicCommentItem) => {
    const vid = item.video?.id;
    if (vid == null || vid === "") {
      toast.error("Không có id video gắn bình luận này");
      return;
    }
    const params = new URLSearchParams();
    params.set("video", String(vid));
    if (item.video?.thumbnail) {
      params.set("thumb", item.video.thumbnail);
    }
    const title = (
      item.video?.description ||
      item.video?.title ||
      ""
    ).trim();
    if (title) {
      params.set("title", title.slice(0, 200));
    }
    router.push(
      `${VIDEO_CREATOR_BASE}/${accountId}/video-manager?${params.toString()}`,
    );
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    loadMoreLock.current = false;
    try {
      const res = await fetchPublicCommentList({
        accountId,
        orderBy,
        status: statusFilter,
        ads: adsFilter,
      });
      const batch = res.results ?? [];
      setComments(batch);
      setHasMore(Boolean(res.hasMore && res.nextCursor));
      setNextCursor(res.nextCursor ?? null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setComments([]);
      setHasMore(false);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [accountId, orderBy, statusFilter, adsFilter]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loading || loadingMore || loadMoreLock.current)
      return;
    loadMoreLock.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchPublicCommentList({
        accountId,
        orderBy,
        status: statusFilter,
        ads: adsFilter,
        cursor: nextCursor,
      });
      const batch = res.results ?? [];
      if (batch.length === 0) {
        setHasMore(false);
        setNextCursor(null);
        return;
      }
      setComments((prev) => {
        const seen = new Set(prev.map((c) => String(c.id)));
        const added = batch.filter((c) => !seen.has(String(c.id)));
        return [...prev, ...added];
      });
      setHasMore(Boolean(res.hasMore && res.nextCursor));
      setNextCursor(res.nextCursor ?? null);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setHasMore(false);
    } finally {
      setLoadingMore(false);
      loadMoreLock.current = false;
    }
  }, [
    accountId,
    orderBy,
    statusFilter,
    adsFilter,
    hasMore,
    nextCursor,
    loading,
    loadingMore,
  ]);

  useEffect(() => {
    void refreshCsrfToken(accountId);
  }, [accountId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          void loadMore();
        }
      },
      { root: null, rootMargin: "120px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, comments.length]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await zaloVideoService.renewComments(accountId);
      toast.success("Làm mới bình luận thành công");
      await loadData();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setRenewing(false);
    }
  };

  const handleLike = async (item: ZaloPublicCommentItem) => {
    const nextStatus = item.isLikedByAuthor ? "unlike" : "like";
    setLikingId(item.id);
    try {
      await likePublicComment({
        accountId,
        commentId: item.id,
        status: nextStatus,
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === item.id
            ? { ...c, isLikedByAuthor: !c.isLikedByAuthor }
            : c,
        ),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLikingId(null);
    }
  };

  const handleDelete = async (item: ZaloPublicCommentItem) => {
    if (!window.confirm("Xóa bình luận này? Hành động không thể hoàn tác.")) {
      return;
    }
    try {
      await deletePublicComment({ accountId, commentId: item.id });
      setComments((prev) => prev.filter((c) => c.id !== item.id));
      toast.success("Đã xóa bình luận");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleSendReply = async (item: ZaloPublicCommentItem) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyPublicComment({
        accountId,
        commentId: item.id,
        content: replyText,
      });
      toast.success("Đã gửi trả lời");
      setReplyingId(null);
      setReplyText("");
      setComments((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, isRepliedByAuthor: true } : c,
        ),
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-4">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-gray-900 dark:text-white">
            Bình luận
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {comments.length > 0
              ? `Đã tải ${comments.length} bình luận${hasMore ? " · cuộn để xem thêm" : ""}`
              : "Quản lý bình luận kênh Zalo Video"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={loading || renewing}
            onClick={() => void loadData()}
            className="h-9 rounded-full border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            {loading ? "Đang tải…" : "Tải lại"}
          </button>
          <button
            type="button"
            disabled={loading || renewing}
            onClick={() => void handleRenew()}
            className="h-9 rounded-full bg-brand-500 px-3 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-50"
          >
            {renewing ? "Đang làm mới…" : "Làm mới"}
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <PillSelect
          value={String(orderBy)}
          disabled={loading}
          options={ORDER_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) => setOrderBy(Number(v) === 2 ? 2 : 1)}
        />
        <PillSelect
          value={String(statusFilter)}
          disabled={loading}
          options={STATUS_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) => setStatusFilter(Number(v) === 1 ? 1 : 0)}
        />
        <PillSelect
          value={String(adsFilter)}
          disabled={loading}
          options={VIDEO_SCOPE_OPTIONS.map((o) => ({
            value: String(o.value),
            label: o.label,
          }))}
          onChange={(v) => setAdsFilter(Number(v) === 1 ? 1 : 0)}
        />
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-gray-800 dark:bg-gray-950/40">
          <HiOutlineChatBubbleLeftRight
            size={28}
            className="mb-2 text-gray-400"
            aria-hidden
          />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Không có bình luận
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Thử đổi bộ lọc hoặc làm mới danh sách
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {comments.map((item) => {
            const hasParent = Boolean(
              item.parent?.content || item.parent?.owner,
            );
            const viewerName =
              (hasParent
                ? item.parent?.owner?.info?.name
                : item.owner?.info?.name) || "Người dùng Zalo";
            const viewerAvatar =
              (hasParent
                ? item.parent?.owner?.info?.avatar
                : item.owner?.info?.avatar) || "";
            const viewerTextRaw = hasParent
              ? item.parent?.content || item.content || ""
              : item.content || "";
            const viewerText = decodeHtmlEntities(viewerTextRaw);
            const replyTextDecoded = decodeHtmlEntities(item.content || "");
            const isReplying = replyingId === item.id;
            const thumb = item.video?.thumbnail;
            const dateStr = formatCommentDateShort(
              pickCommentTimestamp(item),
            );
            const pinned = isPinned(item);
            const replied = Boolean(
              item.isRepliedByAuthor || item.parent?.isRepliedByAuthor,
            );
            const liking = likingId === item.id;

            return (
              <article
                key={String(item.id)}
                className="flex gap-3 py-3.5 first:pt-1 sm:gap-4"
              >
                {/* Thumbnail video */}
                <button
                  type="button"
                  onClick={() => openVideoDetail(item)}
                  title="Xem video"
                  className="group relative h-[72px] w-[54px] shrink-0 overflow-hidden rounded-lg bg-gray-200 outline-none ring-1 ring-gray-200/80 transition hover:ring-2 hover:ring-brand-400 focus-visible:ring-2 focus-visible:ring-brand-500 dark:bg-gray-800 dark:ring-gray-700 sm:h-[88px] sm:w-[66px]"
                >
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <HiOutlineVideoCamera size={18} aria-hidden />
                    </div>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
                      <HiOutlinePlay
                        size={12}
                        className="ml-0.5 fill-current"
                        aria-hidden
                      />
                    </span>
                  </span>
                </button>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-500 dark:text-orange-400">
                      <HiOutlineChatBubbleLeftRight
                        size={12}
                        className="shrink-0"
                        aria-hidden
                      />
                      Bình luận
                    </span>
                    {dateStr ? (
                      <span className="text-[11px] font-medium text-gray-400">
                        {dateStr}
                      </span>
                    ) : null}
                    {pinned ? (
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
                        Ghim
                      </span>
                    ) : null}
                    {replied ? (
                      <span className="rounded bg-success-50 px-1.5 py-0.5 text-[10px] font-bold text-success-600 dark:bg-success-500/15 dark:text-success-300">
                        Đã trả lời
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="relative mt-0.5 size-8 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                      {viewerAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={viewerAvatar}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[11px] font-bold text-gray-500">
                          {viewerName[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {viewerName}
                      </p>
                      <p className="mt-0.5 break-words text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                        {viewerText || "—"}
                      </p>

                      {hasParent &&
                      item.content &&
                      item.content !== item.parent?.content ? (
                        <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 dark:border-gray-800 dark:bg-gray-950/50">
                          <p className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                            {item.owner?.info?.name || "Bạn"} · phản hồi
                          </p>
                          <p className="mt-0.5 break-words text-sm text-gray-600 dark:text-gray-300">
                            {replyTextDecoded}
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={liking}
                          onClick={() => void handleLike(item)}
                          className={`inline-flex items-center gap-1 text-xs font-semibold transition disabled:opacity-50 ${
                            item.isLikedByAuthor
                              ? "text-error-500"
                              : "text-gray-500 hover:text-error-500 dark:text-gray-400"
                          }`}
                        >
                          <HiOutlineHeart
                            size={14}
                            className={
                              item.isLikedByAuthor ? "fill-current" : ""
                            }
                            aria-hidden
                          />
                          Thích
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingId(isReplying ? null : item.id);
                            setReplyText("");
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400"
                        >
                          <HiOutlineChatBubbleLeftRight size={14} aria-hidden />
                          {isReplying ? "Hủy" : "Trả lời"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(item)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-error-500"
                        >
                          <HiOutlineTrash size={13} aria-hidden />
                          Xóa
                        </button>
                      </div>

                      {isReplying && (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Nhập câu trả lời…"
                            className="h-9 flex-1 rounded-full border border-gray-200 bg-white px-3.5 text-xs text-gray-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                          />
                          <button
                            type="button"
                            disabled={sendingReply || !replyText.trim()}
                            onClick={() => void handleSendReply(item)}
                            className="inline-flex h-9 items-center justify-center rounded-full bg-brand-500 px-3 text-white transition hover:bg-brand-600 disabled:opacity-50"
                            aria-label="Gửi trả lời"
                          >
                            <HiOutlinePaperAirplane size={14} aria-hidden />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          <div
            ref={sentinelRef}
            className="flex min-h-10 flex-col items-center justify-center gap-2 py-4"
          >
            {loadingMore ? (
              <p className="inline-flex items-center gap-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
                <span className="size-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                Đang tải thêm bình luận…
              </p>
            ) : hasMore ? (
              <button
                type="button"
                onClick={() => void loadMore()}
                className="text-xs font-bold text-brand-600 hover:underline dark:text-brand-400"
              >
                Tải thêm
              </button>
            ) : comments.length > 0 && !hasMore ? (
              <p className="text-[11px] font-medium text-gray-400">
                Đã hết bình luận
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
