"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  filterDisplayMessages,
  isCenteredChatMessage,
  resolveStickerImageUrl,
} from "@/lib/zalo-messenger-message-utils";
import { getMessageScrollAnchorId } from "@/lib/zalo-messenger-scroll";
import { canShareMessage } from "@/lib/zalo-messenger-share-utils";
import {
  getMessageReactions,
  getUniqueReactionEmojis,
  groupReactionsByCliMsgId,
} from "@/lib/zalo-messenger-reactions";
import {
  getMessageText,
  isCompactMessageGroup,
  isOwnMessage,
  resolveSenderAvatar,
  resolveSenderName,
  shouldShowDateDivider,
  formatDateDivider,
  trimToString,
} from "@/lib/zalo-messenger-utils";
import {
  formatSentByLabel,
  shouldShowSentByLabel,
} from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type { DisplayMessage } from "@/types/zalo-messenger";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import MessageDetailDialog from "./MessageDetailDialog";
import MessageMetaFooter from "./MessageMetaFooter";
import { MessageActionRail } from "./MessageActionRail";
import {
  EcardMessageContent,
  FileAttachmentContent,
  GifMessageContent,
  GroupMediaGrid,
  LocationMessageContent,
  RecommendedContactContent,
  SystemTipContent,
  VoiceMessageContent,
} from "./MessageRichContent";
import type { MessageMediaPreviewItem } from "./MessageMediaLightbox";

const MessageMediaLightbox = dynamic(() => import("./MessageMediaLightbox"), {
  ssr: false,
});

function QuotePreview({
  message,
  own,
}: {
  message: DisplayMessage;
  own: boolean;
}) {
  const quote = message.quote?.[0];
  if (!quote) return null;

  const quoteText =
    trimToString(quote.msg) || trimToString(quote.attach) || "Tin nhắn";

  return (
    <div
      className={`mb-2 rounded-xl border-l-2 px-2.5 py-1.5 text-xs ${
        own
          ? "border-white/50 bg-white/10 text-white/90"
          : "border-brand-400 bg-brand-50/70 text-gray-600 dark:border-brand-500/40 dark:bg-brand-500/10 dark:text-gray-300"
      }`}
    >
      <p className="font-semibold opacity-80">
        {trimToString(quote.fromD) || "Trả lời"}
      </p>
      <p className="line-clamp-2">{quoteText}</p>
    </div>
  );
}

