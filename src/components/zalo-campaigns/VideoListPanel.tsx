"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  deletePublicVideo,
  isVideoContactEnabled,
  isVideoPinned,
  pinChannelVideo,
  updateVideoContactCta,
} from "@/lib/zalo-video/creator-public-api";
import { fetchPublicVideoList } from "@/lib/zalo-video/public-api";
import type { ZaloPublicVideoItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineChartBar,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlinePlay,
  HiOutlineSquares2X2,
  HiOutlineTrash,
} from "react-icons/hi2";
import VideoAnalyticsDetail, {
  type VideoListStatusFilter,
} from "./VideoAnalyticsDetail";

interface VideoListPanelProps {
  accountId: number;
}

/** Query deep-link từ Bình luận — không dùng useSearchParams (tránh Suspense). */
function readFocusVideoFromUrl(): {
  id: string | null;
  thumb: string | null;
  title: string | null;
} {
  if (typeof window === "undefined") {
    return { id: null, thumb: null, title: null };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    id: sp.get("video"),
    thumb: sp.get("thumb"),
    title: sp.get("title"),
  };
}

const STATUS_OPTIONS = [
  { value: "public", label: "Công khai" },
  { value: "private", label: "Riêng tư" },
  { value: "scheduled", label: "Đã đặt lịch" },
];

const ROWS_PER_PAGE = 24;

function formatCount(value?: number) {
  if (value == null) return "0";
  return value.toLocaleString("vi-VN");
}

