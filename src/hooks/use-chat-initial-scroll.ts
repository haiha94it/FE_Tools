"use client";

import {
  CHAT_SCROLL_BOTTOM_THRESHOLD,
  scrollChatToBottom,
} from "@/lib/zalo-messenger-scroll";
import { useEffect, useRef, type RefObject } from "react";

export function useChatInitialScroll(
  conversationId: number | null | undefined,
  messagesLoading: boolean,
  messageCount: number,
  scrollRef: RefObject<HTMLDivElement | null>,
  bottomAnchorRef: RefObject<HTMLDivElement | null>,
) {
  const hasInitialScrolledRef = useRef(false);
  const hasStartedLoadingRef = useRef(false);

  useEffect(() => {
    if (!conversationId) return;
    hasInitialScrolledRef.current = false;
    hasStartedLoadingRef.current = false;
  }, [conversationId]);

  useEffect(() => {
    if (messagesLoading) {
      hasStartedLoadingRef.current = true;
    }
  }, [messagesLoading]);

  useEffect(() => {
    if (!conversationId || hasInitialScrolledRef.current) return;
    if (!hasStartedLoadingRef.current || messagesLoading) return;
    if (messageCount === 0) return;

    hasInitialScrolledRef.current = true;

    const snapToLatest = (force = false) => {
      const node = scrollRef.current;
      if (!node) return;

      if (!force) {
        const distanceFromBottom =
          node.scrollHeight - node.scrollTop - node.clientHeight;
        if (distanceFromBottom > CHAT_SCROLL_BOTTOM_THRESHOLD) return;
      }

      bottomAnchorRef.current?.scrollIntoView({
        block: "end",
        inline: "nearest",
      });
      scrollChatToBottom(node);
    };

    snapToLatest(true);
    requestAnimationFrame(() => {
      snapToLatest(true);
      requestAnimationFrame(() => snapToLatest(true));
    });

    const timer = window.setTimeout(() => snapToLatest(true), 120);

    const node = scrollRef.current;
    const observer = node
      ? new ResizeObserver(() => {
          snapToLatest(false);
        })
      : null;
    if (node && observer) {
      observer.observe(node);
    }
    const disconnectTimer = window.setTimeout(() => observer?.disconnect(), 4000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(disconnectTimer);
      observer?.disconnect();
    };
  }, [
    bottomAnchorRef,
    conversationId,
    messageCount,
    messagesLoading,
    scrollRef,
  ]);
}