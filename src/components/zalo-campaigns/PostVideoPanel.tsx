"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { VIDEO_CREATOR_BASE } from "@/config/api";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  buildDownloadedVideoPreviewUrl,
  dataUrlToBlob,
  formatZaloVideoPublishTime,
  generateVideoThumbnails,
  isAllowedVideoFile,
  MAX_VIDEO_FILE_BYTES,
} from "@/lib/zalo-video-utils";
import {
  getVideoTaskErrorMessage,
  isVideoTaskBusinessSuccess,
} from "@/lib/zalo-video/task-utils";
import { zaloVideoService } from "@/services/zalo-video.service";
import type { VideoThumbnailItem } from "@/types/zalo-video";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

interface PostVideoPanelProps {
  accountId: number;
}

export default function PostVideoPanel({ accountId }: PostVideoPanelProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [serverVideoPath, setServerVideoPath] = useState("");
  const [thumbnails, setThumbnails] = useState<VideoThumbnailItem[]>([]);
  const [selectedThumb, setSelectedThumb] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleAt, setScheduleAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30);
    return now.toISOString().slice(0, 16);
  });

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingLink, setDownloadingLink] = useState(false);
  const [posting, setPosting] = useState(false);

  const resetVideoState = () => {
    setThumbnails([]);
    setSelectedThumb(null);
    setServerVideoPath("");
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;

    if (!isAllowedVideoFile(file)) {
      toast.error("Chỉ chấp nhận định dạng .mp4 hoặc .mov");
      return;
    }
    if (file.size > MAX_VIDEO_FILE_BYTES) {
      toast.error("Dung lượng vượt quá 500MB");
      return;
    }

    resetVideoState();
    setVideoPreviewUrl(URL.createObjectURL(file));
    setUploadingFile(true);

    try {
      const path = await zaloVideoService.uploadVideoFile(file);
      setServerVideoPath(path);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVideoPreviewUrl(null);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleVideoMetadata = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const items = await generateVideoThumbnails(video);
      setThumbnails(items);
      if (items[0]) setSelectedThumb(items[0].thumb);
    } catch {
      toast.error("Không tạo được ảnh bìa từ video");
    }
  };

  const handleScanLink = async () => {
    if (!linkUrl.trim()) {
      toast.warning("Nhập link video TikTok hoặc Facebook");
      return;
    }

    setDownloadingLink(true);
    resetVideoState();

    try {
      const result = await zaloVideoService.downloadVideoFromLink(linkUrl.trim());
      const path = result.data?.path;
      if (!path || !isVideoTaskBusinessSuccess(result)) {
        toast.error(getVideoTaskErrorMessage(result));
        return;
      }

      setServerVideoPath(path);
      setVideoPreviewUrl(buildDownloadedVideoPreviewUrl(path));
      toast.success("Đã quét video từ link");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingLink(false);
    }
  };

  const handlePost = async () => {
    if (!serverVideoPath) {
      toast.warning("Chưa có video để đăng");
      return;
    }
    if (!selectedThumb) {
      toast.warning("Chọn ảnh bìa trước khi đăng");
      return;
    }

    const thumbBlob = dataUrlToBlob(selectedThumb);
    if (!thumbBlob) {
      toast.error("Ảnh bìa không hợp lệ");
      return;
    }

    setPosting(true);
    try {
      const thumbnailPath = await zaloVideoService.uploadThumbnailBlob(thumbBlob);
      const publishTime = scheduleEnabled
        ? formatZaloVideoPublishTime(new Date(scheduleAt))
        : "";

      const result = await zaloVideoService.postVideo({
        id_account: accountId,
        thumbnail: thumbnailPath,
        video: serverVideoPath,
        caption,
        publish_time: publishTime,
      });

      if (isVideoTaskBusinessSuccess(result)) {
        toast.success("Đăng video thành công");
        router.push(`${VIDEO_CREATOR_BASE}/${accountId}/video-manager`);
      } else {
        toast.error(getVideoTaskErrorMessage(result));
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPosting(false);
    }
  };

  const isBusy = uploadingFile || downloadingLink || posting;

  return (
    <ComponentCard
      title="Đăng video mới"
      desc="Tải video từ máy hoặc quét từ link TikTok/Facebook"
      hideDescOnMobile
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60 sm:w-auto sm:py-2.5 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
            >
              Tải từ máy
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setShowLinkInput((v) => !v)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 sm:w-auto sm:py-2.5 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-300"
            >
              Quét từ link
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/quicktime,video/*"
              className="hidden"
              onChange={(e) => void handleFileChange(e.target.files?.[0])}
            />
          </div>

          {showLinkInput && (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Nhập link TikTok, Facebook…"
                className="h-11 flex-1 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <button
                type="button"
                disabled={downloadingLink}
                onClick={() => void handleScanLink()}
                className="h-11 w-full rounded-xl bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 sm:w-auto sm:py-2.5"
              >
                {downloadingLink ? "Đang quét…" : "Quét video"}
              </button>
            </div>
          )}

          {uploadingFile && (
            <p className="text-sm text-brand-600">Đang upload video lên server…</p>
          )}

          {videoPreviewUrl && (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-black/5 dark:border-gray-700">
              <video
                ref={videoRef}
                src={videoPreviewUrl}
                controls
                crossOrigin="anonymous"
                className="mx-auto max-h-[min(50vh,320px)] w-full object-contain"
                onLoadedMetadata={() => void handleVideoMetadata()}
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung video
            </label>
            <textarea
              value={caption}
              rows={4}
              maxLength={300}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Mô tả video (tối đa 300 ký tự)"
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-400">{caption.length}/300</p>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
            />
            Hẹn giờ đăng video
          </label>

          {scheduleEnabled && (
            <input
              type="datetime-local"
              value={scheduleAt}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm dark:border-gray-700 dark:bg-gray-900 sm:max-w-xs"
            />
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50/80 p-3 sm:p-4 dark:border-gray-800 dark:bg-gray-900/30 lg:sticky lg:top-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Ảnh bìa
          </p>

          {thumbnails.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {thumbnails.map((item) => (
                <button
                  key={item.time}
                  type="button"
                  onClick={() => setSelectedThumb(item.thumb)}
                  className={`shrink-0 overflow-hidden rounded-lg transition ${
                    selectedThumb === item.thumb
                      ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={item.thumb}
                    alt=""
                    className="h-[88px] w-[50px] object-cover"
                  />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400">
              Chọn video để tự động tạo ảnh bìa
            </p>
          )}

          {selectedThumb && (
            <div className="text-center">
              <img
                src={selectedThumb}
                alt="Ảnh bìa đã chọn"
                className="mx-auto h-[180px] w-[101px] rounded-xl object-cover shadow-theme-sm"
              />
            </div>
          )}

          <button
            type="button"
            disabled={!serverVideoPath || !selectedThumb || isBusy}
            onClick={() => void handlePost()}
            className="sticky bottom-0 z-10 mt-auto w-full rounded-xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 lg:static lg:py-3"
          >
            {posting ? "Đang đăng video…" : "Đăng video"}
          </button>
        </div>
      </div>
    </ComponentCard>
  );
}