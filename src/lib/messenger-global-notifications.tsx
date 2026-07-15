"use client";

import MessengerGlobalToastCard from "@/components/zalo-messages/MessengerGlobalToastCard";
import "@/components/zalo-messages/messenger-global-toast.css";
import { normalizeIncomingMessage } from "@/lib/zalo-messenger-message-utils";
import {
  getAccountLabel,
  getConversationAvatar,
  getConversationTitle,
  getMessageText,
  isOwnMessage,
} from "@/lib/zalo-messenger-utils";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import type {
  DisplayMessage,
  MessengerConversation,
  RawZaloMessage,
} from "@/types/zalo-messenger";
import { toast as sonnerToast } from "sonner";
import {
  clearMessengerTabAlert,
  pushMessengerTabAlert,
  showMessengerDesktopNotification,
} from "./messenger-browser-tab-notification";

export const ZALO_MESSAGES_PATH_PREFIX = "/zalo-messages";

let pathnameGetter: () => string = () =>
  typeof window !== "undefined" ? window.location.pathname : "";

let navigateToHref: (href: string) => void = (href) => {
  if (typeof window !== "undefined") {
    window.location.assign(href);
  }
};

export function registerMessengerPathnameGetter(getter: () => string) {
  pathnameGetter = getter;
}

export function registerMessengerNavigator(navigate: (href: string) => void) {
  navigateToHref = navigate;
}

export function isOnZaloMessagesPage(pathname = pathnameGetter()): boolean {
  return (
    pathname === ZALO_MESSAGES_PATH_PREFIX ||
    pathname.startsWith(`${ZALO_MESSAGES_PATH_PREFIX}/`)
  );
}

/** In-page toast: only when user is outside zalo-messages. */
export function shouldShowGlobalMessengerNotification(
  pathname = pathnameGetter(),
): boolean {
  return !isOnZaloMessagesPage(pathname);
}

/** Chrome tab / desktop: when off messenger, or tab is in background. */
export function shouldShowMessengerTabNotification(
  pathname = pathnameGetter(),
): boolean {
  if (typeof document !== "undefined" && document.hidden) return true;
  return !isOnZaloMessagesPage(pathname);
}

export { clearMessengerTabAlert };

export interface MessengerGlobalToastInput {
  senderName: string;
  sourceLabel: string;
  preview: string;
  href: string;
  toastId: string;
  avatarUrl?: string | null;
}

function buildZaloMessengerPath(
  accountId: number,
  conversationId: number,
): string {
  return `${ZALO_MESSAGES_PATH_PREFIX}/${accountId}/${conversationId}`;
}

function resolveZaloSourceLabel(accountId: number): string {
  const account = useZaloMessengerStore
    .getState()
    .accounts.find((item) => item.id === accountId);
  return getAccountLabel(account ?? null);
}

function getZaloMessagePreview(message: DisplayMessage): string {
  const text = getMessageText(message).trim();
  if (text === "/-strong") {
    return "👍 [Like]";
  }
  if (text) {
    return text.length > 72 ? `${text.slice(0, 72)}…` : text;
  }
  if (message.msgType === "group.media") {
    const count =
      message.groupMedia?.totalItems ??
      message.groupMedia?.items.length ??
      0;
    return count > 1 ? `[Album ${count} mục]` : "[Album]";
  }
  if (message.msgType === "chat.photo") return "[Hình ảnh]";
  if (message.msgType === "chat.video.msg") return "[Video]";
  if (message.msgType === "chat.gif") return "[GIF]";
  if (message.msgType === "chat.voice") return "[Tin thoại]";
  if (message.msgType === "chat.location.new") return "[Vị trí]";
  if (message.msgType === "chat.ecard") return "[Nhắc hẹn]";
  if (message.msgType === "chat.recommended") return "[Danh thiếp]";
  if (message.attachments?.length) return "[Tệp đính kèm]";
  if (message.sticker?.length) return "[Sticker]";
  return "Bạn có tin nhắn mới";
}

export function showMessengerGlobalToast(input: MessengerGlobalToastInput) {
  const openInbox = () => {
    navigateToHref(input.href);
    sonnerToast.dismiss(input.toastId);
    clearMessengerTabAlert();
  };

  sonnerToast.custom(
    () => (
      <MessengerGlobalToastCard
        senderName={input.senderName}
        sourceLabel={input.sourceLabel}
        preview={input.preview}
        avatarUrl={input.avatarUrl}
        onOpen={openInbox}
      />
    ),
    {
      id: input.toastId,
      duration: 8000,
      className: "messenger-global-toast",
      unstyled: true,
    },
  );
}

/** In-page toast + Chrome tab title/favicon + optional desktop notification. */
export function emitMessengerNotification(input: MessengerGlobalToastInput) {
  const showToast = shouldShowGlobalMessengerNotification();
  const showTab = shouldShowMessengerTabNotification();

  if (!showToast && !showTab) return;

  if (showToast) {
    showMessengerGlobalToast(input);
  }

  if (showTab) {
    pushMessengerTabAlert({
      channel: "zalo",
      senderName: input.senderName,
      preview: input.preview,
      toastId: input.toastId,
    });
    showMessengerDesktopNotification({
      channel: "zalo",
      senderName: input.senderName,
      preview: input.preview,
      toastId: input.toastId,
    });
  }
}

export function notifyZaloIncomingMessage(
  raw: RawZaloMessage,
  conversation?: MessengerConversation | null,
) {
  const message = normalizeIncomingMessage(raw);
  if (isOwnMessage(message)) return;
  if (
    !shouldShowGlobalMessengerNotification() &&
    !shouldShowMessengerTabNotification()
  ) {
    return;
  }

  const conversationId = Number(message.conversation_id ?? conversation?.id);
  const accountId = Number(conversation?.account);
  if (!Number.isFinite(conversationId) || !Number.isFinite(accountId)) return;

  const senderName = conversation
    ? getConversationTitle(conversation)
    : `Hội thoại #${conversationId}`;

  emitMessengerNotification({
    senderName,
    sourceLabel: resolveZaloSourceLabel(accountId),
    preview: getZaloMessagePreview(message),
    href: buildZaloMessengerPath(accountId, conversationId),
    avatarUrl: conversation ? getConversationAvatar(conversation) : null,
    toastId: `zalo-${accountId}-${conversationId}`,
  });
}

export function notifyZaloConversationActivity(
  payload: MessengerConversation & { new_message?: boolean },
) {
  if (!payload.new_message) return;
  if (
    !shouldShowGlobalMessengerNotification() &&
    !shouldShowMessengerTabNotification()
  ) {
    return;
  }

  const accountId = payload.account;
  if (!Number.isFinite(accountId)) return;

  emitMessengerNotification({
    senderName: getConversationTitle(payload),
    sourceLabel: resolveZaloSourceLabel(Number(accountId)),
    preview: "Bạn có tin nhắn mới",
    href: buildZaloMessengerPath(Number(accountId), payload.id),
    avatarUrl: getConversationAvatar(payload),
    toastId: `zalo-${accountId}-${payload.id}`,
  });
}