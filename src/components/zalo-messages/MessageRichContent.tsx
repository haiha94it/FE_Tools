"use client";

import type {
  DisplayMessage,
  MessengerGroupMediaItem,
} from "@/types/zalo-messenger";
import Image from "next/image";
import { formatFileSize } from "@/lib/zalo-messenger-message-utils";
import {
  HiOutlineBellAlert,
  HiOutlineDocumentArrowDown,
  HiOutlineMapPin,
  HiOutlinePlay,
  HiOutlineUserPlus,
} from "react-icons/hi2";
import type { MessageMediaPreviewItem } from "./MessageMediaLightbox";

function formatVoiceDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) return "";
  const totalSec = Math.max(1, Math.round(durationMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}:${String(sec).padStart(2, "0")}`;
  return `0:${String(sec).padStart(2, "0")}`;
}

function buildMapsUrl(lat?: string, lng?: string, label?: string): string | null {
  if (!lat || !lng) return null;
  const query = encodeURIComponent(label?.trim() || `${lat},${lng}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function GifMessageContent({
  src,
  thumb,
  onOpenPreview,
}: {
  src: string;
  thumb?: string;
  onOpenPreview: (item: MessageMediaPreviewItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onOpenPreview({ type: "image", src, title: "GIF" })
      }
      className="group relative block max-w-full overflow-hidden rounded-xl sm:max-w-[240px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="GIF"
        className="h-auto max-h-56 max-w-full cursor-zoom-in rounded-xl object-cover transition group-hover:brightness-95"
        onError={(event) => {
          if (thumb && event.currentTarget.src !== thumb) {
            event.currentTarget.src = thumb;
          }
        }}
      />
      <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
        GIF
      </span>
    </button>
  );
}

export function LocationMessageContent({
  title,
  lat,
  lng,
  own,
}: {
  title: string;
  lat?: string;
  lng?: string;
  own: boolean;
}) {
  const mapsUrl = buildMapsUrl(lat, lng, title);

  const card = (
    <div
      className={`flex min-w-[200px] max-w-[280px] items-start gap-3 rounded-xl border px-3 py-2.5 ${
        own
          ? "border-white/25 bg-white/10"
          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          own
            ? "bg-white/15 text-white"
            : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
        }`}
      >
        <HiOutlineMapPin size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
          Vị trí
        </p>
        <p className="mt-0.5 text-sm leading-snug break-words">{title}</p>
        {mapsUrl ? (
          <p className="mt-1 text-[11px] underline opacity-80">Xem trên bản đồ</p>
        ) : null}
      </div>
    </div>
  );

  if (!mapsUrl) return card;

  return (
    <a href={mapsUrl} target="_blank" rel="noreferrer" className="block">
      {card}
    </a>
  );
}

export function EcardMessageContent({
  title,
  description,
  thumb,
  centered = false,
}: {
  title?: string;
  description?: string;
  thumb?: string;
  own?: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
        centered
          ? "max-w-[300px] border-amber-200/80 bg-white text-gray-800 dark:border-amber-500/25 dark:bg-gray-800 dark:text-white/90"
          : "min-w-[220px] max-w-[300px] border-amber-100 bg-amber-50/80 dark:border-amber-500/20 dark:bg-amber-500/10"
      }`}
    >
      {thumb ? (
        <Image
          src={thumb}
          alt=""
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          <HiOutlineBellAlert size={20} aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80 dark:text-amber-300/90">
          Nhắc hẹn
        </p>
        {title ? (
          <p className="mt-0.5 text-sm font-medium leading-snug break-words">
            {title}
          </p>
        ) : null}
        {description ? (
          <p className="mt-1 text-xs leading-snug text-gray-500 break-words dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RecommendedContactContent({
  title,
  thumb,
  phone,
  href,
  own,
}: {
  title?: string;
  thumb?: string;
  phone?: string;
  href?: string;
  own: boolean;
}) {
  const inner = (
    <div
      className={`flex min-w-[220px] max-w-[280px] items-center gap-3 rounded-xl border px-3 py-2.5 ${
        own
          ? "border-white/25 bg-white/10"
          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
      }`}
    >
      {thumb ? (
        <Image
          src={thumb}
          alt={title || "Liên hệ"}
          width={44}
          height={44}
          unoptimized
          className="h-11 w-11 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            own
              ? "bg-white/15 text-white"
              : "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
          }`}
        >
          <HiOutlineUserPlus size={20} aria-hidden />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">
          Danh thiếp
        </p>
        {title ? (
          <p className="mt-0.5 text-sm font-medium leading-snug break-words">
            {title}
          </p>
        ) : null}
        {phone ? (
          <p className="mt-0.5 text-xs opacity-80">{phone}</p>
        ) : null}
      </div>
    </div>
  );

  if (!href) return inner;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      {inner}
    </a>
  );
}

