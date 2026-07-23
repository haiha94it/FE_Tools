"use client";

import { useMessengerSend } from "@/hooks/use-messenger-send";
import { useStableHandler } from "@/hooks/use-stable-handler";
import { extractNextPage } from "@/lib/zalo-messenger-utils";
import { toast } from "@/lib/toast";
import {
  getConversationHasMore,
  useZaloMessengerStore,
} from "@/stores/use-zalo-messenger-store";
import type {
  MessengerCategoryLabel,
  MessengerConversation,
  MessengerConversationFilter,
} from "@/types/zalo-messenger";
import { canManageLabelDefinitions } from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "next/navigation";
import { memo, useCallback, useEffect, useState } from "react";
import ConversationNoteDialog from "./ConversationNoteDialog";
import ConversationPanel from "./ConversationPanel";
import CreateGroupDialog from "./CreateGroupDialog";
import LabelManageDialog from "./LabelManageDialog";
import StrangerPhoneDialog from "./StrangerPhoneDialog";

interface MessengerConversationColumnProps {
  showMobileBack?: boolean;
}

function MessengerConversationColumn({
  showMobileBack = false,
}: MessengerConversationColumnProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canManageLabels = canManageLabelDefinitions(user);
  const [manageLabelsOpen, setManageLabelsOpen] = useState(false);
  const [strangerPhoneOpen, setStrangerPhoneOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [noteConversation, setNoteConversation] =
    useState<MessengerConversation | null>(null);
  const [savingNote, setSavingNote] = useState(false);

  const selectedAccountId = useZaloMessengerStore((s) => s.selectedAccountId);
  const conversations = useZaloMessengerStore((s) => s.conversations);
  const conversationLinks = useZaloMessengerStore((s) => s.conversationLinks);
  const conversationSearch = useZaloMessengerStore((s) => s.conversationSearch);
  const conversationFilter = useZaloMessengerStore((s) => s.conversationFilter);
  const labelCategories = useZaloMessengerStore((s) => s.labelCategories);
  const labelCategoriesLoading = useZaloMessengerStore(
    (s) => s.labelCategoriesLoading,
  );
  const selectedCategoryId = useZaloMessengerStore((s) => s.selectedCategoryId);
  const conversationsLoading = useZaloMessengerStore(
    (s) => s.conversationsLoading,
  );
  const conversationsLoadingMore = useZaloMessengerStore(
    (s) => s.conversationsLoadingMore,
  );
  const activeConversationId = useZaloMessengerStore(
    (s) => s.activeConversationId,
  );

  const fetchConversations = useZaloMessengerStore((s) => s.fetchConversations);
  const fetchLabelCategories = useZaloMessengerStore(
    (s) => s.fetchLabelCategories,
  );
  const applyConversationFilter = useZaloMessengerStore(
    (s) => s.applyConversationFilter,
  );
  const applyInboxFilter = useZaloMessengerStore((s) => s.applyInboxFilter);
  const submitConversationSearch = useZaloMessengerStore(
    (s) => s.submitConversationSearch,
  );
  const markAllConversationsRead = useZaloMessengerStore(
    (s) => s.markAllConversationsRead,
  );
  const pinConversation = useZaloMessengerStore((s) => s.pinConversation);
  const saveConversationNote = useZaloMessengerStore(
    (s) => s.saveConversationNote,
  );
  const assignConversationLabel = useZaloMessengerStore(
    (s) => s.assignConversationLabel,
  );
  const removeConversationLabel = useZaloMessengerStore(
    (s) => s.removeConversationLabel,
  );

  const { sendStrangerPhone } = useMessengerSend();

  useEffect(() => {
    if (!selectedAccountId) return;
    void fetchLabelCategories(selectedAccountId);
  }, [selectedAccountId, fetchLabelCategories]);

  const handleSelect = useCallback(
    (conversation: MessengerConversation) => {
      if (!selectedAccountId) return;
      router.push(`/zalo-messages/${selectedAccountId}/${conversation.id}`);
    },
    [router, selectedAccountId],
  );

  const handleGroupCreated = useCallback(
    (conversationId?: number) => {
      if (!selectedAccountId) return;
      // Chờ list refresh trước khi mở chat — tránh selectConversation
      // không thấy conv trong sidebar (không còn upsert ghost từ detail)
      void (async () => {
        await fetchConversations(selectedAccountId, { page: 1 });
        if (conversationId != null) {
          router.push(`/zalo-messages/${selectedAccountId}/${conversationId}`);
        }
      })();
    },
    [fetchConversations, router, selectedAccountId],
  );

  const handleLoadMore = useStableHandler(() => {
    if (!selectedAccountId) return;
    const nextPage = extractNextPage(conversationLinks);
    if (!nextPage) return;
    void fetchConversations(selectedAccountId, {
      page: nextPage,
      append: true,
    });
  });

  const handleSearchSubmit = useStableHandler((value: string) => {
    void submitConversationSearch(value);
  });

  const handleFilterChange = useStableHandler(
    (value: MessengerConversationFilter) => {
      void applyConversationFilter(value);
    },
  );

  const handleApplyInboxFilter = useStableHandler(
    (filter: MessengerConversationFilter, categoryId: number | null) => {
      void applyInboxFilter(filter, categoryId);
    },
  );

  const handleMarkAllRead = useStableHandler(async () => {
    if (!selectedAccountId) return;
    try {
      await markAllConversationsRead(selectedAccountId);
      await fetchConversations(selectedAccountId, { page: 1 });
      toast.success("Đã đánh dấu đọc tất cả hội thoại.");
    } catch {
      toast.error("Không cập nhật được trạng thái đọc.");
    }
  });

  const handleSendStrangerPhone = useStableHandler(
    (payload: { phone: string; text: string; imageLink: string | null }) => {
      if (!selectedAccountId) return;
      sendStrangerPhone(selectedAccountId, payload);
    },
  );

  const handlePin = useCallback(
    async (conversation: MessengerConversation) => {
      if (!selectedAccountId) return;
      try {
        await pinConversation(
          selectedAccountId,
          conversation.id,
          !conversation.pinning,
        );
        toast.success(
          conversation.pinning ? "Đã bỏ ghim hội thoại." : "Đã ghim hội thoại.",
        );
      } catch {
        toast.error("Không cập nhật được trạng thái ghim.");
      }
    },
    [pinConversation, selectedAccountId],
  );

  const handleOpenNote = useCallback((conversation: MessengerConversation) => {
    setNoteConversation(conversation);
  }, []);

  const handleSaveNote = useCallback(
    async (note: string) => {
      if (!selectedAccountId || !noteConversation) return;
      setSavingNote(true);
      try {
        await saveConversationNote(
          selectedAccountId,
          noteConversation.id,
          note,
        );
      } finally {
        setSavingNote(false);
      }
    },
    [noteConversation, saveConversationNote, selectedAccountId],
  );

  const handleToggleLabel = useStableHandler(
    async (
      conversation: MessengerConversation,
      category: MessengerCategoryLabel,
      assigned: boolean,
    ) => {
      try {
        if (assigned) {
          await removeConversationLabel(conversation.id, category.id);
          toast.success(`Đã gỡ nhãn "${category.name ?? ""}".`);
        } else {
          await assignConversationLabel(conversation.id, category.id);
          toast.success(`Đã gán nhãn "${category.name ?? ""}".`);
        }
      } catch {
        toast.error("Không cập nhật được nhãn hội thoại.");
      }
    },
  );

  const handleLabelsChanged = useStableHandler(() => {
    if (!selectedAccountId) return;
    void fetchLabelCategories(selectedAccountId, { force: true });
    void fetchConversations(selectedAccountId, { page: 1 });
  });

  return (
    <>
      <div className="shrink-0 border-b border-gray-100 px-3 py-3 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2">
          {showMobileBack ? (
            <button
              type="button"
              onClick={() => router.push("/zalo-messages")}
              className="rounded-lg px-2 py-1 text-xs text-brand-500 lg:hidden"
            >
              ← Tài khoản
            </button>
          ) : null}
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Hội thoại
          </h3>
        </div>
      </div>
      <ConversationPanel
        accountId={selectedAccountId}
        conversations={conversations}
        selectedId={activeConversationId}
        search={conversationSearch}
        filter={conversationFilter}
        labelCategories={labelCategories}
        labelCategoriesLoading={labelCategoriesLoading}
        selectedCategoryId={selectedCategoryId}
        loading={conversationsLoading}
        loadingMore={conversationsLoadingMore}
        hasMore={getConversationHasMore(conversationLinks)}
        onSearchSubmit={handleSearchSubmit}
        onFilterChange={handleFilterChange}
        onApplyInboxFilter={handleApplyInboxFilter}
        onMarkAllRead={() => void handleMarkAllRead()}
        onOpenSendPhone={() => setStrangerPhoneOpen(true)}
        onOpenCreateGroup={() => setCreateGroupOpen(true)}
        onOpenManageLabels={
          canManageLabels ? () => setManageLabelsOpen(true) : undefined
        }
        onSelect={handleSelect}
        onLoadMore={handleLoadMore}
        onPin={(conversation) => void handlePin(conversation)}
        onOpenNote={handleOpenNote}
        onToggleLabel={handleToggleLabel}
      />

      {selectedAccountId ? (
        <>
          <LabelManageDialog
            accountId={selectedAccountId}
            open={manageLabelsOpen}
            onClose={() => setManageLabelsOpen(false)}
            onLabelsChanged={handleLabelsChanged}
            canManageDefinitions={canManageLabels}
          />
          <StrangerPhoneDialog
            open={strangerPhoneOpen}
            onClose={() => setStrangerPhoneOpen(false)}
            onSend={handleSendStrangerPhone}
          />
          <CreateGroupDialog
            open={createGroupOpen}
            accountId={selectedAccountId}
            onClose={() => setCreateGroupOpen(false)}
            onCreated={handleGroupCreated}
          />
        </>
      ) : null}

      <ConversationNoteDialog
        open={Boolean(noteConversation)}
        conversation={noteConversation}
        saving={savingNote}
        onClose={() => setNoteConversation(null)}
        onSave={handleSaveNote}
      />
    </>
  );
}

export default memo(MessengerConversationColumn);