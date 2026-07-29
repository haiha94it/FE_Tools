"use client";

import { useGroupMembers } from "@/hooks/use-group-members";
import { useMessengerSend } from "@/hooks/use-messenger-send";
import { useStableHandler } from "@/hooks/use-stable-handler";
import {
  extractNextPage,
  getAccountLabel,
  isGroupConversation,
} from "@/lib/zalo-messenger-utils";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  DisplayMessage,
  MessengerCategoryLabel,
  MessengerMentionInfo,
} from "@/types/zalo-messenger";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { memo, useCallback, useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";

const MessageShareDialog = dynamic(() => import("./MessageShareDialog"), {
  ssr: false,
});
interface MessengerChatColumnProps {
  showMobileBack?: boolean;
}

function MessengerChatColumn({ showMobileBack = false }: MessengerChatColumnProps) {
  const router = useRouter();
  const wsStatus = useWebSocketStore((s) => s.status);

  const accounts = useZaloMessengerStore((s) => s.accounts);
  const conversations = useZaloMessengerStore((s) => s.conversations);
  const conversationsLoading = useZaloMessengerStore(
    (s) => s.conversationsLoading,
  );
  const selectedAccountId = useZaloMessengerStore((s) => s.selectedAccountId);
  const activeConversation = useZaloMessengerStore((s) => s.activeConversation);
  const messages = useZaloMessengerStore((s) => s.messages);
  const messageLinks = useZaloMessengerStore((s) => s.messageLinks);
  const messagesLoading = useZaloMessengerStore((s) => s.messagesLoading);
  const messagesLoadingMore = useZaloMessengerStore(
    (s) => s.messagesLoadingMore,
  );
  const composerText = useZaloMessengerStore((s) => s.composerText);
  const quoteMessage = useZaloMessengerStore((s) => s.quoteMessage);
  const attachmentDrafts = useZaloMessengerStore((s) => s.attachmentDrafts);
  const fastReplies = useZaloMessengerStore((s) => s.fastReplies);
  const uploadingAttachment = useZaloMessengerStore((s) => s.uploadingAttachment);
  const activeConversationId = useZaloMessengerStore(
    (s) => s.activeConversationId,
  );

  const fetchMessages = useZaloMessengerStore((s) => s.fetchMessages);
  const setComposerText = useZaloMessengerStore((s) => s.setComposerText);
  const setQuoteMessage = useZaloMessengerStore((s) => s.setQuoteMessage);
  const uploadAttachments = useZaloMessengerStore((s) => s.uploadAttachments);
  const removeAttachmentDraft = useZaloMessengerStore(
    (s) => s.removeAttachmentDraft,
  );
  const fetchFastReplies = useZaloMessengerStore((s) => s.fetchFastReplies);
  const applyFastReply = useZaloMessengerStore((s) => s.applyFastReply);
  const pinConversation = useZaloMessengerStore((s) => s.pinConversation);
  const saveConversationNote = useZaloMessengerStore(
    (s) => s.saveConversationNote,
  );
  const labelCategories = useZaloMessengerStore((s) => s.labelCategories);
  const assignConversationLabel = useZaloMessengerStore(
    (s) => s.assignConversationLabel,
  );
  const removeConversationLabel = useZaloMessengerStore(
    (s) => s.removeConversationLabel,
  );
  const resetChatState = useZaloMessengerStore((s) => s.resetChatState);
  const refreshActiveConversation = useZaloMessengerStore(
    (s) => s.refreshActiveConversation,
  );

  const selectedAccount = accounts.find((item) => item.id === selectedAccountId);
  const accountUid = selectedAccount?.uid ?? null;
  const {
    send,
    sendSticker,
    sendReaction,
    shareMessage,
  } = useMessengerSend({
    accountUid,
  });
  const [shareTargetMessage, setShareTargetMessage] =
    useState<DisplayMessage | null>(null);

  const isGroup = activeConversation
    ? isGroupConversation(activeConversation)
    : false;
  const groupId = activeConversation?.group?.id ?? null;
  const {
    members: groupMembers,
    isLoading: groupMembersLoading,
    isRefreshing: groupMembersRefreshing,
    refreshMembers,
  } = useGroupMembers(
    selectedAccountId,
    groupId,
    isGroup && Boolean(groupId),
  );

  useEffect(() => {
    if (!selectedAccountId) return;
    void fetchFastReplies(selectedAccountId);
  }, [selectedAccountId, fetchFastReplies]);

  const handleLoadOlder = useStableHandler(() => {
    if (!selectedAccountId || !activeConversationId) return;
    const nextPage = extractNextPage(messageLinks);
    if (!nextPage) return;
    void fetchMessages(selectedAccountId, activeConversationId, {
      page: nextPage,
      append: true,
    });
  });

  const handleBack = useCallback(() => {
    resetChatState();
    if (selectedAccountId) {
      router.push(`/zalo-messages/${selectedAccountId}`);
    }
  }, [resetChatState, router, selectedAccountId]);

  const handleSend = useCallback(
    (mentionInfo: MessengerMentionInfo[]) => {
      void send(mentionInfo);
    },
    [send],
  );

  const handleReply = useCallback(
    (message: DisplayMessage) => {
      setQuoteMessage(message);
    },
    [setQuoteMessage],
  );

  const handlePin = useCallback(
    (pinning: boolean) => {
      if (!selectedAccountId || !activeConversationId) return;
      void pinConversation(
        selectedAccountId,
        activeConversationId,
        pinning,
      );
    },
    [activeConversationId, pinConversation, selectedAccountId],
  );

  const handleShare = useCallback((message: DisplayMessage) => {
    setShareTargetMessage(message);
  }, []);

  const handleReaction = useCallback(
    (message: DisplayMessage, reactionId: number) => {
      void sendReaction(message, reactionId);
    },
    [sendReaction],
  );

  const handleSendSticker = useCallback(
    (sticker: Parameters<typeof sendSticker>[0]) => {
      sendSticker(sticker);
    },
    [sendSticker],
  );

  const handleSaveNote = useCallback(
    async (note: string) => {
      if (!selectedAccountId || !activeConversationId) return;
      await saveConversationNote(
        selectedAccountId,
        activeConversationId,
        note,
      );
    },
    [activeConversationId, saveConversationNote, selectedAccountId],
  );

  const handleToggleLabel = useCallback(
    async (category: MessengerCategoryLabel, assigned: boolean) => {
      if (!activeConversationId) return;
      if (assigned) {
        await removeConversationLabel(activeConversationId, category.id);
      } else {
        await assignConversationLabel(activeConversationId, category.id);
      }
    },
    [activeConversationId, assignConversationLabel, removeConversationLabel],
  );

  return (
    <>
    <ChatPanel
      accountId={selectedAccountId}
      accountLabel={getAccountLabel(selectedAccount ?? null)}
      conversation={activeConversation}
      messages={messages}
      composerText={composerText}
      quoteMessage={quoteMessage}
      attachmentDrafts={attachmentDrafts}
      fastReplies={fastReplies}
      uploadingAttachment={uploadingAttachment}
      groupMembers={groupMembers}
      groupMembersLoading={groupMembersLoading}
      groupMembersRefreshing={groupMembersRefreshing}
      onRefreshGroupMembers={refreshMembers}
      loading={messagesLoading}
      loadingMore={messagesLoadingMore}
      messageLinks={messageLinks}
      wsConnected={wsStatus === "connected"}
      showBack={showMobileBack}
      onBack={handleBack}
      onComposerChange={setComposerText}
      onSend={handleSend}
      onLoadOlder={handleLoadOlder}
      onClearQuote={() => setQuoteMessage(null)}
      onUploadFiles={(files) => void uploadAttachments(files)}
      onRemoveAttachment={removeAttachmentDraft}
      onApplyFastReply={applyFastReply}
      onReply={handleReply}
      onReaction={handleReaction}
      onShare={handleShare}
      onSendSticker={handleSendSticker}
      onPin={handlePin}
      onSaveNote={handleSaveNote}
      labelCategories={labelCategories}
      onToggleLabel={handleToggleLabel}
      onRefreshConversation={() => refreshActiveConversation()}
    />

    <MessageShareDialog
      open={shareTargetMessage != null}
      message={shareTargetMessage}
      conversations={conversations}
      activeConversationId={activeConversationId}
      loading={conversationsLoading}
      onClose={() => setShareTargetMessage(null)}
      onShare={(targets, accompanyText) => {
        if (!shareTargetMessage) return;
        shareMessage(shareTargetMessage, targets, accompanyText);
      }}
    />
    </>
  );
}

export default memo(MessengerChatColumn);