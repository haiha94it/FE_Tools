"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import {
  canSaveAlbumFromMessage,
  canSaveVideoFromMessage,
} from "@/lib/message-media-from-chat";
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
import type {
  DisplayMessage,
  MessengerMention,
} from "@/types/zalo-messenger";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useMemo, useState, type ReactNode } from "react";
import MessageDetailDialog from "./MessageDetailDialog";
import MessageMetaFooter from "./MessageMetaFooter";
import { MessageActionRail } from "./MessageActionRail";
import SaveMediaFromChatDialog, {
  type SaveMediaKind,
} from "./SaveMediaFromChatDialog";
import {
  CallLogMessageContent,
  EcardMessageContent,
  FileAttachmentContent,
  GifMessageContent,
  GroupMediaGrid,
  LocationMessageContent,
  RecommendedContactContent,
  SystemTipContent,
  VideoMessageContent,
  VoiceMessageContent,
} from "./MessageRichContent";
import type { MessageMediaPreviewItem } from "./MessageMediaLightbox";

const MessageMediaLightbox = dynamic(() => import("./MessageMediaLightbox"), {
  ssr: false,
});

const messageTextClass =
  "w-full min-w-0 max-w-full text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]";

/** Render đúng các đoạn mention theo pos/len và giữ nguyên phần text còn lại. */
function MentionText({
  text,
  mentions,
  own,
}: {
  text: string;
  mentions?: MessengerMention[];
  own: boolean;
}) {
  const validMentions = (mentions ?? [])
    .filter(
      (mention) =>
        Number.isInteger(mention.pos) &&
        Number.isInteger(mention.len) &&
        mention.pos >= 0 &&
        mention.len > 0 &&
        mention.pos < text.length,
    )
    .sort((left, right) => left.pos - right.pos);

  if (!validMentions.length) return text;

  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const mention of validMentions) {
    if (mention.pos < cursor) continue;
    if (mention.pos > cursor) parts.push(text.slice(cursor, mention.pos));

    const end = Math.min(mention.pos + mention.len, text.length);
    parts.push(
      <span
        key={`${mention.pos}-${mention.len}-${mention.uid ?? ""}`}
        className={
          own
            ? "font-semibold text-cyan-200"
            : "font-semibold text-brand-500 dark:text-brand-300"
        }
      >
        {text.slice(mention.pos, end)}
      </span>,
    );
    cursor = end;
  }

  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

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
      <p className={`line-clamp-2 ${messageTextClass} text-xs`}>{quoteText}</p>
    </div>
  );
}

