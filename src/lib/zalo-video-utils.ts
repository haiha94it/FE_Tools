import { API_BASE_URL } from "@/config/api";

const VIDEO_ASPECT = 9 / 16;

/** Chuyển data URL (canvas thumbnail) sang Blob để upload */
export function dataUrlToBlob(dataUrl: string): Blob | null {
  if (!dataUrl) return null;

  const parts = dataUrl.split(",");
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  if (!mimeMatch || parts.length < 2) return null;

  const mime = mimeMatch[1];
  const binary = atob(parts[1] ?? "");
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

/** Định dạng hẹn giờ đăng — `YYYY-MM-DD HH:mm:ss` */
export function formatZaloVideoPublishTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-")
    + ` ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** URL preview video tải từ link TikTok/Facebook */
export function buildDownloadedVideoPreviewUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}/api/channel${normalized}`;
}

export function isAllowedVideoFile(file: File): boolean {
  const allowed = ["video/mp4", "video/quicktime"];
  return allowed.includes(file.type);
}

export const MAX_VIDEO_FILE_BYTES = 500 * 1024 * 1024;

/** Lấy frame thumbnail tại thời điểm `time` (giây), crop 9:16 */
export function captureVideoThumbnail(
  video: HTMLVideoElement,
  time: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Không khởi tạo được canvas"));
      return;
    }

    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);

      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      let cropWidth = videoWidth;
      let cropHeight = videoWidth / VIDEO_ASPECT;

      if (cropHeight > videoHeight) {
        cropHeight = videoHeight;
        cropWidth = videoHeight * VIDEO_ASPECT;
      }

      const sx = (videoWidth - cropWidth) / 2;
      const sy = (videoHeight - cropHeight) / 2;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(
        video,
        sx,
        sy,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight,
      );

      resolve(canvas.toDataURL("image/jpeg"));
    };

    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}

/** mm:ss hoặc h:mm:ss — UI trim. */
export function formatVideoClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec % 60);
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(s)}`;
  return `${m}:${pad(s)}`;
}

/** Tổng giây → phút + giây (giây 1 chữ số thập phân, 0–59.9). */
export function secondsToMinSec(totalSec: number): {
  minutes: number;
  seconds: number;
} {
  const t = Math.max(0, Number.isFinite(totalSec) ? totalSec : 0);
  let minutes = Math.floor(t / 60);
  let seconds = Math.round((t - minutes * 60) * 10) / 10;
  if (seconds >= 60) {
    minutes += 1;
    seconds = 0;
  }
  return { minutes, seconds };
}

/** Phút + giây → tổng giây (API trim). */
export function minSecToSeconds(minutes: number, seconds: number): number {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  let s = Number(seconds);
  if (!Number.isFinite(s) || s < 0) s = 0;
  if (s >= 60) {
    // 60s → +1 phút
    const extra = Math.floor(s / 60);
    s = Math.round((s % 60) * 10) / 10;
    return (m + extra) * 60 + s;
  }
  return m * 60 + s;
}

/** Clamp đoạn cắt video (giây). */
export function clampTrimRange(
  start: number,
  end: number,
  duration: number,
  minLen = 0.5,
): { start: number; end: number } {
  const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
  let a = Math.max(0, Math.min(start, dur));
  let b = Math.max(0, Math.min(end, dur));
  if (b - a < minLen) {
    b = Math.min(dur, a + minLen);
    if (b - a < minLen) a = Math.max(0, b - minLen);
  }
  return { start: a, end: b };
}

/**
 * Cắt đều `count` khung trong [rangeStart, rangeEnd] (mặc định full video).
 * Tránh frame cuối (hay đen).
 */
export async function generateVideoThumbnails(
  video: HTMLVideoElement,
  count = 6,
  range?: { start?: number; end?: number },
): Promise<{ time: number; thumb: string }[]> {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const n = Math.max(1, Math.min(Math.floor(count) || 6, 12));
  const rangeStart = Math.max(0, range?.start ?? 0);
  const rangeEnd = Math.min(
    duration,
    range?.end != null && range.end > rangeStart ? range.end : duration,
  );
  const spanEnd = Math.max(rangeStart, rangeEnd - 0.12);
  const items: { time: number; thumb: string }[] = [];

  for (let i = 0; i < n; i += 1) {
    const t =
      n === 1
        ? Math.min(rangeStart + 0.1, spanEnd)
        : rangeStart + (i / (n - 1)) * (spanEnd - rangeStart);
    const thumb = await captureVideoThumbnail(video, t);
    items.push({ time: t, thumb });
  }

  return items;
}

/** Fetch video remote → blob URL local để canvas cắt thumbnail (bypass CORS). */
export async function resolveVideoUrlForThumbnails(url: string): Promise<string> {
  if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return url;
    const blob = await res.blob();
    if (!blob.type.startsWith("video/") && blob.size < 1024) return url;
    return URL.createObjectURL(blob);
  } catch {
    return url;
  }
}