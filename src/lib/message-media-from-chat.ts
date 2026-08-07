import type {
  SaveAlbumPayload,
  SaveVideoPayload,
} from "@/types/message-media";
import type { DisplayMessage } from "@/types/zalo-messenger";

function firstAtt(message: DisplayMessage) {
  return message.attachments?.[0];
}

/** Có thể lưu video từ bubble */
export function canSaveVideoFromMessage(message: DisplayMessage): boolean {
  if (message.recalled) return false;
  if (message.msgType === "chat.video.msg") {
    return Boolean(firstAtt(message)?.href || firstAtt(message)?.thumb);
  }
  if (message.groupMedia?.items?.some((i) => i.msgType === "chat.video.msg")) {
    return true;
  }
  return firstAtt(message)?.action === "video" && Boolean(firstAtt(message)?.href);
}

/** Album: group media ≥2 ảnh/video layout */
export function canSaveAlbumFromMessage(message: DisplayMessage): boolean {
  if (message.recalled) return false;
  const group = message.groupMedia;
  if (!group?.groupLayoutId) return false;
  return (group.items?.length ?? 0) >= 2 || group.totalItems >= 2;
}

export function buildSaveVideoPayloadFromMessage(
  message: DisplayMessage & { content?: unknown },
  nameVideo: string,
): SaveVideoPayload | null {
  const att =
    firstAtt(message) ??
    message.groupMedia?.items
      ?.filter((i) => i.msgType === "chat.video.msg" || i.href)
      .map((i) => ({
        href: i.href,
        thumb: i.thumb,
        durationMs: i.durationMs,
        width: i.width,
        height: i.height,
        action: "video" as const,
      }))[0];

  let videoUrl = att?.href || att?.thumb;
  let duration = att?.durationMs && att.durationMs > 0 ? att.durationMs : 0;
  let width = att && "width" in att ? Number(att.width) : 0;
  let height = att && "height" in att ? Number(att.height) : 0;
  let fileSize =
    att && "fileSizeBytes" in att
      ? Number((att as { fileSizeBytes?: number }).fileSizeBytes)
      : 0;

  // Fallback: parse raw message content if any field is missing
  if (message.content) {
    try {
      const record =
        typeof message.content === "string"
          ? (JSON.parse(message.content) as Record<string, unknown>)
          : (message.content as Record<string, unknown>);
      if (record && typeof record === "object") {
        if (!videoUrl) {
          videoUrl =
            (typeof record.href === "string" ? record.href : "") ||
            (typeof record.thumb === "string" ? record.thumb : "");
        }

        const paramsVal = record.params;
        const params =
          typeof paramsVal === "string"
            ? (JSON.parse(paramsVal) as Record<string, unknown>)
            : paramsVal && typeof paramsVal === "object"
              ? (paramsVal as Record<string, unknown>)
              : null;

        const rawW = Number(
          params?.video_width ??
            params?.videoWidth ??
            params?.width ??
            record?.video_width ??
            record?.videoWidth ??
            record?.width,
        );
        const rawH = Number(
          params?.video_height ??
            params?.videoHeight ??
            params?.height ??
            record?.video_height ??
            record?.videoHeight ??
            record?.height,
        );
        const rawDur = Number(params?.duration ?? record?.duration);
        const rawSize = Number(
          params?.fileSize ??
            params?.file_size ??
            record?.fileSize ??
            record?.file_size,
        );

        if (!width && Number.isFinite(rawW) && rawW > 0) width = rawW;
        if (!height && Number.isFinite(rawH) && rawH > 0) height = rawH;
        if (!duration && Number.isFinite(rawDur) && rawDur > 0)
          duration = rawDur;
        if (!fileSize && Number.isFinite(rawSize) && rawSize > 0)
          fileSize = rawSize;
      }
    } catch {
      // Ignore fallback parse error
    }
  }

  if (!videoUrl) return null;

  return {
    videoUrl,
    thumbUrl: att?.thumb || videoUrl,
    duration: duration > 0 ? duration : 1000,
    width: Number.isFinite(width) && width > 0 ? width : 0,
    height: Number.isFinite(height) && height > 0 ? height : 0,
    fileSize: Math.max(1, Number.isFinite(fileSize) ? fileSize : 1),
    nameVideo: nameVideo.trim(),
  };
}

export function buildSaveAlbumPayloadFromMessage(
  message: DisplayMessage,
  nameAlbum: string,
): SaveAlbumPayload | null {
  const group = message.groupMedia;
  if (!group?.groupLayoutId) return null;
  const items = group.items ?? [];
  if (!items.length) return null;

  const images = items
    .map((item, index) => {
      const url = item.href || item.thumb;
      if (!url) return null;
      return {
        url,
        width: "1080",
        height: "1080",
        idInGroup: String(item.idInGroup ?? index),
        file_size: undefined as string | undefined,
      };
    })
    .filter(Boolean) as SaveAlbumPayload["images"];

  if (!images.length) return null;

  return {
    groupLayoutId: String(group.groupLayoutId),
    totalItemInGroup: String(group.totalItems || images.length),
    nameAlbum: nameAlbum.trim() || undefined,
    images,
  };
}

/** Đo chiều rộng & chiều cao thực tế của file video từ URL qua HTMLVideoElement */
export function detectVideoDimensions(
  url: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({ width: 720, height: 1280 });
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    let resolved = false;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = "";
    };

    const finish = (w: number, h: number) => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve({
        width: Number.isFinite(w) && w > 0 ? Math.round(w) : 720,
        height: Number.isFinite(h) && h > 0 ? Math.round(h) : 1280,
      });
    };

    video.onloadedmetadata = () => {
      finish(video.videoWidth, video.videoHeight);
    };

    video.onerror = () => {
      finish(720, 1280);
    };

    setTimeout(() => {
      finish(720, 1280);
    }, 3000);

    video.src = url;
  });
}
