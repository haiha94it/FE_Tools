"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { HiOutlineSquares2X2 } from "react-icons/hi2";
import Select from "@/components/form/Select";
import Pagination from "@/components/tables/Pagination";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { fetchPublicVideoList } from "@/lib/zalo-video/public-api";
import type { ZaloPublicVideoItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";

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
    void loadVideos();
  }, [loadVideos]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  return (
    <ComponentCard
      title="Quản lý video"
      desc="Danh sách video trên kênh Zalo"
      hideDescOnMobile
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-[180px]">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={setStatus}
          />
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadVideos()}
          className="h-11 w-full rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:py-2 dark:border-gray-700 dark:text-gray-300"
        >
          {loading ? "Đang tải…" : "↻ Làm mới"}
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-gray-500">Đang tải danh sách video…</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <HiOutlineSquares2X2 size={20} className="shrink-0 text-gray-400" aria-hidden />
          </span>
          <p className="text-sm text-gray-500">Chưa có video nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
            {videos.map((video) => (
              <article
                key={String(video.id)}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:border-brand-200 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-500/30"
              >
                <div className="relative aspect-[9/16] overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <HiOutlineSquares2X2 size={24} className="shrink-0 text-gray-300" aria-hidden />
                    </div>
                  )}
                  {video.isPinned && (
                    <span className="absolute left-2 top-2 rounded-md bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Ghim
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 p-2.5">
                  <p className="line-clamp-2 text-xs font-medium text-gray-800 dark:text-white/90">
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
  );
}