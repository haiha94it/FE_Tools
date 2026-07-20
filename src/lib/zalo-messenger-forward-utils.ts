import type { DisplayMessage } from "@/types/zalo-messenger";
import type { SavedAlbum, SavedVideoDetail } from "@/types/message-media";
import { generateClientMsgId } from "@/lib/zalo-messenger-utils";

/**
 * forward-video / forward-album — §6 fe_integration_notes (Album & Video).
 * Khác share-video: cần đủ metadata Zalo (duration, size, groupLayout…).
 */

export function buildForwardVideoWsPayload(options: {
  accountId: number;
  conversationId: number;
  info: {
    videoUrl: string;
    thumbUrl: string;
    duration: number;
    width: number;
    height: number;
    fileSize: number;
    title?: string;
  };
  requestId?: string;
}): Record<string, unknown> {
  return {
    type: "forward-video",
    command_type: "forward-video",
    requestId: options.requestId ?? generateClientMsgId(),
    id_account: options.accountId,
    id_conversation: options.conversationId,
    info: {
      videoUrl: options.info.videoUrl,
      thumbUrl: options.info.thumbUrl,
      duration: options.info.duration,
      width: options.info.width,
      height: options.info.height,
      fileSize: options.info.fileSize,
      title: options.info.title ?? "",
    },
  };
}

export function buildForwardAlbumWsPayload(options: {
  accountId: number;
  conversationId: number;
  groupLayoutId: string;
  totalItemInGroup: string;
  info: Array<{
    url: string;
    width?: string;
    height?: string;
    file_size?: string;
    idInGroup?: string;
  }>;
  message?: string;
  requestId?: string;
}): Record<string, unknown> {
  return {
    type: "forward-album",
    command_type: "forward-album",
    requestId: options.requestId ?? generateClientMsgId(),
    id_account: options.accountId,
    id_conversation: options.conversationId,
    groupLayoutId: options.groupLayoutId,
    totalItemInGroup: options.totalItemInGroup,
    message: options.message ?? "",
    info: options.info,
  };
}

export function videoDetailToForwardInfo(detail: SavedVideoDetail) {
  return {
    videoUrl: detail.video_url,
    thumbUrl: detail.thumb_url || detail.video_url,
    duration: detail.duration || 1000,
    width: detail.width || 720,
    height: detail.height || 1280,
    fileSize: detail.file_size || 1,
    title: detail.name_video || "",
  };
}

export function albumToForwardPayload(album: SavedAlbum, caption = "") {
  const images = album.images ?? [];
  return {
    groupLayoutId: String(album.groupLayoutId),
    totalItemInGroup: String(
      album.totalItemInGroup || images.length || 0,
    ),
    message: caption,
    info: images.map((img, index) => ({
      url: img.url,
      width: img.width ?? "1080",
      height: img.height ?? "1080",
      file_size: img.file_size,
      idInGroup: img.idInGroup ?? String(index),
    })),
  };
}

/** Build forward payload từ bubble chat (nếu đủ field) */
export function buildForwardPayloadFromMessage(
  message: DisplayMessage,
  options: {
    accountId: number;
    conversationId: number;
    caption?: string;
  },
): Record<string, unknown> | null {
  // Album group media
  if (message.groupMedia?.groupLayoutId && (message.groupMedia.items?.length ?? 0) >= 1) {
    const group = message.groupMedia;
    const info = (group.items ?? [])
      .map((item, index) => {
        const url = item.href || item.thumb;
        if (!url) return null;
        return {
          url,
          width: "1080",
          height: "1080",
          idInGroup: String(item.idInGroup ?? index),
        };
      })
      .filter(Boolean) as Array<{
      url: string;
      width: string;
      height: string;
      idInGroup: string;
    }>;

    if (!info.length) return null;

    return buildForwardAlbumWsPayload({
      accountId: options.accountId,
      conversationId: options.conversationId,
      groupLayoutId: String(group.groupLayoutId),
      totalItemInGroup: String(group.totalItems || info.length),
      info,
      message: options.caption ?? "",
    });
  }

  // Video
  if (
    message.msgType === "chat.video.msg" ||
    message.attachments?.[0]?.action === "video"
  ) {
    const att = message.attachments?.[0];
    const videoUrl = att?.href || att?.thumb;
    if (!videoUrl) return null;

    const fileSize =
      att && "fileSizeBytes" in att
        ? Number((att as { fileSizeBytes?: number }).fileSizeBytes)
        : 1;

    return buildForwardVideoWsPayload({
      accountId: options.accountId,
      conversationId: options.conversationId,
      info: {
        videoUrl,
        thumbUrl: att?.thumb || videoUrl,
        duration: att?.durationMs && att.durationMs > 0 ? att.durationMs : 1000,
        width: 720,
        height: 1280,
        fileSize: Math.max(1, Number.isFinite(fileSize) ? fileSize : 1),
        title: att?.title || "",
      },
    });
  }

  return null;
}

export function canForwardMediaMessage(message: DisplayMessage): boolean {
  if (message.recalled) return false;
  if (message.groupMedia?.groupLayoutId && (message.groupMedia.items?.length ?? 0) >= 1) {
    return true;
  }
  if (message.msgType === "chat.video.msg") return true;
  if (message.attachments?.[0]?.action === "video") return true;
  return false;
}