function RecalledNote({ own }: { own: boolean }) {
  return (
    <p
      className={`text-xs italic ${
        own ? "text-white/80" : "text-gray-500 dark:text-gray-400"
      }`}
    >
      Tin nhắn đã được thu hồi
    </p>
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

  let body: ReactNode;

  if (
    message.msgType === "group.media" ||
    attachment?.action === "group-media"
  ) {
    const group = message.groupMedia;
    body = group?.items.length ? (
      <GroupMediaGrid
        items={group.items}
        totalItems={group.totalItems}
        own={own}
        onOpenPreview={onOpenPreview}
      />
    ) : (
      <span className="text-xs italic opacity-70">Nội dung không hỗ trợ</span>
    );
  } else if (
    attachment?.action === "system" ||
    (message.msgType === "webchat" && attachment?.action === "system")
  ) {
    body = (
      <SystemTipContent
        text={attachment?.title || text}
        iconUrl={attachment?.thumb}
        centered={centered}
      />
    );
  } else if (message.msgType === "chat.gif" || attachment?.action === "gif") {
    const src = attachment?.href || attachment?.thumb;
    body = src ? (
      <GifMessageContent
        src={src}
        thumb={attachment?.thumb}
        onOpenPreview={onOpenPreview}
      />
    ) : (
      <span className="text-xs italic opacity-70">Nội dung không hỗ trợ</span>
    );
  } else if (
    message.msgType === "chat.location.new" ||
    attachment?.action === "location"
  ) {
    const coords = attachment?.description?.split(",");
    body = (
      <LocationMessageContent
        title={attachment?.title || text || "Vị trí"}
        lat={coords?.[0]?.trim()}
        lng={coords?.[1]?.trim()}
        own={own}
      />
    );
  } else if (
    message.msgType === "chat.ecard" ||
    attachment?.action === "ecard"
  ) {
    body = (
      <EcardMessageContent
        title={attachment?.title}
        description={attachment?.description}
        thumb={attachment?.thumb}
        centered={centered}
      />
    );
  } else if (attachment?.action === "calltime") {
    body = (
      <CallLogMessageContent
        title={attachment?.callHeadline || attachment?.title}
        subline={attachment?.callSubline || attachment?.description}
        durationSec={attachment?.callDurationSec ?? 0}
        isVideo={attachment?.callType === 1}
        status={attachment?.callStatus}
        own={own}
      />
    );
  } else if (
    message.msgType === "chat.recommended" ||
    attachment?.action === "recommended"
  ) {
    body = (
      <RecommendedContactContent
        title={attachment?.title}
        thumb={attachment?.thumb}
        phone={attachment?.description}
        href={attachment?.href}
        own={own}
      />
    );
  } else if (
    attachment?.action === "voice" ||
    message.msgType === "chat.voice"
  ) {
    body = attachment?.href ? (
      <VoiceMessageContent
        src={attachment.href}
        durationMs={attachment.durationMs}
      />
    ) : (
      <span className="text-xs italic opacity-70">Nội dung không hỗ trợ</span>
    );
  } else if (
    attachment?.action === "video" ||
    message.msgType === "chat.video.msg"
  ) {
    const videoSrc = attachment?.href || attachment?.thumb;
    body = !videoSrc ? (
      <span className="text-sm">Video</span>
    ) : (
      <div className="space-y-1">
        <VideoMessageContent
          src={videoSrc}
          thumb={attachment?.thumb}
          title={text || attachment?.title}
          onOpenPreview={onOpenPreview}
        />
        {text ? <p className={messageTextClass}>{text}</p> : null}
      </div>
    );
  } else if (
    attachment?.href &&
    (message.msgType === "chat.photo" || attachment.thumb)
  ) {
    const thumb = attachment.thumb || attachment.href;
    const fullSrc = attachment.href || thumb;
    body = (
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
          className="block max-w-full overflow-hidden rounded-xl transition hover:opacity-90"
        >
          <Image
            src={thumb}
            alt="Ảnh"
            width={220}
            height={220}
            className="h-auto max-h-56 max-w-full min-h-0 cursor-zoom-in rounded-xl object-cover"
            unoptimized
          />
        </button>
        {text ? <p className={messageTextClass}>{text}</p> : null}
      </div>
    );
  } else if (attachment?.action === "file") {
    body = (
      <FileAttachmentContent
        href={attachment?.href}
        title={attachment?.title}
        thumb={attachment?.thumb}
        fileExt={attachment?.fileExt}
        fileSizeBytes={attachment?.fileSizeBytes}
        fileKind={attachment?.fileKind}
        downloadOnly={attachment?.downloadOnly}
        onOpenPreview={onOpenPreview}
      />
    );
  } else if (sticker?.id || message.msgType === "chat.sticker") {
    const stickerSrc = resolveStickerImageUrl(message);
    body = stickerSrc ? (
      <Image
        src={stickerSrc}
        alt="Sticker"
        width={120}
        height={120}
        unoptimized
        className="h-28 w-28 object-contain"
      />
    ) : (
      <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/50 text-xs text-gray-500 dark:bg-black/20">
        Sticker #{sticker?.id ?? "?"}
      </div>
    );
  } else if (text) {
    body = (
      <p className={`${messageTextClass} text-left`}>
        <MentionText text={text} mentions={message.mentions} own={own} />
      </p>
    );
  } else {
    body = (
      <span className="text-xs italic opacity-70">Nội dung không hỗ trợ</span>
    );
  }

  if (!message.recalled) return body;

  return (
    <div className="space-y-1.5">
      {body}
      <RecalledNote own={own} />
    </div>
  );
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
  const [saveMedia, setSaveMedia] = useState<{
    kind: SaveMediaKind;
    message: DisplayMessage;
  } | null>(null);

  const openDetail = (message: DisplayMessage, own: boolean) => {
    setDetailTarget({ message, own });
  };

  return (
    <>
      <SaveMediaFromChatDialog
        open={Boolean(saveMedia)}
        kind={saveMedia?.kind ?? "video"}
        message={saveMedia?.message ?? null}
        onClose={() => setSaveMedia(null)}
      />
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
              className={`group/row relative flex w-full min-w-0 items-end overflow-hidden ${
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
                className={`flex w-full min-w-0 flex-col ${
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
                  className={`relative w-max min-w-0 max-w-full ${
                    isGroupMedia ? "w-full" : ""
                  } ${own ? "max-md:ml-9" : "max-md:mr-9"}`}
                >
                  <div
                    className={`relative w-full min-w-0 max-w-full overflow-hidden shadow-sm ${
                      isGroupMedia
                        ? `w-full overflow-hidden max-md:rounded-xl max-md:border-0 max-md:p-0 max-md:shadow-none md:rounded-2xl md:border md:p-1.5 ${
                            own
                              ? "bg-gradient-to-br from-brand-500 to-brand-600 text-white md:border-brand-500 dark:md:border-brand-400"
                              : "max-md:bg-transparent md:border-gray-100 md:bg-white dark:md:border-gray-700 dark:md:bg-gray-800"
                          }`
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
                    canReply={Boolean(onReply) && !message.recalled}
                    canShare={Boolean(
                      onShare && !message.recalled && canShareMessage(message),
                    )}
                    canSaveVideo={canSaveVideoFromMessage(message)}
                    canSaveAlbum={canSaveAlbumFromMessage(message)}
                    onReply={
                      onReply && !message.recalled
                        ? () => onReply(message)
                        : undefined
                    }
                    onShare={
                      onShare && !message.recalled && canShareMessage(message)
                        ? () => onShare(message)
                        : undefined
                    }
                    onReaction={
                      onReaction && !message.recalled
                        ? (reactionId) => onReaction(message, reactionId)
                        : undefined
                    }
                    onShowDetail={() => openDetail(message, own)}
                    onSaveVideo={
                      canSaveVideoFromMessage(message)
                        ? () => setSaveMedia({ kind: "video", message })
                        : undefined
                    }
                    onSaveAlbum={
                      canSaveAlbumFromMessage(message)
                        ? () => setSaveMedia({ kind: "album", message })
                        : undefined
                    }
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
