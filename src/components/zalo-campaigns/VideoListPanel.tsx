"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { fetchPublicVideoList } from "@/lib/zalo-video/public-api";
import type { ZaloPublicVideoItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";
import { HiOutlinePlay, HiOutlineSquares2X2 } from "react-icons/hi2";
import VideoAnalyticsDetail from "./VideoAnalyticsDetail";

interface VideoListPanelProps {
  accountId: number;
}

const STATUS_OPTIONS = [
  { value: "public", label: "Công khai" },
  { value: "private", label: "Riêng tư" },
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

export default function VideoListPanel({ accountId }: VideoListPanelProps) {
  const [status, setStatus] = useState("public");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<ZaloPublicVideoItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [detailVideo, setDetailVideo] = useState<ZaloPublicVideoItem | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ROWS_PER_PAGE));

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPublicVideoList({
        accountId,
        page,
        rows: ROWS_PER_PAGE,
        status: status as "public" | "private",
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
    // setTimeout: tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect)
    const timer = window.setTimeout(() => {
      void loadVideos();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadVideos]);

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setPage(1);
    setDetailVideo(null);
  };

  /** Chi tiết: fill parent flex (overflow-hidden chain từ VideoCreatorView) */
  if (detailVideo) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 sm:p-3">
        <VideoAnalyticsDetail
          key={String(detailVideo.id)}
          accountId={accountId}
          video={detailVideo}
          onBack={() => setDetailVideo(null)}
        />
      </div>
    );
  }

  /** List: cuộn trong panel, không đẩy layout shell */
  return (
    <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
      <ComponentCard
        title="Quản lý video"
        desc="Danh sách video trên kênh Zalo — bấm video để xem & phát"
        hideDescOnMobile
      >
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            className="h-11 w-full cursor-pointer rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:py-2 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03]"
          >
            {loading ? "Đang tải…" : "↻ Làm mới"}
          </button>
        </div>

        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <span className="size-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Đang tải danh sách video…</p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
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
              {videos.map((video) => (
                <article
                  key={String(video.id)}
                  className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition duration-200 hover:border-brand-200 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/30"
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailVideo(video)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailVideo(video);
                      }
                    }}
                    className="relative aspect-[9/16] cursor-pointer overflow-hidden bg-gray-100 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-gray-800 dark:focus-visible:ring-offset-gray-900"
                    aria-label={`Xem video: ${video.description?.trim() || "Không có mô tả"}`}
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
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition duration-200 group-hover:bg-black/30">
                      <span className="flex size-11 items-center justify-center rounded-full bg-black/55 text-white opacity-70 shadow-theme-md ring-1 ring-white/20 transition duration-200 group-hover:scale-105 group-hover:opacity-100">
                        <HiOutlinePlay size={22} className="ml-0.5" aria-hidden />
                      </span>
                    </div>
                    {video.isPinned && (
                      <span className="absolute left-2 top-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Ghim
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5 p-2.5">
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-gray-800 dark:text-white/90">
                      {truncateText(video.description?.trim() || "Không có mô tả")}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                      <span>{formatCount(video.views)} xem</span>
                      <span>{formatCount(video.likes)} thích</span>
                      <span>{formatCount(video.comments)} BL</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
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
    </div>
  );
}
