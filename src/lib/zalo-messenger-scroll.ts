import type { DisplayMessage } from "@/types/zalo-messenger";

export const CHAT_SCROLL_BOTTOM_THRESHOLD = 120;

export function scrollChatToBottom(node: HTMLElement | null) {
  if (!node) return;
  const maxScrollTop = Math.max(0, node.scrollHeight - node.clientHeight);
  node.scrollTop = maxScrollTop;
}

export interface ChatScrollPrependAnchor {
  scrollHeight: number;
  scrollTop: number;
  messageId?: string | null;
  offsetFromViewportTop?: number;
}

export function getMessageScrollAnchorId(
  message: Pick<DisplayMessage, "id" | "clientMsgId" | "cliMsgId">,
): string | null {
  if (message.id != null) {
    return String(message.id);
  }
  const clientId = message.clientMsgId ?? message.cliMsgId;
  if (clientId) return `cli:${clientId}`;
  return null;
}

export function captureFirstVisibleMessageAnchor(
  container: HTMLElement,
): Pick<ChatScrollPrependAnchor, "messageId" | "offsetFromViewportTop"> | null {
  const containerTop = container.getBoundingClientRect().top;
  const anchors = container.querySelectorAll<HTMLElement>("[data-scroll-anchor]");

  for (const element of anchors) {
    const elementBottom = element.getBoundingClientRect().bottom;
    if (elementBottom <= containerTop) continue;

    const messageId = element.dataset.scrollAnchor;
    if (!messageId) continue;

    return {
      messageId,
      offsetFromViewportTop:
        element.getBoundingClientRect().top - containerTop,
    };
  }

  return null;
}

export function captureChatScrollPrependAnchor(
  container: HTMLElement,
  messageAnchor?: Pick<
    ChatScrollPrependAnchor,
    "messageId" | "offsetFromViewportTop"
  > | null,
): ChatScrollPrependAnchor {
  return {
    scrollHeight: container.scrollHeight,
    scrollTop: container.scrollTop,
    messageId: messageAnchor?.messageId ?? null,
    offsetFromViewportTop: messageAnchor?.offsetFromViewportTop,
  };
}

export function restoreChatScrollAfterPrepend(
  container: HTMLElement,
  anchor: ChatScrollPrependAnchor,
): boolean {
  if (anchor.messageId && anchor.offsetFromViewportTop != null) {
    const escapedId = anchor.messageId
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
    const element = container.querySelector<HTMLElement>(
      `[data-scroll-anchor="${escapedId}"]`,
    );
    if (element) {
      const containerTop = container.getBoundingClientRect().top;
      const currentOffset = element.getBoundingClientRect().top - containerTop;
      container.scrollTop += currentOffset - anchor.offsetFromViewportTop;
      return true;
    }
  }

  const heightDelta = container.scrollHeight - anchor.scrollHeight;
  container.scrollTop = anchor.scrollTop + heightDelta;
  return heightDelta !== 0 || anchor.scrollTop !== container.scrollTop;
}

export function isChatNearBottom(
  node: HTMLElement,
  threshold = CHAT_SCROLL_BOTTOM_THRESHOLD,
): boolean {
  const distanceFromBottom =
    node.scrollHeight - node.scrollTop - node.clientHeight;
  return distanceFromBottom <= threshold;
}
