"use client";

import ComponentCard from "@/components/common/ComponentCard";
import { VIDEO_CREATOR_BASE } from "@/config/api";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  buildDownloadedVideoPreviewUrl,
  clampTrimRange,
  dataUrlToBlob,
  formatVideoClock,
  formatZaloVideoPublishTime,
  generateVideoThumbnails,
  isAllowedVideoFile,
  MAX_VIDEO_FILE_BYTES,
  minSecToSeconds,
  resolveVideoUrlForThumbnails,
  secondsToMinSec,
} from "@/lib/zalo-video-utils";
import {
  getVideoTaskErrorMessage,
  isVideoTaskBusinessSuccess,
} from "@/lib/zalo-video/task-utils";
import { Modal } from "@/components/ui/modal";
import { zaloVideoService } from "@/services/zalo-video.service";
import type { VideoThumbnailItem } from "@/types/zalo-video";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { HiOutlineEye, HiOutlineXMark } from "react-icons/hi2";

interface PostVideoPanelProps {
  accountId: number;
}

const THUMB_COUNT = 6;
/** Coi full nếu lệch < 0.2s — không gọi trim server */
const TRIM_EPS = 0.2;
/**
 * Giới hạn ô Nội dung video.
 * Trước: 300 (cắt title TikTok dài). BE không cap 300 — nới để giữ full mô tả quét link.
 */
const CAPTION_MAX = 2000;

const inputNumClass =
  "h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-center text-sm tabular-nums text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

/**
 * Ô phút : giây gọn — nội bộ giây (float). Chỉ hiện m:ss dưới nhóm.
 */
function TrimTimeFields({
  label,
  totalSec,
  duration,
  onChangeTotal,
}: {
  label: string;
  totalSec: number;
  duration: number;
  onChangeTotal: (sec: number) => void;
}) {
  const { minutes, seconds } = secondsToMinSec(totalSec);
  const maxMin = Math.max(0, Math.floor(duration / 60));

  const apply = (nextMin: number, nextSec: number) => {
    const raw = minSecToSeconds(nextMin, nextSec);
    onChangeTotal(Math.max(0, Math.min(raw, duration)));
  };

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={maxMin}
          step={1}
          aria-label={`${label} — phút`}
          value={minutes}
          onChange={(e) => {
            const m = Math.max(0, Math.floor(Number(e.target.value) || 0));
            apply(m, seconds);
          }}
          className={inputNumClass}
        />
        <span className="shrink-0 text-sm font-semibold text-gray-400">:</span>
        <input
          type="number"
          min={0}
          max={59.9}
          step={0.1}
          aria-label={`${label} — giây`}
          value={seconds}
          onChange={(e) => {
            let s = Number(e.target.value);
            if (!Number.isFinite(s) || s < 0) s = 0;
            if (s > 59.9) s = 59.9;
            apply(minutes, Math.round(s * 10) / 10);
          }}
          className={inputNumClass}
        />
      </div>
      <p className="mt-1 text-center text-[11px] tabular-nums text-gray-400">
        {formatVideoClock(totalSec)}
      </p>
    </div>
  );
}

/**
 * 1 range slider 2 đầu (start–end) — kéo không gen thumbnail.
 */
