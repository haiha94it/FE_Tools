"use client";

import {
  CHAT_SCROLL_BOTTOM_THRESHOLD,
  scrollChatToBottom,
} from "@/lib/zalo-messenger-scroll";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";

interface UseChatNewMessageScrollOptions {
  conversationId: number | null | undefined;
  messagesLoading: boolean;
  messagesLoadingMore?: boolean;
  messageCount: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  bottomAnchorRef: RefObject<HTMLDivElement | null>;
  pauseTrackingRef?: RefObject<boolean>;
}

export function useChatNewMessageScroll({
  conversationId,
  messagesLoading,
  messagesLoadingMore = false,
  messageCount,
  scrollRef,
  bottomAnchorRef,
  pauseTrackingRef,
}: UseChatNewMessageScrollOptions) {
  const stickToBottomRef = useRef(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const previousMessageCountRef = useRef(0);

  const handleScrollBottomTracking = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    const distanceFromBottom =
      node.scrollHeight - node.scrollTop - node.clientHeight;
    stickToBottomRef.current =
      distanceFromBottom <= CHAT_SCROLL_BOTTOM_THRESHOLD;
    if (stickToBottomRef.current) {
      setNewMessageCount(0);
    }
  }, [scrollRef]);

  const clearNewMessageCount = useCallback(() => {
    setNewMessageCount(0);
    stickToBottomRef.current = true;
  }, []);

  const markNotStuckToBottom = useCallback(() => {
    stickToBottomRef.current = false;
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTo({ top: node.scrollHeight, behavior });
      clearNewMessageCount();
    },
    [clearNewMessageCount, scrollRef],
  );

  const resetConversationScrollState = useCallback(() => {
    stickToBottomRef.current = true;
    setNewMessageCount(0);
    previousMessageCountRef.current = 0;
  }, []);

  useEffect(() => {
    resetConversationScrollState();
  }, [conversationId, resetConversationScrollState]);

  useEffect(() => {
    if (!conversationId || messagesLoading) return;

    const previousCount = previousMessageCountRef.current;
    const nextCount = messageCount;
    const isLoadingOlder = Boolean(
      messagesLoadingMore || pauseTrackingRef?.current,
    );

    if (
      nextCount > previousCount &&
      !stickToBottomRef.current &&
      !isLoadingOlder
    ) {
      setNewMessageCount((current) => current + (nextCount - previousCount));
    }
    previousMessageCountRef.current = nextCount;

    if (isLoadingOlder) return;

    const node = scrollRef.current;
    if (!node || !stickToBottomRef.current) return;

    bottomAnchorRef.current?.scrollIntoView({
      block: "end",
      inline: "nearest",
    });
    scrollChatToBottom(node);
  }, [
    bottomAnchorRef,
    conversationId,
    messageCount,
    messagesLoading,
    messagesLoadingMore,
    pauseTrackingRef,
    scrollRef,
  ]);

  return {
    stickToBottomRef,
    newMessageCount,
    clearNewMessageCount,
    markNotStuckToBottom,
    handleScrollBottomTracking,
    scrollToBottom,
    resetConversationScrollState,
  };
}