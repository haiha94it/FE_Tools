"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { useChatInitialScroll } from "@/hooks/use-chat-initial-scroll";
import { useChatNewMessageScroll } from "@/hooks/use-chat-new-message-scroll";
import { filterDisplayMessages } from "@/lib/zalo-messenger-message-utils";
import {
  captureChatScrollPrependAnchor,
  captureFirstVisibleMessageAnchor,
  restoreChatScrollAfterPrepend,
  type ChatScrollPrependAnchor,
} from "@/lib/zalo-messenger-scroll";
import {
  getConversationAvatar,
  getConversationSubtitle,
  getConversationTitle,
  hasMorePages,
  isGroupConversation,
} from "@/lib/zalo-messenger-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type {
  DisplayMessage,
  MessengerAttachmentDraft,
  MessengerCategoryLabel,
  MessengerConversation,
  MessengerFastReply,
  MessengerMentionInfo,
  MessengerStickerItem,
} from "@/types/zalo-messenger";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import ChatComposer from "./ChatComposer";
import ChatHeaderMenu from "./ChatHeaderMenu";
import ChatScrollToBottom from "./ChatScrollToBottom";
import GroupMembersPanel from "./GroupMembersPanel";
import { useGroupMembers } from "@/hooks/use-group-members";
import { MessageList } from "./MessageBubble";

const SCROLL_TOP_THRESHOLD = 80;

interface ChatPanelProps {
  accountId: number | null;
  accountLabel?: string;
  conversation: MessengerConversation | null;
  messages: DisplayMessage[];
  composerText: string;
  quoteMessage?: DisplayMessage | null;
  attachmentDrafts?: MessengerAttachmentDraft[];
  fastReplies?: MessengerFastReply[];
  uploadingAttachment?: boolean;
  groupMembers?: ZaloGroupMember[];
  loading?: boolean;
  loadingMore?: boolean;
  messageLinks: { next?: string | null } | null;
  wsConnected?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  onComposerChange: (value: string) => void;
  onSend: (mentionInfo: MessengerMentionInfo[]) => void;
  onLoadOlder: () => void;
  onClearQuote?: () => void;
  onUploadFiles?: (files: File[]) => void;
  onRemoveAttachment?: (index: number) => void;
  onApplyFastReply?: (
    item: MessengerFastReply,
    options?: { text?: string },
  ) => void;
  onReply?: (message: DisplayMessage) => void;
  onReaction?: (message: DisplayMessage, reactionId: number) => void;
  onShare?: (message: DisplayMessage) => void;
  onSendSticker?: (sticker: MessengerStickerItem) => void;
  onPin?: (pinning: boolean) => void;
  onSaveNote?: (note: string) => Promise<void>;
  labelCategories?: MessengerCategoryLabel[];
  onToggleLabel?: (
    category: MessengerCategoryLabel,
    assigned: boolean,
  ) => Promise<void>;
}