function DualTrimSlider({
  duration,
  start,
  end,
  onChange,
}: {
  duration: number;
  start: number;
  end: number;
  onChange: (start: number, end: number) => void;
}) {
  const max = Math.max(0.1, duration);
  const startPct = Math.min(100, (start / max) * 100);
  const endPct = Math.min(100, (end / max) * 100);

  return (
    <div className="relative h-8 select-none">
      {/* Track nền */}
      <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gray-200 dark:bg-gray-700" />
      {/* Đoạn chọn */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-500"
        style={{
          left: `${startPct}%`,
          width: `${Math.max(0, endPct - startPct)}%`,
        }}
      />
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={Math.min(start, max)}
        aria-label="Điểm bắt đầu cắt"
        onChange={(e) => {
          const v = Number(e.target.value);
          const next = clampTrimRange(v, end, duration);
          onChange(next.start, next.end);
        }}
        className="pointer-events-none absolute inset-0 z-[2] h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[3] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-500"
      />
      <input
        type="range"
        min={0}
        max={max}
        step={0.1}
        value={Math.min(end, max)}
        aria-label="Điểm kết thúc cắt"
        onChange={(e) => {
          const v = Number(e.target.value);
          const next = clampTrimRange(start, v, duration);
          onChange(next.start, next.end);
        }}
        className="pointer-events-none absolute inset-0 z-[3] h-8 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-[4] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-500"
      />
    </div>
  );
}

/**
 * Đăng 1 video — upload / link / thumbnail / schedule / trim (Care3 parity).
 */
export default function PostVideoPanel({ accountId }: PostVideoPanelProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbGenKeyRef = useRef<string>("");

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
  const [generatingThumbs, setGeneratingThumbs] = useState(false);
  const [posting, setPosting] = useState(false);
  /** Preview zoom ảnh bìa đang chọn */
  const [thumbPreviewOpen, setThumbPreviewOpen] = useState(false);

  const [trimEnabled, setTrimEnabled] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const resetVideoState = () => {
    setThumbnails([]);
    setSelectedThumb(null);
    setServerVideoPath("");
    thumbGenKeyRef.current = "";
    setTrimEnabled(false);
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
  };

  const needsTrim =
    trimEnabled &&
    videoDuration > 0 &&
    (trimStart > TRIM_EPS || trimEnd < videoDuration - TRIM_EPS);

  const runThumbnailGeneration = useCallback(
    async (force = false) => {
      const video = videoRef.current;
      if (!video) return;

      const rangeStart = trimEnabled ? trimStart : 0;
      const rangeEnd = trimEnabled && trimEnd > 0 ? trimEnd : video.duration;
      const key = `${video.src}|${video.duration}|${rangeStart}-${rangeEnd}|${video.videoWidth}x${video.videoHeight}`;
      if (!force && thumbGenKeyRef.current === key && thumbnails.length > 0) {
        return;
      }

      if (
        !Number.isFinite(video.duration) ||
        video.duration <= 0 ||
        !video.videoWidth
      ) {
        return;
      }

      setGeneratingThumbs(true);
      try {
        video.pause();
        const items = await generateVideoThumbnails(video, THUMB_COUNT, {
          start: rangeStart,
          end: rangeEnd,
        });
        if (items.length === 0) {
          toast.error(
            "Không cắt được khung hình từ video. Thử «Tạo lại thumbnail».",
          );
          return;
        }
        thumbGenKeyRef.current = key;
        setThumbnails(items);
        setSelectedThumb(items[0].thumb);
        toast.success(`Đã tạo ${items.length} ảnh bìa từ video`);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Không tạo được ảnh bìa từ video",
        );
      } finally {
        try {
          video.muted = false;
          if (video.volume === 0) video.volume = 1;
        } catch {
          /* ignore */
        }
        setGeneratingThumbs(false);
      }
    },
    [thumbnails.length, trimEnabled, trimStart, trimEnd],
  );

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
      toast.success("Đã tải video lên server.");
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
    const dur = video.duration;
    if (Number.isFinite(dur) && dur > 0) {
      setVideoDuration(dur);
      setTrimStart(0);
      setTrimEnd(dur);
    }
    await runThumbnailGeneration(true);
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
      const remoteUrl = buildDownloadedVideoPreviewUrl(path);
      const localUrl = await resolveVideoUrlForThumbnails(remoteUrl);
      setVideoPreviewUrl(localUrl);

      // Title/desc từ TikTok (tikwm) → ô Nội dung video (giữ full, cap CAPTION_MAX)
      const rawTitle =
        result.data?.title?.trim() ||
        result.data?.caption?.trim() ||
        (typeof result.result === "object" && result.result
          ? String(
              (result.result as { title?: string; caption?: string }).title ||
                (result.result as { title?: string; caption?: string }).caption ||
                "",
            ).trim()
          : "");
      if (rawTitle) {
        setCaption(
          rawTitle.length > CAPTION_MAX
            ? rawTitle.slice(0, CAPTION_MAX)
            : rawTitle,
        );
      }

      toast.success(
        rawTitle ? "Đã quét video và điền nội dung" : "Đã quét video từ link",
      );
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
      toast.warning("Chọn ảnh bìa trước khi đăng (cần tạo thumbnail từ video)");
      if (videoPreviewUrl) void runThumbnailGeneration(true);
      return;
    }

    const thumbBlob = dataUrlToBlob(selectedThumb);
    if (!thumbBlob) {
      toast.error("Ảnh bìa không hợp lệ");
      return;
    }

    setPosting(true);
    try {
      let videoPath = serverVideoPath;
      if (needsTrim) {
        const { start, end } = clampTrimRange(
          trimStart,
          trimEnd,
          videoDuration,
        );
        toast.info(
          `Đang cắt ${formatVideoClock(start)} → ${formatVideoClock(end)}…`,
        );
        videoPath = await zaloVideoService.trimVideoFile({
          videoPath: serverVideoPath,
          start,
          end,
        });
      }

      const thumbnailPath = await zaloVideoService.uploadThumbnailBlob(thumbBlob);
      const publishTime = scheduleEnabled
        ? formatZaloVideoPublishTime(new Date(scheduleAt))
        : "";

      const result = await zaloVideoService.postVideo({
        id_account: accountId,
        thumbnail: thumbnailPath,
        video: videoPath,
        caption,
        publish_time: publishTime,
      });

      if (isVideoTaskBusinessSuccess(result)) {
        toast.success(
          needsTrim ? "Đăng video đã cắt thành công" : "Đăng video thành công",
        );
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

  const isBusy =
    uploadingFile || downloadingLink || posting || generatingThumbs;

  return (
    <ComponentCard
      title="Đăng video mới"
      desc="Tải video từ máy hoặc quét từ link TikTok/Facebook — hỗ trợ cắt đoạn & hẹn giờ"
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

          {videoPreviewUrl && videoDuration > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-800 dark:bg-gray-900/30">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={trimEnabled}
                  onChange={(e) => setTrimEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500/20"
                />
                Cắt đoạn video trước khi đăng
              </label>

              {trimEnabled ? (
                <div className="mt-3 space-y-3">
                  {/* Phút : giây — 2 nhóm */}
                  <div className="grid grid-cols-2 gap-3">
                    <TrimTimeFields
                      label="Bắt đầu"
                      totalSec={trimStart}
                      duration={videoDuration}
                      onChangeTotal={(sec) => {
                        const next = clampTrimRange(
                          sec,
                          trimEnd,
                          videoDuration,
                        );
                        setTrimStart(next.start);
                        setTrimEnd(next.end);
                        // Không gen thumbnail khi gõ
                      }}
                    />
                    <TrimTimeFields
                      label="Kết thúc"
                      totalSec={trimEnd}
                      duration={videoDuration}
                      onChangeTotal={(sec) => {
                        const next = clampTrimRange(
                          trimStart,
                          sec,
                          videoDuration,
                        );
                        setTrimStart(next.start);
                        setTrimEnd(next.end);
                      }}
                    />
                  </div>

                  {/* 1 dual-range slider */}
                  <DualTrimSlider
                    duration={videoDuration}
                    start={trimStart}
                    end={trimEnd}
                    onChange={(s, e) => {
                      setTrimStart(s);
                      setTrimEnd(e);
                      // Kéo không gen thumbnail
                    }}
                  />

                  <button
                    type="button"
                    disabled={generatingThumbs}
                    onClick={() => void runThumbnailGeneration(true)}
                    className="h-9 w-full rounded-lg border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 sm:w-auto sm:px-4"
                  >
                    {generatingThumbs
                      ? "Đang tạo thumbnail…"
                      : "Tạo lại thumbnail theo đoạn cắt"}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Nội dung video
            </label>
            <textarea
              value={caption}
              rows={6}
              maxLength={CAPTION_MAX}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={`Mô tả video (tối đa ${CAPTION_MAX} ký tự)`}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
            <p className="mt-1 text-xs text-gray-400">
              {caption.length}/{CAPTION_MAX}
            </p>
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
              {generatingThumbs
                ? "Đang tạo ảnh bìa…"
                : "Chọn video để tự động tạo ảnh bìa"}
            </p>
          )}

          {selectedThumb && (
            <div className="group/preview relative mx-auto w-[101px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedThumb}
                alt="Ảnh bìa đã chọn"
                className="h-[180px] w-[101px] rounded-xl object-cover shadow-theme-sm"
              />
              <button
                type="button"
                onClick={() => setThumbPreviewOpen(true)}
                aria-label="Xem ảnh bìa lớn"
                title="Xem lớn"
                className="absolute right-1.5 top-1.5 inline-flex size-8 items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 sm:opacity-0 sm:group-hover/preview:opacity-100"
              >
                <HiOutlineEye size={16} aria-hidden />
              </button>
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

      {/* Zoom preview ảnh bìa — chỉ xem, không đổi selection */}
      <Modal
        isOpen={thumbPreviewOpen && Boolean(selectedThumb)}
        onClose={() => setThumbPreviewOpen(false)}
        showCloseButton={false}
        className="!max-w-[min(420px,calc(100vw-2rem))] !rounded-2xl !p-0 !bg-transparent !shadow-none"
      >
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setThumbPreviewOpen(false)}
            aria-label="Đóng"
            className="absolute -right-1 -top-1 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition hover:bg-black/85"
          >
            <HiOutlineXMark size={20} aria-hidden />
          </button>
          {selectedThumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selectedThumb}
              alt="Xem trước ảnh bìa"
              className="max-h-[min(80dvh,720px)] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
          ) : null}
        </div>
      </Modal>
    </ComponentCard>
  );
}