function truncateText(text: string, max = 80) {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/**
 * Danh sách video Care2 grid + action overlay (Ghim / Liên hệ / Phân tích / Xóa).
 * Giữ layout gọn — không copy card dày Care3.
 */
export default function VideoListPanel({ accountId }: VideoListPanelProps) {
  const [status, setStatus] = useState<VideoListStatusFilter>("public");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<ZaloPublicVideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [detailVideo, setDetailVideo] = useState<ZaloPublicVideoItem | null>(
    null,
  );
  const [busyId, setBusyId] = useState<string | number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicVideoList({
        accountId,
        page,
        rows: ROWS_PER_PAGE,
        status,
      });
      setVideos(data.results ?? []);
      setTotalCount(data.count ?? data.results?.length ?? 0);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVideos([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accountId, page, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadVideos();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVideos]);

  /**
   * Deep-link từ Bình luận: ?video=id — mở modal viewer Care2 hiện có.
   */
  useEffect(() => {
    const { id, thumb, title } = readFocusVideoFromUrl();
    if (!id) return;

    const fromList = videos.find((v) => String(v.id) === String(id));
    if (fromList) {
      setDetailVideo(fromList);
      return;
    }

    if (!loading) {
      setDetailVideo((prev) => {
        if (prev && String(prev.id) === String(id)) return prev;
        return {
          id,
          thumbnail: thumb || undefined,
          description: title || undefined,
        };
      });
    }
  }, [videos, loading]);

  const handleStatusChange = (value: string) => {
    setStatus(value as VideoListStatusFilter);
    setPage(1);
    setDetailVideo(null);
  };

  const closeDetail = () => setDetailVideo(null);

  const handleVideoPatched = useCallback((next: ZaloPublicVideoItem) => {
    setVideos((prev) =>
      prev.map((v) =>
        String(v.id) === String(next.id) ? { ...v, ...next } : v,
      ),
    );
    setDetailVideo((prev) =>
      prev && String(prev.id) === String(next.id) ? { ...prev, ...next } : prev,
    );
  }, []);

  const handleVideoDeleted = useCallback((videoId: string | number) => {
    setVideos((prev) => prev.filter((v) => String(v.id) !== String(videoId)));
    setTotalCount((c) => Math.max(0, c - 1));
    setDetailVideo(null);
  }, []);

  const handleTogglePin = async (video: ZaloPublicVideoItem) => {
    const pinned = isVideoPinned(video);
    setBusyId(video.id);
    try {
      await pinChannelVideo({
        accountId,
        videoId: video.id,
        pin: !pinned,
      });
      handleVideoPatched({
        ...video,
        isPinned: !pinned,
        is_pinned: !pinned,
      });
      toast.success(pinned ? "Đã bỏ ghim" : "Đã ghim video");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ghim thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleContact = async (video: ZaloPublicVideoItem) => {
    const on = isVideoContactEnabled(video);
    setBusyId(video.id);
    try {
      await updateVideoContactCta({
        accountId,
        videoId: video.id,
        enabled: !on,
      });
      handleVideoPatched({
        ...video,
        isContactEnabled: !on,
        is_contact_enabled: !on,
        contactEnabled: !on,
      });
      toast.success(on ? "Đã tắt nút liên hệ" : "Đã bật nút liên hệ");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Cập nhật liên hệ thất bại");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (video: ZaloPublicVideoItem) => {
    if (
      !window.confirm(
        status === "scheduled"
          ? "Xóa video đã đặt lịch này?"
          : "Xóa video khỏi kênh?",
      )
    ) {
      return;
    }
    setBusyId(video.id);
    try {
      await deletePublicVideo({ accountId, videoId: video.id });
      handleVideoDeleted(video.id);
      toast.success(
        status === "scheduled" ? "Đã xóa video đặt lịch" : "Đã xóa video",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xóa thất bại");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <ComponentCard
        title="Quản lý video"
        desc="Hover card → Ghim · Liên hệ · Phân tích · Xóa. Click thumbnail mở viewer."
        hideDescOnMobile
      >
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full sm:max-w-[180px]">
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={handleStatusChange}
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void loadVideos()}
            className="h-9 w-full cursor-pointer rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            {loading ? "Đang tải…" : "↻ Làm mới"}
          </button>
        </div>

        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-2">
              <span className="size-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Đang tải danh sách video…</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
              <HiOutlineSquares2X2
                size={20}
                className="shrink-0 text-gray-400"
                aria-hidden
              />
            </span>
            <p className="text-sm text-gray-500">Chưa có video nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {videos.map((video) => {
                const pinned = isVideoPinned(video);
                const contactOn = isVideoContactEnabled(video);
                const busy = busyId === video.id;
                const title =
                  video.description?.trim() ||
                  video.title?.trim() ||
                  "Không có mô tả";

                return (
                  <article
                    key={String(video.id)}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:border-brand-200 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/30"
                  >
                    <div className="relative aspect-[9/16] overflow-hidden bg-gray-100 dark:bg-gray-800">
                      <button
                        type="button"
                        onClick={() => setDetailVideo(video)}
                        className="absolute inset-0 z-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
                        aria-label={`Xem video: ${title}`}
                      >
                        {video.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="h-full w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <HiOutlineSquares2X2
                              size={24}
                              className="shrink-0 text-gray-300"
                              aria-hidden
                            />
                          </div>
                        )}
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/25">
                          <span className="flex size-10 items-center justify-center rounded-full bg-black/55 text-white opacity-60 ring-1 ring-white/20 transition group-hover:opacity-100">
                            <HiOutlinePlay
                              size={20}
                              className="ml-0.5"
                              aria-hidden
                            />
                          </span>
                        </span>
                      </button>

                      {pinned && (
                        <span className="pointer-events-none absolute left-1.5 top-1.5 z-[1] rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Ghim
                        </span>
                      )}
                      {status === "scheduled" && (
                        <span className="pointer-events-none absolute right-1.5 top-1.5 z-[1] rounded-md bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          Lịch
                        </span>
                      )}

                      {/* Action bar — luôn mờ, rõ khi hover / focus-within */}
                      <div
                        className="absolute inset-x-0 bottom-0 z-[2] flex items-center justify-center gap-1 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-1.5 pb-2 pt-8 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {status !== "scheduled" ? (
                          <>
                            <Tooltip
                              content={pinned ? "Bỏ ghim" : "Ghim"}
                              side="top"
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleTogglePin(video)}
                                className={`inline-flex size-8 items-center justify-center rounded-full text-white shadow-sm transition disabled:opacity-50 ${
                                  pinned
                                    ? "bg-brand-500"
                                    : "bg-black/55 hover:bg-black/75"
                                }`}
                                aria-label={pinned ? "Bỏ ghim" : "Ghim"}
                              >
                                <HiOutlineMapPin size={15} aria-hidden />
                              </button>
                            </Tooltip>
                            <Tooltip
                              content={
                                contactOn ? "Tắt liên hệ" : "Bật liên hệ"
                              }
                              side="top"
                            >
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => void handleToggleContact(video)}
                                className={`inline-flex size-8 items-center justify-center rounded-full text-white shadow-sm transition disabled:opacity-50 ${
                                  contactOn
                                    ? "bg-success-500"
                                    : "bg-black/55 hover:bg-black/75"
                                }`}
                                aria-label={
                                  contactOn ? "Tắt liên hệ" : "Bật liên hệ"
                                }
                              >
                                <HiOutlinePhone size={15} aria-hidden />
                              </button>
                            </Tooltip>
                          </>
                        ) : null}
                        <Tooltip content="Phân tích / xem" side="top">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setDetailVideo(video)}
                            className="inline-flex size-8 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75 disabled:opacity-50"
                            aria-label="Phân tích video"
                          >
                            <HiOutlineChartBar size={15} aria-hidden />
                          </button>
                        </Tooltip>
                        <Tooltip content="Xóa" side="top">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleDelete(video)}
                            className="inline-flex size-8 items-center justify-center rounded-full bg-error-500/90 text-white shadow-sm transition hover:bg-error-600 disabled:opacity-50"
                            aria-label="Xóa video"
                          >
                            <HiOutlineTrash size={15} aria-hidden />
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    <div className="space-y-1 p-2 sm:p-2.5">
                      <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-800 dark:text-white/90">
                        {truncateText(title)}
                      </p>
                      <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                        {status !== "scheduled" ? (
                          <>
                            <span>{formatCount(video.views)} xem</span>
                            <span>{formatCount(video.likes)} thích</span>
                            <span>{formatCount(video.comments)} BL</span>
                          </>
                        ) : (
                          <span>Chờ đăng</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </ComponentCard>

      <Modal
        isOpen={detailVideo != null}
        onClose={closeDetail}
        showCloseButton={false}
        className="!max-h-[min(92dvh,900px)] !w-full !max-w-[min(1120px,calc(100vw-1rem))] !overflow-hidden !rounded-2xl !p-0 sm:!max-w-[min(1120px,calc(100vw-2rem))]"
      >
        {detailVideo ? (
          <div className="flex h-[min(88dvh,860px)] max-h-[min(88dvh,860px)] w-full flex-col sm:h-[min(90dvh,880px)] sm:max-h-[min(90dvh,880px)]">
            <VideoAnalyticsDetail
              key={String(detailVideo.id)}
              accountId={accountId}
              video={detailVideo}
              listStatus={status}
              onBack={closeDetail}
              onVideoPatched={handleVideoPatched}
              onVideoDeleted={handleVideoDeleted}
            />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
