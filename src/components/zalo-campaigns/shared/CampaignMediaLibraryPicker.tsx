"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { messageMediaService } from "@/services/message-media.service";
import type { SavedAlbum, SavedVideoDetail, SavedVideoListItem } from "@/types/message-media";
import { useCallback, useEffect, useState } from "react";
import {
  HiOutlineEye,
  HiOutlinePhotograph,
  HiOutlineTrash,
  HiOutlineVideoCamera,
} from "react-icons/hi";

type Mode = "video" | "album";

interface CampaignMediaLibraryPickerProps {
  mode: Mode;
  selectedId: number | null;
  disabled?: boolean;
  onSelect: (id: number | null) => void;
}

/**
 * Panel list video/album đã lưu — chọn / preview / xóa.
 * Reuse cho form campaign mess (§7.4).
 */
export default function CampaignMediaLibraryPicker({
  mode,
  selectedId,
  disabled = false,
  onSelect,
}: CampaignMediaLibraryPickerProps) {
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<SavedVideoListItem[]>([]);
  const [albums, setAlbums] = useState<SavedAlbum[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<SavedVideoDetail | null>(null);
  const [previewAlbum, setPreviewAlbum] = useState<SavedAlbum | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (mode === "video") {
        setVideos(await messageMediaService.listVideos());
      } else {
        setAlbums(await messageMediaService.listAlbums());
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVideos([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => {
    void load();
  }, [load]);

  const handlePreviewVideo = async (id: number) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewAlbum(null);
    try {
      setPreviewVideo(await messageMediaService.getVideo(id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handlePreviewAlbum = async (album: SavedAlbum) => {
    setPreviewOpen(true);
    setPreviewVideo(null);
    if (album.images?.length) {
      setPreviewAlbum(album);
      return;
    }
    setPreviewLoading(true);
    try {
      setPreviewAlbum(await messageMediaService.getAlbum(album.id));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteVideo = async (id: number) => {
    const ok = await confirm({
      title: "Xóa video?",
      message: "Video sẽ bị xóa khỏi thư viện. Không thể hoàn tác.",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await messageMediaService.deleteVideo(id);
      if (selectedId === id) onSelect(null);
      toast.success("Đã xóa video.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDeleteAlbum = async (id: number) => {
    const ok = await confirm({
      title: "Xóa album?",
      message: "Album và ảnh con sẽ bị xóa khỏi thư viện.",
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await messageMediaService.deleteAlbum(id);
      if (selectedId === id) onSelect(null);
      toast.success("Đã xóa album.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (mode === "video" && videos.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Chưa có video đã lưu — mở hộp chat, lưu media từ tin nhắn rồi quay lại.
      </p>
    );
  }

  if (mode === "album" && albums.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Chưa có album đã lưu — mở hộp chat, lưu album từ tin nhắn rồi quay lại.
      </p>
    );
  }

  return (
    <>
      <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
        {mode === "video"
          ? videos.map((item) => {
              const selected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                    selected
                      ? "bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5">
                      <HiOutlineVideoCamera size={18} />
                    </span>
                    <span className="min-w-0 truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.name_video || `#${item.id}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    title="Xem trước"
                    onClick={() => void handlePreviewVideo(item.id)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5"
                  >
                    <HiOutlineEye size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    title="Xóa"
                    onClick={() => void handleDeleteVideo(item.id)}
                    className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              );
            })
          : albums.map((item) => {
              const selected = selectedId === item.id;
              const cover = item.images?.[0]?.url || item.images?.[0]?.previewThumb;
              const count =
                item.images?.length ||
                Number(item.totalItemInGroup) ||
                0;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-2 transition ${
                    selected
                      ? "bg-brand-50 ring-1 ring-brand-300 dark:bg-brand-500/10 dark:ring-brand-500/40"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelect(item.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" className="size-full object-cover" />
                      ) : (
                        <HiOutlinePhotograph size={18} className="text-gray-500" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {item.name || `#${item.id}`}
                      </span>
                      <span className="text-theme-xs text-gray-500">
                        {count} ảnh
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    title="Xem trước"
                    onClick={() => void handlePreviewAlbum(item)}
                    className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5"
                  >
                    <HiOutlineEye size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    title="Xóa"
                    onClick={() => void handleDeleteAlbum(item.id)}
                    className="rounded-lg p-1.5 text-error-500 hover:bg-error-50 dark:hover:bg-error-500/10"
                  >
                    <HiOutlineTrash size={16} />
                  </button>
                </div>
              );
            })}
      </div>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        showCloseButton
        className="w-full max-w-lg"
        layer="top"
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            Xem trước
          </h3>
          {previewLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : previewVideo ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {previewVideo.name_video}
              </p>
              {previewVideo.thumb_url || previewVideo.video_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewVideo.thumb_url || previewVideo.video_url}
                  alt=""
                  className="max-h-72 w-full rounded-xl object-contain bg-black/5"
                />
              ) : null}
              <p className="text-xs text-gray-500">
                {previewVideo.duration
                  ? `${(previewVideo.duration / 1000).toFixed(1)}s`
                  : ""}{" "}
                · {previewVideo.width}×{previewVideo.height}
              </p>
              {previewVideo.video_url ? (
                <a
                  href={previewVideo.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Mở video
                </a>
              ) : null}
            </div>
          ) : previewAlbum ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {previewAlbum.name}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(previewAlbum.images ?? []).map((img, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id ?? `${img.url}-${index}`}
                    src={img.previewThumb || img.url}
                    alt=""
                    className="aspect-square rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">Không có dữ liệu xem trước.</p>
          )}
          <div className="mt-4 flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setPreviewOpen(false)}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