function ChatPanel({
  accountId,
  accountLabel,
  conversation,
  messages,
  composerText,
  quoteMessage = null,
  attachmentDrafts = [],
  fastReplies = [],
  uploadingAttachment = false,
  groupMembers: groupMembersProp,
  loading = false,
  loadingMore = false,
  messageLinks,
  wsConnected = true,
  showBack = false,
  onBack,
  onComposerChange,
  onSend,
  onLoadOlder,
  onClearQuote,
  onUploadFiles,
  onRemoveAttachment,
  onApplyFastReply,
  onReply,
  onReaction,
  onShare,
  onSendSticker,
  onPin,
  onSaveNote,
  labelCategories = [],
  onToggleLabel,
}: ChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingOlderRef = useRef(false);
  const isPrependingOlderRef = useRef(false);
  const prependAnchorRef = useRef<ChatScrollPrependAnchor | null>(null);
  const prependMessageCountRef = useRef(0);

  const displayMessages = useMemo(
    () => filterDisplayMessages(messages),
    [messages],
  );
  const displayMessageCount = displayMessages.length;

  const hasOlder = hasMorePages(messageLinks);
  const isGroup = conversation ? isGroupConversation(conversation) : false;
  const groupId = conversation?.group?.id ?? null;

  const hookMembers = useGroupMembers(
    accountId,
    groupId,
    isGroup && Boolean(groupId) && !groupMembersProp,
  );

  const groupMembers = groupMembersProp ?? hookMembers.members;
  const groupMembersLoading = groupMembersProp
    ? false
    : hookMembers.isLoading;
  const groupMembersRefreshing = groupMembersProp
    ? false
    : hookMembers.isRefreshing;
  const refreshMembers = groupMembersProp
    ? () => undefined
    : hookMembers.refreshMembers;

  const {
    newMessageCount,
    markNotStuckToBottom,
    handleScrollBottomTracking,
    scrollToBottom,
  } = useChatNewMessageScroll({
    conversationId: conversation?.id,
    messagesLoading: loading,
    messagesLoadingMore: loadingMore,
    messageCount: displayMessageCount,
    scrollRef,
    bottomAnchorRef: bottomRef,
    pauseTrackingRef: isPrependingOlderRef,
  });

  useChatInitialScroll(
    conversation?.id,
    loading,
    displayMessageCount,
    scrollRef,
    bottomRef,
  );

  useEffect(() => {
    isPrependingOlderRef.current = false;
    loadingOlderRef.current = false;
    prependAnchorRef.current = null;
    prependMessageCountRef.current = 0;
  }, [conversation?.id]);

  const loadOlder = useCallback(() => {
    if (!hasOlder || loadingMore || loading || loadingOlderRef.current) return;

    const node = scrollRef.current;
    if (node) {
      const messageAnchor = captureFirstVisibleMessageAnchor(node);
      prependAnchorRef.current = captureChatScrollPrependAnchor(
        node,
        messageAnchor,
      );
      isPrependingOlderRef.current = true;
      prependMessageCountRef.current = displayMessageCount;
    }

    loadingOlderRef.current = true;
    markNotStuckToBottom();
    onLoadOlder();
  }, [
    displayMessageCount,
    hasOlder,
    loading,
    loadingMore,
    markNotStuckToBottom,
    onLoadOlder,
  ]);

  useEffect(() => {
    if (!loadingMore) {
      loadingOlderRef.current = false;
    }
  }, [loadingMore]);

  useLayoutEffect(() => {
    if (!isPrependingOlderRef.current) return;

    const node = scrollRef.current;
    const anchor = prependAnchorRef.current;
    if (!node || !anchor) {
      isPrependingOlderRef.current = false;
      return;
    }

    const hasNewMessages =
      displayMessageCount > prependMessageCountRef.current;

    if (hasNewMessages) {
      restoreChatScrollAfterPrepend(node, anchor);
    }

    if (!loadingMore) {
      requestAnimationFrame(() => {
        const scrollNode = scrollRef.current;
        const pendingAnchor = prependAnchorRef.current;
        if (scrollNode && pendingAnchor && hasNewMessages) {
          restoreChatScrollAfterPrepend(scrollNode, pendingAnchor);
        }
        isPrependingOlderRef.current = false;
        prependAnchorRef.current = null;
      });
    }
  }, [displayMessageCount, loadingMore]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;
    if (!node) return;

    handleScrollBottomTracking();

    if (
      !hasOlder ||
      loadingMore ||
      loading ||
      loadingOlderRef.current ||
      isPrependingOlderRef.current
    ) {
      return;
    }

    if (node.scrollTop <= SCROLL_TOP_THRESHOLD) {
      loadOlder();
    }
  }, [
    handleScrollBottomTracking,
    hasOlder,
    loadOlder,
    loading,
    loadingMore,
  ]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;
    node.addEventListener("scroll", handleScroll, { passive: true });
    return () => node.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (!accountId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl dark:bg-brand-500/10">
          💬
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-white/80">
          Chọn tài khoản Zalo
        </p>
        <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
          Bắt đầu từ cột trái để xem hội thoại và trả lời khách.
        </p>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl dark:bg-gray-800">
          ✉️
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-white/80">
          Chọn hội thoại
        </p>
        <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400">
          Chọn một hội thoại bên trái để bắt đầu chat.
        </p>
      </div>
    );
  }

  const title = getConversationTitle(conversation);
  const avatar = getConversationAvatar(conversation);
  const subtitle = getConversationSubtitle(conversation, wsConnected);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 items-center gap-3 border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 md:hidden"
            aria-label="Quay lại"
          >
            ←
          </button>
        ) : null}

        <ContactAvatar name={title} avatar={avatar} size="md" />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {title}
            {conversation.pinning ? " 📌" : ""}
          </h2>
          {accountLabel ? (
            <p className="truncate text-xs font-medium text-brand-600 xl:hidden dark:text-brand-400">
              {accountLabel}
            </p>
          ) : null}
          {subtitle ? (
            <p className="hidden truncate text-xs text-gray-500 xl:block dark:text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        {isGroup && groupId ? (
          <GroupMembersPanel
            members={groupMembers}
            isLoading={groupMembersLoading}
            isRefreshing={groupMembersRefreshing}
            onRefresh={refreshMembers}
          />
        ) : null}

        {onPin && onSaveNote ? (
          <ChatHeaderMenu
            conversation={conversation}
            labelCategories={labelCategories}
            onPin={onPin}
            onSaveNote={onSaveNote}
            onToggleLabel={onToggleLabel}
          />
        ) : null}
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="custom-scrollbar absolute inset-0 overflow-x-hidden overflow-y-auto overscroll-contain bg-gradient-to-b from-gray-50/80 to-white px-2 py-4 max-md:px-3 dark:from-gray-900/50 dark:to-gray-900 lg:px-4"
        >
          {loadingMore ? (
            <div className="mb-3 flex justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : null}

          {loading && messages.length > 0 ? (
            <div className="pointer-events-none absolute inset-x-3 top-2 z-10 flex justify-center sm:inset-x-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent bg-white/80 p-3 dark:bg-gray-900/80" />
            </div>
          ) : null}

          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : (
            <MessageList
              messages={messages}
              isGroup={isGroup}
              groupMembers={groupMembers}
              onReply={onReply}
              onReaction={onReaction}
              onShare={onShare}
            />
          )}
          <div ref={bottomRef} className="h-px w-full shrink-0" aria-hidden />
        </div>

        <ChatScrollToBottom
          scrollRef={scrollRef}
          newCount={newMessageCount}
          onScrollToBottom={() => scrollToBottom()}
        />
      </div>

      <ChatComposer
        accountId={accountId}
        conversationId={conversation.id}
        groupId={groupId}
        value={composerText}
        disabled={!conversation}
        uploading={uploadingAttachment}
        isGroup={isGroup}
        groupMembers={groupMembers}
        quoteMessage={quoteMessage}
        attachments={attachmentDrafts}
        fastReplies={fastReplies}
        onChange={onComposerChange}
        onSend={onSend}
        onClearQuote={onClearQuote}
        onUploadFiles={onUploadFiles}
        onRemoveAttachment={onRemoveAttachment}
        onApplyFastReply={onApplyFastReply}
        onSendSticker={onSendSticker}
      />
    </div>
  );
}

export default memo(ChatPanel);