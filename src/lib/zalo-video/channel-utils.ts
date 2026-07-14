import type { ZaloChannelInfo } from "@/types/zalo-video";

export function hasZaloVideoChannel(info: ZaloChannelInfo | null | undefined): boolean {
  if (!info) return false;
  return info.id != null || info.channel_id != null;
}