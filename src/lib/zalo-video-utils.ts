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

/** Tạo danh sách thumbnail mỗi 5 giây */
export async function generateVideoThumbnails(
  video: HTMLVideoElement,
  intervalSec = 5,
): Promise<{ time: number; thumb: string }[]> {
  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) return [];

  const items: { time: number; thumb: string }[] = [];

  for (let time = 0; time < duration; time += intervalSec) {
    const thumb = await captureVideoThumbnail(video, time);
    items.push({ time, thumb });
  }

  return items;
}