/** Bubble log cuộc gọi Zalo — chỉ hiển thị, không callback / gọi lại */
export function CallLogMessageContent({
  title,
  subline,
  durationSec = 0,
  isVideo = false,
  status,
  own,
}: {
  title?: string;
  subline?: string;
  durationSec?: number;
  isVideo?: boolean;
  /** answered_* | missed_* | cancelled_* | declined_* | no_answer_* | busy | ... */
  status?: string;
  own: boolean;
}) {
  const sec = Math.max(0, Math.floor(Number(durationSec) || 0));
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  const timeLabel = sec > 0 ? `${m}:${String(r).padStart(2, "0")}` : null;
  const st = (status || "").toLowerCase();
  const isMiss =
    st.includes("miss") ||
    st.includes("cancel") ||
    st.includes("declin") ||
    st.includes("no_answer") ||
    st.includes("busy") ||
    (!timeLabel && !st.startsWith("answered"));

  const headline =
    title?.trim() && title !== "sendBubbleMessage" && title !== "Cuộc gọi"
      ? title
      : isVideo
        ? "Cuộc gọi video"
        : "Cuộc gọi thoại";

  const detail =
    subline?.trim() ||
    (timeLabel ? `Thời lượng ${timeLabel}` : isMiss ? "Không kết nối" : "");

  const iconBg = own
    ? isMiss
      ? "bg-white/15 text-white"
      : "bg-white/15 text-white"
    : isMiss
      ? "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400";

  const icon = isVideo ? (isMiss ? "📹" : "📹") : isMiss ? "📵" : "📞";

  return (
    <div
      className={`flex min-w-[210px] max-w-[300px] items-center gap-3 rounded-xl border px-3 py-2.5 ${
        own
          ? "border-white/25 bg-white/10"
          : "border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40"
      }`}
      aria-label={detail ? `${headline}. ${detail}` : headline}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${iconBg}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{headline}</p>
        {detail ? (
          <p className="mt-0.5 text-xs opacity-80">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SystemTipContent({
  text,
  iconUrl,
  centered = false,
}: {
  text: string;
  iconUrl?: string;
  own?: boolean;
  centered?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-center ${
        centered
          ? "max-w-[min(92%,340px)] bg-gray-100/90 text-gray-600 dark:bg-gray-800/90 dark:text-gray-300"
          : "items-start gap-2.5 rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-3 py-2 dark:border-gray-700 dark:bg-gray-900/30"
      }`}
    >
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          width={16}
          height={16}
          unoptimized
          className="h-4 w-4 shrink-0 object-contain"
        />
      ) : null}
      <p
        className={`leading-snug break-words ${
          centered ? "text-[11px] font-medium" : "text-sm opacity-90"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

export function VoiceMessageContent({
  src,
  durationMs,
}: {
  src: string;
  durationMs?: number;
}) {
  const label = formatVoiceDuration(durationMs);

  return (
    <div className="flex min-w-[200px] items-center gap-2">
      <audio
        controls
        preload="none"
        className="h-9 max-w-[220px] flex-1 [&::-webkit-media-controls-panel]:bg-transparent"
      >
        <source src={src} />
      </audio>
      {label ? (
        <span className="shrink-0 text-[11px] opacity-70">{label}</span>
      ) : null}
    </div>
  );
}

function fileExtLabel(fileExt?: string, title?: string, href?: string): string {
  const ext =
    fileExt?.toUpperCase() ||
    (title?.split(".").pop() ?? href?.split(".").pop() ?? "").toUpperCase();
  return ext.length <= 6 ? ext : "FILE";
}

function buildDownloadFileName(title?: string, fileExt?: string): string | undefined {
  const name = title?.trim();
  if (!name) return undefined;
  if (fileExt && !name.toLowerCase().endsWith(`.${fileExt.toLowerCase()}`)) {
    return `${name}.${fileExt}`;
  }
  return name;
}

export function FileAttachmentContent({
  href,
  title,
  thumb,
  fileExt,
  fileSizeBytes,
  fileKind,
  downloadOnly = false,
  onOpenPreview,
}: {
  href?: string;
  title?: string;
  thumb?: string;
  fileExt?: string;
  fileSizeBytes?: number;
  fileKind?: "video" | "image" | "file";
  downloadOnly?: boolean;
  onOpenPreview: (item: MessageMediaPreviewItem) => void;
}) {
  const sizeLabel = formatFileSize(fileSizeBytes);
  const extLabel = fileExtLabel(fileExt, title, href);
  const downloadName = buildDownloadFileName(title, fileExt);

  if (href && downloadOnly && fileKind === "video") {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        download={downloadName}
        className="flex max-w-[min(100%,300px)] items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 px-3.5 py-3 text-white shadow-sm transition hover:border-brand-400/40 hover:from-gray-800 hover:to-gray-900 dark:border-gray-700"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <HiOutlinePlay className="h-6 w-6" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-white/60">
            Video · tải xuống
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium">
            {title || "Video đính kèm"}
          </span>
          <span className="mt-0.5 block text-xs text-white/55">
            {[extLabel, sizeLabel].filter(Boolean).join(" · ") || "Nhấn để tải file"}
          </span>
        </span>
        <HiOutlineDocumentArrowDown
          className="h-5 w-5 shrink-0 text-white/70"
          aria-hidden
        />
      </a>
    );
  }

  const isImageFile =
    !downloadOnly &&
    (Boolean(thumb) ||
      /\.(jpg|jpeg|png|gif|webp|bmp|heic)(\?|$)/i.test(href ?? title ?? ""));

  if (isImageFile && href) {
    return (
      <button
        type="button"
        onClick={() =>
          onOpenPreview({
            type: "image",
            src: href,
            title,
          })
        }
        className="block max-w-full overflow-hidden rounded-xl transition hover:opacity-90"
      >
        <Image
          src={thumb || href}
          alt={title || "Ảnh"}
          width={220}
          height={220}
          className="h-auto max-h-56 max-w-full min-h-0 cursor-zoom-in rounded-xl object-cover"
          unoptimized
        />
      </button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={downloadOnly ? downloadName : undefined}
      className="flex max-w-[min(100%,280px)] items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/90 px-3 py-2.5 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:border-brand-500/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
        {extLabel || "FILE"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
          {title || "Tệp đính kèm"}
        </span>
        {sizeLabel ? (
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            {sizeLabel}
          </span>
        ) : null}
      </span>
      <HiOutlineDocumentArrowDown
        className="h-5 w-5 shrink-0 text-gray-400 dark:text-gray-500"
        aria-hidden
      />
    </a>
  );
}

export function VideoMessageContent({
  src,
  thumb,
  title,
  onOpenPreview,
}: {
  src: string;
  thumb?: string;
  title?: string;
  onOpenPreview: (item: MessageMediaPreviewItem) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onOpenPreview({
          type: "video",
          src,
          title,
        })
      }
      className="group relative block max-w-[min(100%,260px)] overflow-hidden rounded-xl bg-gray-900/90"
    >
      {thumb ? (
        <Image
          src={thumb}
          alt={title || "Video"}
          width={260}
          height={160}
          className="h-auto min-h-[120px] w-full object-cover transition group-hover:brightness-90"
          unoptimized
        />
      ) : (
        <span className="flex min-h-[140px] w-full min-w-[200px] items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 px-4 text-center text-xs text-gray-400">
          {title ? (
            <span className="line-clamp-2 break-all">{title}</span>
          ) : (
            "Video"
          )}
        </span>
      )}
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/35 text-white transition group-hover:bg-black/45">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <HiOutlinePlay className="h-6 w-6" aria-hidden />
        </span>
        <span className="text-xs font-medium">Phát video</span>
      </span>
    </button>
  );
}

function formatVideoDuration(durationMs?: number): string {
  if (!durationMs || durationMs <= 0) return "";
  const totalSec = Math.max(1, Math.round(durationMs / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}:${String(sec).padStart(2, "0")}`;
  return `0:${String(sec).padStart(2, "0")}`;
}

/** Mobile: full width album; Desktop: max 420px */
const GROUP_MEDIA_ALBUM_CLASS =
  "w-full touch-manipulation max-md:max-w-full md:min-w-[260px] md:max-w-[min(100%,420px)]";

function getGroupMediaGridClass(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 grid-rows-2";
  // Mobile 4+: 2 cột ô to; Desktop giữ 2 cột
  return "grid-cols-2";
}

function getGroupMediaItemClass(
  index: number,
  count: number,
): string {
  if (count === 1) {
    return [
      "aspect-[4/5]",
      "max-md:min-h-[min(52vh,320px)] max-md:max-h-[60vh]",
      "md:min-h-[260px]",
    ].join(" ");
  }
  if (count === 3 && index === 0) {
    return [
      "row-span-2",
      "max-md:min-h-[220px]",
      "md:min-h-[240px]",
    ].join(" ");
  }
  return [
    "aspect-square",
    "max-md:min-h-[148px]",
    "md:min-h-[128px]",
  ].join(" ");
}

function GroupMediaTile({
  item,
  index,
  count,
  overflowCount,
  onOpenPreview,
}: {
  item: MessengerGroupMediaItem;
  index: number;
  count: number;
  overflowCount?: number;
  onOpenPreview: (preview: MessageMediaPreviewItem) => void;
}) {
  const isVideo = item.msgType === "chat.video.msg";
  const src = item.thumb || item.href || "";
  const previewSrc = item.href || item.thumb || "";
  const durationLabel = isVideo ? formatVideoDuration(item.durationMs) : "";

  return (
    <button
      type="button"
      onClick={() =>
        onOpenPreview({
          type: isVideo ? "video" : "image",
          src: previewSrc,
        })
      }
      className={`relative cursor-pointer overflow-hidden bg-gray-200 transition duration-150 active:scale-[0.98] active:opacity-90 dark:bg-gray-700 ${getGroupMediaItemClass(index, count)}`}
      style={{ touchAction: "manipulation" }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          className="object-cover transition hover:brightness-95"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs text-gray-500">
          Media
        </span>
      )}

      {isVideo ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white shadow-sm">
            <HiOutlinePlay size={20} aria-hidden />
          </span>
        </span>
      ) : null}

      {durationLabel ? (
        <span className="absolute bottom-1 right-1 rounded bg-black/55 px-1 py-0.5 text-[10px] font-medium text-white">
          {durationLabel}
        </span>
      ) : null}

      {overflowCount != null && overflowCount > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
          +{overflowCount}
        </span>
      ) : null}
    </button>
  );
}

export function GroupMediaGrid({
  items,
  totalItems,
  onOpenPreview,
}: {
  items: MessengerGroupMediaItem[];
  totalItems: number;
  onOpenPreview: (preview: MessageMediaPreviewItem) => void;
}) {
  const maxVisible = 9;
  const visible = items.slice(0, maxVisible);
  const overflow =
    totalItems > visible.length
      ? totalItems - visible.length
      : items.length > maxVisible
        ? items.length - maxVisible
        : 0;
  const count = visible.length;
  const showMobileMeta = count > 1;

  return (
    <div className={GROUP_MEDIA_ALBUM_CLASS}>
      {showMobileMeta ? (
        <p className="mb-1.5 flex items-center justify-between px-0.5 text-[11px] font-medium text-gray-500 md:hidden dark:text-gray-400">
          <span>Album</span>
          <span>
            {totalItems} mục
          </span>
        </p>
      ) : null}
      <div
        className={`grid gap-2 overflow-hidden rounded-2xl max-md:rounded-xl md:gap-1 md:rounded-xl ${getGroupMediaGridClass(count)}`}
      >
        {visible.map((item, index) => (
          <GroupMediaTile
            key={`${item.msgId ?? item.idInGroup}-${index}`}
            item={item}
            index={index}
            count={count}
            overflowCount={
              overflow > 0 && index === visible.length - 1
                ? overflow
                : undefined
            }
            onOpenPreview={onOpenPreview}
          />
        ))}
      </div>
    </div>
  );
}

/** Kiểm tra msgType/action cần bubble rich (không chỉ text thuần) */
export function isRichMessageType(message: DisplayMessage): boolean {
  const type = message.msgType ?? "";
  const action = message.attachments?.[0]?.action;
  return (
    type === "chat.gif" ||
    type === "chat.location.new" ||
    type === "chat.ecard" ||
    type === "chat.recommended" ||
    type === "chat.photo" ||
    type === "chat.video.msg" ||
    type === "chat.voice" ||
    type === "share.file" ||
    type === "chat.sticker" ||
    type === "group.media" ||
    action === "gif" ||
    action === "group-media" ||
    action === "location" ||
    action === "ecard" ||
    action === "recommended" ||
    action === "calltime" ||
    action === "system" ||
    action === "voice" ||
    action === "video" ||
    action === "file"
  );
}