function MessageContent({
  message,
  own,
  centered = false,
  onOpenPreview,
}: {
  message: DisplayMessage;
  own: boolean;
  centered?: boolean;
  onOpenPreview: (item: MessageMediaPreviewItem) => void;
}) {
  const text = getMessageText(message);
  const attachment = message.attachments?.[0];
  const sticker = message.sticker?.[0];

  if (
    message.msgType === "group.media" ||
    attachment?.action === "group-media"
  ) {
    const group = message.groupMedia;
    if (group?.items.length) {
      return (
        <GroupMediaGrid
          items={group.items}
          totalItems={group.totalItems}
          onOpenPreview={onOpenPreview}
        />
      );
    }
  }

  if (
    attachment?.action === "system" ||
    (message.msgType === "webchat" && attachment?.action === "system")
  ) {
    return (
      <SystemTipContent
        text={attachment?.title || text}
        iconUrl={attachment?.thumb}
        centered={centered}
      />
    );
  }

  if (
    message.msgType === "chat.gif" ||
    attachment?.action === "gif"
  ) {
    const src = attachment?.href || attachment?.thumb;
    if (src) {
      return (
        <GifMessageContent
          src={src}
          thumb={attachment?.thumb}
          onOpenPreview={onOpenPreview}
        />
      );
    }
  }

  if (
    message.msgType === "chat.location.new" ||
    attachment?.action === "location"
  ) {
    const coords = attachment?.description?.split(",");
    return (
      <LocationMessageContent
        title={attachment?.title || text || "Vị trí"}
        lat={coords?.[0]?.trim()}
        lng={coords?.[1]?.trim()}
        own={own}
      />
    );
  }

  if (
    message.msgType === "chat.ecard" ||
    attachment?.action === "ecard"
  ) {
    return (
      <EcardMessageContent
        title={attachment?.title}
        description={attachment?.description}
        thumb={attachment?.thumb}
        centered={centered}
      />
    );
  }

  if (
    message.msgType === "chat.recommended" ||
    attachment?.action === "recommended"
  ) {
    return (
      <RecommendedContactContent
        title={attachment?.title}
        thumb={attachment?.thumb}
        phone={attachment?.description}
        href={attachment?.href}
        own={own}
      />
    );
  }

  if (attachment?.action === "voice" || message.msgType === "chat.voice") {
    if (attachment?.href) {
      return (
        <VoiceMessageContent
          src={attachment.href}
          durationMs={attachment.durationMs}
        />
      );
    }
  }

  if (attachment?.action === "video" || message.msgType === "chat.video.msg") {
    const thumb = attachment?.thumb || attachment?.href;
    const videoSrc = attachment?.href || attachment?.thumb;

    return (
      <div className="space-y-1">
        {videoSrc ? (
          <button
            type="button"
            onClick={() =>
              onOpenPreview({
                type: "video",
                src: videoSrc,
                title: text || attachment?.title,
              })
            }
            className="group relative block max-w-[240px] overflow-hidden rounded-xl"
          >
            {thumb ? (
              <Image
                src={thumb}
                alt="Video"
                width={240}
                height={160}
                className="h-auto w-full object-cover transition group-hover:brightness-90"
                unoptimized
              />
            ) : (
              <span className="flex h-40 w-60 items-center justify-center rounded-xl bg-black/20 text-sm">
                Video
              </span>
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 text-white text-xs font-medium transition group-hover:bg-black/40">
              ▶ Phát video
            </span>
          </button>
        ) : (
          <span className="text-sm">Video</span>
        )}
        {text ? <p className="text-sm whitespace-pre-wrap break-words">{text}</p> : null}
      </div>
    );
  }

  if (
    attachment?.href &&
    (message.msgType === "chat.photo" || attachment.thumb)
  ) {
    const thumb = attachment.thumb || attachment.href;
    const fullSrc = attachment.href || thumb;

    return (
      <div className="space-y-1">
        <button
          type="button"
          onClick={() =>
            onOpenPreview({
              type: "image",
              src: fullSrc,
              title: text || attachment.title,
            })
          }
          className="block overflow-hidden rounded-xl transition hover:opacity-90"
        >
          <Image
            src={thumb}
            alt="Ảnh"
            width={220}
            height={220}
            className="max-h-56 min-h-[120px] w-auto cursor-zoom-in rounded-xl object-cover"
            unoptimized
          />
        </button>
        {text ? <p className="text-sm whitespace-pre-wrap break-words">{text}</p> : null}
      </div>
    );
  }

  if (attachment?.action === "file" || message.msgType === "share.file") {
    return (
      <FileAttachmentContent
        href={attachment?.href}
        title={attachment?.title}
        thumb={attachment?.thumb}
        onOpenPreview={onOpenPreview}
      />
    );
  }

  if (sticker?.id || message.msgType === "chat.sticker") {
    const stickerSrc = resolveStickerImageUrl(message);
    if (stickerSrc) {
      return (
        <Image
          src={stickerSrc}
          alt="Sticker"
          width={120}
          height={120}
          unoptimized
          className="h-28 w-28 object-contain"
        />
      );
    }

    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/50 text-xs text-gray-500 dark:bg-black/20">
        Sticker #{sticker?.id ?? "?"}
      </div>
    );
  }

  if (text) {
    return (
      <p
        className={`text-sm whitespace-pre-wrap break-words ${
          own ? "text-right" : "text-left"
        }`}
      >
        {text}
      </p>
    );
  }

  return <span className="text-xs italic opacity-70">Nội dung không hỗ trợ</span>;
}

export function MessageList({
  messages,
  isGroup = false,
  groupMembers = [],
  onReply,
  onReaction,
  onShare,
}: {
  messages: DisplayMessage[];
  isGroup?: boolean;
  groupMembers?: ZaloGroupMember[];
  onReply?: (message: DisplayMessage) => void;
  onReaction?: (message: DisplayMessage, reactionId: number) => void;
  onShare?: (message: DisplayMessage) => void;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const display = filterDisplayMessages(messages);
  const reactionMap = useMemo(
    () => groupReactionsByCliMsgId(messages),
    [messages],
  );
  const [previewItem, setPreviewItem] = useState<MessageMediaPreviewItem | null>(
    null,
  );
  const [detailTarget, setDetailTarget] = useState<{
    message: DisplayMessage;
    own: boolean;
  } | null>(null);

  const openDetail = (message: DisplayMessage, own: boolean) => {
    setDetailTarget({ message, own });
  };

  return (
    <>
      <MessageMediaLightbox
        item={previewItem}
        onClose={() => setPreviewItem(null)}
      />

      <MessageDetailDialog
        open={detailTarget != null}
        message={detailTarget?.message ?? null}
        own={detailTarget?.own}
        onClose={() => setDetailTarget(null)}
      />

      {display.map((message, index) => {
        const previous = display[index - 1];
        const own = isOwnMessage(message);
        const compact = isCompactMessageGroup(message, previous);
        const showDivider = shouldShowDateDivider(message, previous);
        const senderName = isGroup
          ? resolveSenderName(message, groupMembers)
          : null;
        const senderAvatar = isGroup
          ? resolveSenderAvatar(message, groupMembers)
          : null;
        const showSenderHeader =
          isGroup && !own && !compact && Boolean(senderName);
        const showAvatar = isGroup && !own;
        const reactionMessages = getMessageReactions(message, reactionMap);
        const reactionEmojis = getUniqueReactionEmojis(reactionMessages);
        const scrollAnchorId = getMessageScrollAnchorId(message);
        const sentByLabel =
          own && shouldShowSentByLabel(message.sent_by, currentUserId)
            ? formatSentByLabel(message.sent_by)
            : "";
        const centered = isCenteredChatMessage(message);
        const isGroupMedia = message.msgType === "group.media";

        return (
          <div
            key={message.msgId ?? message.cliMsgId ?? message.id ?? index}
            className="messenger-list-item"
            {...(scrollAnchorId
              ? { "data-scroll-anchor": scrollAnchorId }
              : {})}
          >
            {showDivider ? (
              <div className="my-4 flex justify-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  {formatDateDivider(message.ts)}
                </span>
              </div>
            ) : null}

            {centered ? (
              <div
                className={`flex w-full justify-center px-3 ${compact ? "mt-1" : "mt-3"}`}
              >
                <div className="flex max-w-full flex-col items-center gap-1">
                  <MessageContent
                    message={message}
                    own={false}
                    centered
                    onOpenPreview={setPreviewItem}
                  />
                  <MessageMetaFooter
                    message={message}
                    own={false}
                    className="justify-center"
                  />
                </div>
              </div>
            ) : (
            <div
              className={`group/row relative flex w-full min-w-0 items-end overflow-visible ${
                isGroupMedia ? "max-md:gap-0 md:gap-2" : "gap-2"
              } ${own ? "justify-end" : "justify-start"} ${
                compact ? "mt-1" : "mt-3"
              }`}
            >
              {showAvatar ? (
                <div
                  className={`w-8 shrink-0 ${isGroupMedia ? "max-md:hidden" : ""}`}
                >
                  {!compact ? (
                    <ContactAvatar
                      name={senderName ?? "Thành viên"}
                      avatar={senderAvatar}
                      size="sm"
                    />
                  ) : null}
                </div>
              ) : null}

              <div
                className={`flex min-w-0 flex-col overflow-visible ${
                  isGroupMedia
                    ? "max-md:flex-1 max-md:max-w-full md:max-w-[min(96%,420px)]"
                    : "max-w-[min(92%,360px)] max-md:max-w-[min(96%,360px)]"
                } ${own ? "items-end" : "items-start"}`}
              >
                {showSenderHeader ? (
                  <p
                    className={`mb-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 ${
                      isGroupMedia ? "px-0.5" : "px-1"
                    }`}
                  >
                    {senderName}
                  </p>
                ) : null}

                <div
                  className={`relative overflow-visible ${
                    isGroupMedia ? "w-full max-w-full" : "inline-flex w-fit max-w-full"
                  } ${own ? "max-md:ml-9" : "max-md:mr-9"}`}
                >
                  <div
                    className={`relative shadow-sm ${
                      isGroupMedia
                        ? "w-full overflow-hidden max-md:rounded-xl max-md:border-0 max-md:bg-transparent max-md:p-0 max-md:shadow-none md:rounded-2xl md:border md:border-gray-100 md:bg-white md:p-1.5 dark:md:border-gray-700 dark:md:bg-gray-800"
                        : "rounded-2xl px-3.5 py-2"
                    } ${
                      !isGroupMedia &&
                      (own
                        ? "rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 text-white"
                        : "rounded-bl-md border border-gray-100 bg-white text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90")
                    } ${message._status === "failed" ? "ring-2 ring-error-400/50" : ""} ${
                      reactionEmojis.length > 0 ? "pb-3" : ""
                    }`}
                  >
                    <QuotePreview message={message} own={own} />
                    <MessageContent
                      message={message}
                      own={own}
                      onOpenPreview={setPreviewItem}
                    />
                    {!isGroupMedia ? (
                      <MessageMetaFooter
                        message={message}
                        own={own}
                        sentByLabel={sentByLabel}
                      />
                    ) : null}

                    {reactionEmojis.length > 0 ? (
                      <div
                        className={`absolute bottom-0 z-[4] inline-flex -translate-y-1/2 items-center gap-0.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
                          own ? "left-3" : "right-3"
                        }`}
                      >
                        {reactionEmojis.map((emoji) => (
                          <span key={emoji}>{emoji}</span>
                        ))}
                        <span className="text-gray-500">
                          {reactionMessages.length}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <MessageActionRail
                    own={own}
                    canReply={Boolean(onReply)}
                    canShare={Boolean(onShare && canShareMessage(message))}
                    onReply={onReply ? () => onReply(message) : undefined}
                    onShare={
                      onShare && canShareMessage(message)
                        ? () => onShare(message)
                        : undefined
                    }
                    onReaction={
                      onReaction
                        ? (reactionId) => onReaction(message, reactionId)
                        : undefined
                    }
                    onShowDetail={() => openDetail(message, own)}
                  />
                </div>
                {isGroupMedia ? (
                  <MessageMetaFooter
                    message={message}
                    own={own}
                    sentByLabel={sentByLabel}
                    className="mt-1.5 max-md:justify-start md:justify-end"
                  />
                ) : null}
              </div>

              {isGroup && own ? (
                <span
                  className={`w-8 shrink-0 ${isGroupMedia ? "max-md:hidden" : ""}`}
                  aria-hidden="true"
                />
              ) : null}
            </div>
            )}
          </div>
        );
      })}
    </>
  );
}

export default MessageList;