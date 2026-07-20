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
  message: DisplayMessage,
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
        action: "video" as const,
      }))[0];

  const videoUrl = att?.href || att?.thumb;
  if (!videoUrl) return null;

  const fileSizeBytes =
    att && "fileSizeBytes" in att
      ? Number((att as { fileSizeBytes?: number }).fileSizeBytes)
      : 0;

  return {
    videoUrl,
    thumbUrl: att?.thumb || videoUrl,
    duration: att?.durationMs && att.durationMs > 0 ? att.durationMs : 1000,
    width: 720,
    height: 1280,
    fileSize: Math.max(1, Number.isFinite(fileSizeBytes) ? fileSizeBytes : 1),
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
