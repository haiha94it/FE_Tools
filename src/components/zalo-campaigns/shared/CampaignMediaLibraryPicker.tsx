"use client";

import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { messageMediaService } from "@/services/message-media.service";
import type {
  SavedAlbum,
  SavedAlbumImage,
  SavedVideoDetail,
  SavedVideoListItem,
} from "@/types/message-media";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  HiOutlineArrowsExpand,
  HiOutlineEye,
  HiOutlinePhotograph,
  HiOutlineTrash,
  HiOutlineVideoCamera,
} from "react-icons/hi";

/** Cao hơn Modal layer=top (100001) — dùng theme z-999999 + inline để chắc chắn thắng stacking */
const ALBUM_LIGHTBOX_Z = 999999;

type Mode = "video" | "album";

interface CampaignMediaLibraryPickerProps {
  mode: Mode;
  selectedId: number | null;
  disabled?: boolean;
  onSelect: (id: number | null) => void;
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return "";
  const sec = Math.round(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}` : `${s}s`;
}

/**
 * Panel list video/album đã lưu — chọn / preview / xóa.
 * Video: play trong modal (controls + fullscreen native).
 * Album: mắt từng ảnh → lightbox phóng to.
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
  /** Ảnh album đang phóng to (lightbox) */
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [videoExpanded, setVideoExpanded] = useState(false);

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

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewVideo(null);
    setPreviewAlbum(null);
    setLightboxSrc(null);
    setVideoExpanded(false);
  };

  const handlePreviewVideo = async (id: number) => {
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewAlbum(null);
    setPreviewVideo(null);
    setLightboxSrc(null);
    setVideoExpanded(false);
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
    setLightboxSrc(null);
    setVideoExpanded(false);
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

  const openAlbumImage = (img: SavedAlbumImage) => {
    const src = img.url || img.previewThumb;
    if (src) setLightboxSrc(src);
  };

  /** Esc đóng lightbox trước, không đóng luôn modal Xem trước */
  useEffect(() => {
    if (!lightboxSrc) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      setLightboxSrc(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [lightboxSrc]);

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
              const cover =
                item.images?.[0]?.url || item.images?.[0]?.previewThumb;
              const count =
                item.images?.length || Number(item.totalItemInGroup) || 0;
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
                        <img
                          src={cover}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <HiOutlinePhotograph
                          size={18}
                          className="text-gray-500"
                        />
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

      {/* Modal xem video / album */}
      <Modal
        isOpen={previewOpen}
        onClose={() => {
          if (lightboxSrc) {
            setLightboxSrc(null);
            return;
          }
          closePreview();
        }}
        showCloseButton
        className={
          videoExpanded
            ? "w-full max-w-[min(96vw,1100px)]"
            : "w-full max-w-2xl"
        }
        layer="top"
      >
        <div className="flex max-h-[min(90dvh,820px)] flex-col p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-2 pr-10">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Xem trước
              </h3>
              {previewVideo ? (
                <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-300">
                  {previewVideo.name_video}
                </p>
              ) : null}
              {previewAlbum ? (
                <p className="mt-0.5 truncate text-sm text-gray-600 dark:text-gray-300">
                  {previewAlbum.name}
                </p>
              ) : null}
            </div>
            {previewVideo?.video_url ? (
              <button
                type="button"
                onClick={() => setVideoExpanded((v) => !v)}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:text-gray-300"
                title={videoExpanded ? "Thu nhỏ" : "Phóng to"}
              >
                <HiOutlineArrowsExpand size={14} />
                {videoExpanded ? "Thu nhỏ" : "Phóng to"}
              </button>
            ) : null}
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
            {previewLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : previewVideo?.video_url ? (
              <div className="space-y-2">
                <div
                  className={`overflow-hidden rounded-xl bg-black ${
                    videoExpanded
                      ? "min-h-[min(70dvh,640px)]"
                      : "min-h-[240px]"
                  }`}
                >
                  {/* Player trong modal — play/pause/seek/volume/fullscreen native */}
                  <video
                    key={previewVideo.video_url}
                    src={previewVideo.video_url}
                    poster={previewVideo.thumb_url || undefined}
                    controls
                    playsInline
                    preload="metadata"
                    className={`w-full bg-black object-contain ${
                      videoExpanded
                        ? "max-h-[min(70dvh,640px)]"
                        : "max-h-[min(50dvh,420px)]"
                    }`}
                  >
                    Trình duyệt không hỗ trợ phát video.
                  </video>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[
                    formatDuration(previewVideo.duration),
                    previewVideo.width && previewVideo.height
                      ? `${previewVideo.width}×${previewVideo.height}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {" · "}
                  Dùng nút fullscreen trên thanh player để xem toàn màn hình.
                </p>
              </div>
            ) : previewAlbum ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Bấm icon mắt trên từng ảnh để xem phóng to.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(previewAlbum.images ?? []).map((img, index) => {
                    const thumb = img.previewThumb || img.url;
                    return (
                      <div
                        key={img.id ?? `${img.url}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03]"
                      >
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt={`Ảnh ${index + 1}`}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-gray-400">
                            <HiOutlinePhotograph size={28} />
                          </div>
                        )}
                        <button
                          type="button"
                          title="Xem phóng to"
                          onClick={() => openAlbumImage(img)}
                          className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/35"
                        >
                          <span className="flex size-10 items-center justify-center rounded-full bg-white/95 text-gray-800 opacity-90 shadow-md transition group-hover:opacity-100 dark:bg-gray-900/95 dark:text-white">
                            <HiOutlineEye size={20} />
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
                {(previewAlbum.images ?? []).length === 0 ? (
                  <p className="py-8 text-center text-sm text-gray-500">
                    Album chưa có ảnh (đang đồng bộ…).
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-gray-500">
                Không có dữ liệu xem trước.
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end border-t border-gray-100 pt-3 dark:border-gray-800">
            <Button size="sm" variant="outline" onClick={closePreview}>
              Đóng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Portal body + z-999999 (theme) + inline zIndex — luôn trên Modal layer=top */}
      {lightboxSrc && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-999999 flex items-center justify-center bg-black/90 p-4 sm:p-8"
              style={{ zIndex: ALBUM_LIGHTBOX_Z }}
              role="dialog"
              aria-modal="true"
              aria-label="Xem ảnh phóng to"
              onClick={() => setLightboxSrc(null)}
            >
              <button
                type="button"
                onClick={() => setLightboxSrc(null)}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
                aria-label="Đóng"
              >
                ✕
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxSrc}
                alt="Ảnh phóng to"
                className="max-h-[calc(100vh-4rem)] max-w-[min(100vw-2rem,1200px)] rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
