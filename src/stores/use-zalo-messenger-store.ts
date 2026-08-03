import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import {
  filterDisplayMessages,
  normalizeIncomingMessages,
} from "@/lib/zalo-messenger-message-utils";
import { isEmployeeUser } from "@/lib/team-collaboration-utils";
import { dedupeInflight } from "@/lib/inflight";
import {
  belongsToOpenChat,
  dedupeConversations,
  extractNextPage,
  generateClientMsgId,
  maxMessengerAccountActivityTime,
  mergeConversationRecords,
  normalizeMessageList,
  parseZaloUpdatedTimeMs,
  scopeConversationsToAccount,
  sortMessengerAccounts,
} from "@/lib/zalo-messenger-utils";
import {
  loadConversationCache,
  messageCacheKey,
  saveConversationCache,
  type ConversationCacheEntry,
  type MessageCacheEntry,
} from "@/stores/messenger-cache";
import { getAssignedLabelIds } from "@/lib/zalo-label-utils";
import { zaloFriendService } from "@/services/zalo-friend.service";
import { zaloLabelService } from "@/services/zalo-label.service";
import { buildResetUnreadWsPayload } from "@/lib/zalo-messenger-ws";
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type { PaginatedResponse, ZaloFriendItem } from "@/types/zalo-contacts";
import { handleConsentChatRequired } from "@/lib/consent-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  buildQuoteDetails,
  detectAttachmentKind,
  isImageAttachmentDraft,
  resolveAttachmentChatType,
  resolveChatType,
} from "@/lib/zalo-messenger-send-utils";
import type {
  DisplayMessage,
  MessengerAccount,
  MessengerAttachmentDraft,
  MessengerCategoryLabel,
  MessengerConversation,
  MessengerConversationFilter,
  MessengerFastReply,
  MessengerMentionInfo,
  MessengerMobilePanel,
  RawZaloMessage,
  SendMessagePayload,
} from "@/types/zalo-messenger";
import { create } from "zustand";

const conversationsInflight = new Map<string, Promise<void>>();
const messagesInflight = new Map<string, Promise<void>>();
/** Dedup mở hội thoại — tránh double GET detail khi Strict Mode / remount race */
const selectConversationInflight = new Map<string, Promise<void>>();
/** Dedup category / fast-reply theo nick */
const labelCategoriesInflight = new Map<number, Promise<void>>();
const fastRepliesInflight = new Map<number, Promise<void>>();
const labelCategoriesAbort = new Map<number, AbortController>();
const fastRepliesAbort = new Map<number, AbortController>();
/** Đã load xong cho account — skip khi remount cùng nick */
let labelCategoriesLoadedFor: number | null = null;
let fastRepliesLoadedFor: number | null = null;
/** Epoch navigation + token loader tách page đầu/load-more để chặn REST race. */
let conversationSelectionGeneration = 0;
let conversationsRequestGeneration = 0;
let conversationsLoadMoreRequestGeneration = 0;
let messagesRequestGeneration = 0;
let messagesLoadMoreRequestGeneration = 0;
/** Chặn response user/session cũ ghi lại state sau logout hoặc đổi user. */
let messengerSessionGeneration = 0;

function abortOtherAccountFetches(keepAccountId: number) {
  for (const [id, ctrl] of labelCategoriesAbort) {
    if (id !== keepAccountId) {
      ctrl.abort();
      labelCategoriesAbort.delete(id);
      labelCategoriesInflight.delete(id);
    }
  }
  for (const [id, ctrl] of fastRepliesAbort) {
    if (id !== keepAccountId) {
      ctrl.abort();
      fastRepliesAbort.delete(id);
      fastRepliesInflight.delete(id);
    }
  }
}
/**
 * Mỗi lần switchAccount tăng 1. Switch cũ sau await thấy gen lệch → dừng,
 * tránh race 25→21 rồi switch 25 ghi đè lại + call API 25.
 */
let accountSwitchGeneration = 0;

/** Hủy inflight / abort khi logout hoặc đổi user — tránh data nick user cũ. */
function clearMessengerRuntimeCaches() {
  conversationsInflight.clear();
  messagesInflight.clear();
  selectConversationInflight.clear();
  for (const ctrl of labelCategoriesAbort.values()) {
    ctrl.abort();
  }
  for (const ctrl of fastRepliesAbort.values()) {
    ctrl.abort();
  }
  labelCategoriesAbort.clear();
  fastRepliesAbort.clear();
  labelCategoriesInflight.clear();
  fastRepliesInflight.clear();
  labelCategoriesLoadedFor = null;
  fastRepliesLoadedFor = null;
  accountSwitchGeneration += 1;
  conversationSelectionGeneration += 1;
  conversationsRequestGeneration += 1;
  conversationsLoadMoreRequestGeneration += 1;
  messagesRequestGeneration += 1;
  messagesLoadMoreRequestGeneration += 1;
  messengerSessionGeneration += 1;
}

const messengerSessionDefaults = {
  accounts: [] as MessengerAccount[],
  accountsLoading: false,
  selectedAccountId: null as number | null,
  conversations: [] as MessengerConversation[],
  conversationLinks: null as { next?: string | null } | null,
  conversationPage: 1,
  conversationSearch: "",
  conversationFilter: "all" as MessengerConversationFilter,
  labelCategories: [] as MessengerCategoryLabel[],
  labelCategoriesLoading: false,
  selectedCategoryId: null as number | null,
  conversationsLoading: false,
  conversationsLoadingMore: false,
  activeConversationId: null as number | null,
  activeConversation: null as MessengerConversation | null,
  messages: [] as DisplayMessage[],
  messageLinks: null as {
    next?: string | null;
    previous?: string | null;
  } | null,
  messagePage: 1,
  messagesLoading: false,
  messagesLoadingMore: false,
  composerText: "",
  quoteMessage: null as DisplayMessage | null,
  attachmentDrafts: [] as MessengerAttachmentDraft[],
  fastReplies: [] as MessengerFastReply[],
  uploadingAttachment: false,
  voiceCallPending: false,
  /** In-call overlay state (browser mic/cam) */
  activeCall: null as null | {
    callType: 0 | 1;
    peerName?: string;
    mediaReady?: boolean;
    callId?: number | string;
    startedAt: number;
    conversationId?: number;
    note?: string;
  },
  mobilePanel: "accounts" as MessengerMobilePanel,
  error: null as string | null,
  conversationCache: {} as Record<number, ConversationCacheEntry>,
  messagesCache: {} as Record<string, MessageCacheEntry>,
};

function buildConversationsRequestKey(
  accountId: number,
  page: number,
  search: string,
  filter: MessengerConversationFilter,
  categoryId: number | null,
  append: boolean,
): string {
  return `${accountId}|${page}|${search}|${filter}|${categoryId ?? ""}|${append ? 1 : 0}`;
}

function patchConversationLabels(
  conversation: MessengerConversation,
  category: MessengerCategoryLabel,
  assigned: boolean,
): MessengerConversation {
  const current = conversation.category_message ?? [];
  const ids = getAssignedLabelIds(conversation);
  const next = assigned
    ? ids.includes(category.id)
      ? current
      : [...current, category]
    : current.filter((entry) =>
        typeof entry === "number"
          ? entry !== category.id
          : entry.id !== category.id,
      );
  return { ...conversation, category_message: next };
}

interface ZaloMessengerState {
  accounts: MessengerAccount[];
  accountsLoading: boolean;
  selectedAccountId: number | null;

  conversations: MessengerConversation[];
  conversationLinks: { next?: string | null } | null;
  conversationPage: number;
  conversationSearch: string;
  conversationFilter: MessengerConversationFilter;
  labelCategories: MessengerCategoryLabel[];
  labelCategoriesLoading: boolean;
  selectedCategoryId: number | null;
  conversationsLoading: boolean;
  conversationsLoadingMore: boolean;

  activeConversationId: number | null;
  activeConversation: MessengerConversation | null;
  messages: DisplayMessage[];
  messageLinks: { next?: string | null; previous?: string | null } | null;
  messagePage: number;
  messagesLoading: boolean;
  messagesLoadingMore: boolean;

  composerText: string;
  quoteMessage: DisplayMessage | null;
  attachmentDrafts: MessengerAttachmentDraft[];
  fastReplies: MessengerFastReply[];
  uploadingAttachment: boolean;
  /** Đang chờ BE/Zalo hoàn tất voice-call (ring) */
  voiceCallPending: boolean;
  activeCall: null | {
    callType: 0 | 1;
    peerName?: string;
    mediaReady?: boolean;
    callId?: number | string;
    startedAt: number;
    conversationId?: number;
    note?: string;
  };
  mobilePanel: MessengerMobilePanel;
  error: string | null;
  conversationCache: Record<number, ConversationCacheEntry>;
  messagesCache: Record<string, MessageCacheEntry>;

  setComposerText: (value: string) => void;
  setVoiceCallPending: (pending: boolean) => void;
  setActiveCall: (
    call: null | {
      callType: 0 | 1;
      peerName?: string;
      mediaReady?: boolean;
      callId?: number | string;
      startedAt: number;
      conversationId?: number;
      note?: string;
    },
  ) => void;
  patchActiveCall: (
    patch: Partial<{
      mediaReady: boolean;
      note: string;
      callId: number | string;
    }>,
  ) => void;
  /** Cập nhật list UID tắt chatbot sau PATCH từ header chat 1-1 */
  setAccountChatbotDisabledUids: (
    accountId: number,
    uids: string[],
  ) => void;
  setQuoteMessage: (message: DisplayMessage | null) => void;
  clearComposer: () => void;
  uploadAttachments: (files: File[]) => Promise<void>;
  removeAttachmentDraft: (index: number) => void;
  fetchFastReplies: (
    accountId: number,
    options?: { force?: boolean },
  ) => Promise<void>;
  saveConversationNote: (
    accountId: number,
    conversationId: number,
    note: string,
  ) => Promise<void>;
  applyFastReply: (
    item: MessengerFastReply,
    options?: { text?: string },
  ) => void;
  createFastReply: (
    accountId: number,
    title: string,
    content: string,
    imageLink?: string,
  ) => Promise<void>;
  editFastReply: (
    accountId: number,
    replyId: number,
    title: string,
    content: string,
    imageLink?: string,
  ) => Promise<void>;
  deleteFastReply: (
    accountId: number,
    replyId: number,
  ) => Promise<string | undefined>;
  setConversationSearch: (value: string) => void;
  setConversationFilter: (value: MessengerConversationFilter) => void;
  setMobilePanel: (panel: MessengerMobilePanel) => void;
  setSelectedAccountId: (id: number | null) => void;
  switchAccount: (accountId: number) => Promise<void>;
  applyConversationFilter: (filter: MessengerConversationFilter) => Promise<void>;
  applyCategoryFilter: (categoryId: number | null) => Promise<void>;
  applyInboxFilter: (
    filter: MessengerConversationFilter,
    categoryId: number | null,
  ) => Promise<void>;
  submitConversationSearch: (search: string) => Promise<void>;
  fetchLabelCategories: (
    accountId: number,
    options?: { force?: boolean },
  ) => Promise<void>;
  assignConversationLabel: (
    conversationId: number,
    categoryId: number,
  ) => Promise<void>;
  removeConversationLabel: (
    conversationId: number,
    categoryId: number,
  ) => Promise<void>;
  markAllConversationsRead: (accountId: number) => Promise<void>;
  resetConversationUnread: (
    accountId: number,
    conversationId: number,
  ) => void;
  fetchFriendsForCreateGroup: (
    accountId: number,
    options?: { search?: string; page?: number },
  ) => Promise<PaginatedResponse<ZaloFriendItem>>;
  createZaloGroup: (payload: {
    name: string;
    accountId: number;
    memberUids: string[];
  }) => Promise<{ ok: boolean; conversationId?: number; message?: string }>;

  fetchAccounts: () => Promise<void>;
  fetchConversations: (
    accountId: number,
    options?: { page?: number; append?: boolean; search?: string },
  ) => Promise<void>;
  selectConversation: (
    accountId: number,
    conversationId: number,
  ) => Promise<void>;
  fetchMessages: (
    accountId: number,
    conversationId: number,
    options?: { page?: number; append?: boolean },
  ) => Promise<void>;
  pinConversation: (
    accountId: number,
    conversationId: number,
    pinning: boolean,
  ) => Promise<void>;
  refreshActiveConversation: () => Promise<void>;
  pinAccount: (accountId: number, pinning: boolean) => Promise<void>;

  mergeConversations: (
    items: MessengerConversation[],
    accountId?: number | null,
  ) => void;
  mergeAccountBadge: (accountId: number, hasUnread: boolean) => void;
  /** WS: bump updated_time + badge + re-sort nick (không REST / không switchAccount) */
  mergeAccountActivity: (
    accountId: number,
    options: {
      ts?: string | number | null;
      hasUnread?: boolean;
    },
  ) => void;
  appendLiveMessages: (
    accountId: number,
    openConversation: MessengerConversation | null,
    accountUid: string | null | undefined,
    rawMessages: RawZaloMessage[],
  ) => void;
  buildOutboundPayloads: (
    accountId: number,
    conversationId: number,
    options?: {
      mentionInfo?: MessengerMentionInfo[];
      accountUid?: string | null;
    },
  ) => SendMessagePayload[];
  prepareConversationSwitch: (conversationId: number) => void;
  resetChatState: () => void;
  /** Xóa toàn bộ state + cache khi logout / đổi user (SPA không F5). */
  resetSession: () => void;
}

export const useZaloMessengerStore = create<ZaloMessengerState>((set, get) => ({
  accounts: [],
  accountsLoading: false,
  selectedAccountId: null,

  conversations: [],
  conversationLinks: null,
  conversationPage: 1,
  conversationSearch: "",
  conversationFilter: "all",
  labelCategories: [],
  labelCategoriesLoading: false,
  selectedCategoryId: null,
  conversationsLoading: false,
  conversationsLoadingMore: false,

  activeConversationId: null,
  activeConversation: null,
  messages: [],
  messageLinks: null,
  messagePage: 1,
  messagesLoading: false,
  messagesLoadingMore: false,

  composerText: "",
  quoteMessage: null,
  attachmentDrafts: [],
  fastReplies: [],
  uploadingAttachment: false,
  voiceCallPending: false,
  activeCall: null,
  mobilePanel: "accounts",
  error: null,
  conversationCache: {},
  messagesCache: {},

  setComposerText: (composerText) => set({ composerText }),
  setVoiceCallPending: (voiceCallPending) => set({ voiceCallPending }),
  setActiveCall: (activeCall) => set({ activeCall }),
  patchActiveCall: (patch) =>
    set((state) =>
      state.activeCall
        ? { activeCall: { ...state.activeCall, ...patch } }
        : state,
    ),

  setAccountChatbotDisabledUids: (accountId, uids) =>
    set((state) => ({
      accounts: state.accounts.map((account) =>
        account.id === accountId
          ? { ...account, chatbot_disabled_friend_uids: uids }
          : account,
      ),
    })),
  setQuoteMessage: (quoteMessage) => set({ quoteMessage }),
  clearComposer: () =>
    set({ composerText: "", attachmentDrafts: [], quoteMessage: null }),
  removeAttachmentDraft: (index) =>
    set((state) => ({
      attachmentDrafts: state.attachmentDrafts.filter((_, i) => i !== index),
    })),

  uploadAttachments: async (files) => {
    if (!files.length) return;
    const { selectedAccountId, activeConversationId } = get();
    const requestSelectionGeneration = conversationSelectionGeneration;
    set({ uploadingAttachment: true, error: null });
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const link = await zaloMessengerService.uploadFile(file);
        if (
          get().selectedAccountId !== selectedAccountId ||
          get().activeConversationId !== activeConversationId ||
          conversationSelectionGeneration !== requestSelectionGeneration
        ) {
          return;
        }
        uploadedCount += 1;
        const { isImage, isVideo } = detectAttachmentKind(file, link);
        set((state) => ({
          attachmentDrafts: [
            ...state.attachmentDrafts,
            { link, name: file.name, isImage, isVideo: Boolean(isVideo) },
          ],
        }));
      } catch (error) {
        if (
          get().selectedAccountId !== selectedAccountId ||
          get().activeConversationId !== activeConversationId ||
          conversationSelectionGeneration !== requestSelectionGeneration
        ) {
          return;
        }
        if (handleConsentChatRequired(error)) {
          set({ error: getApiErrorMessage(error) });
          continue;
        }
        const message =
          getApiErrorMessage(error) ||
          `Không tải được file "${file.name}".`;
        set({ error: message });
        toast.error(message);
      }
    }

    if (
      uploadedCount === 0 &&
      files.length > 0 &&
      conversationSelectionGeneration === requestSelectionGeneration
    ) {
      set({ error: "Không tải file đính kèm được." });
    }

    if (
      get().selectedAccountId === selectedAccountId &&
      get().activeConversationId === activeConversationId &&
      conversationSelectionGeneration === requestSelectionGeneration
    ) {
      set({ uploadingAttachment: false });
    }
  },

  fetchFastReplies: async (accountId, options = {}) => {
    const force = options.force === true;
    if (!force && fastRepliesLoadedFor === accountId) return;
    if (get().selectedAccountId !== accountId) return;

    abortOtherAccountFetches(accountId);

    const inflight = fastRepliesInflight.get(accountId);
    if (inflight) return inflight;

    const controller = new AbortController();
    fastRepliesAbort.set(accountId, controller);

    const run = async () => {
      try {
        const fastReplies = await zaloMessengerService.fetchFastReplies(
          accountId,
          { signal: controller.signal },
        );
        if (get().selectedAccountId !== accountId) return;
        set({ fastReplies });
        fastRepliesLoadedFor = accountId;
      } catch {
        if (controller.signal.aborted) return;
        if (get().selectedAccountId !== accountId) return;
        set({ fastReplies: [] });
        fastRepliesLoadedFor = accountId;
      } finally {
        if (fastRepliesAbort.get(accountId) === controller) {
          fastRepliesAbort.delete(accountId);
        }
      }
    };

    const promise = run().finally(() => {
      if (fastRepliesInflight.get(accountId) === promise) {
        fastRepliesInflight.delete(accountId);
      }
    });
    fastRepliesInflight.set(accountId, promise);
    return promise;
  },

  applyFastReply: (item, options) => {
    const imagePath = item.image?.trim();
    const attachmentLink = imagePath
      ? imagePath.startsWith("/")
        ? imagePath
        : `/${imagePath}`
      : null;

    set((state) => ({
      composerText:
        options?.text ??
        item.content?.trim() ??
        state.composerText,
      attachmentDrafts: attachmentLink
        ? [
            {
              link: attachmentLink,
              name: item.title || "Tin nhanh",
              isImage: true,
            },
          ]
        : state.attachmentDrafts,
    }));
  },

  createFastReply: async (accountId, title, content, imageLink = "") => {
    await zaloMessengerService.createFastReply(
      accountId,
      title,
      content,
      imageLink,
    );
    await get().fetchFastReplies(accountId, { force: true });
  },

  editFastReply: async (
    accountId,
    replyId,
    title,
    content,
    imageLink = "",
  ) => {
    await zaloMessengerService.updateFastReply(replyId, {
      command: "",
      title,
      content,
      image: imageLink ?? "",
    });
    await get().fetchFastReplies(accountId, { force: true });
  },

  deleteFastReply: async (accountId, replyId) => {
    const message = await zaloMessengerService.deleteFastReply(replyId);
    await get().fetchFastReplies(accountId, { force: true });
    return message;
  },

  saveConversationNote: async (accountId, conversationId, note) => {
    await zaloMessengerService.saveNote(accountId, conversationId, note);
    set((state) =>
      state.selectedAccountId !== accountId
        ? state
        : {
            conversations: dedupeConversations(
              state.conversations.map((item) =>
                item.id === conversationId ? { ...item, note } : item,
              ),
            ),
            activeConversation:
              state.activeConversationId === conversationId &&
              state.activeConversation
                ? { ...state.activeConversation, note }
                : state.activeConversation,
          },
    );
  },
  setConversationSearch: (conversationSearch) => set({ conversationSearch }),
  setConversationFilter: (conversationFilter) => set({ conversationFilter }),
  setMobilePanel: (mobilePanel) => set({ mobilePanel }),
  /** Chuyển nick, vô hiệu hóa request inbox/chat của snapshot trước. */
  setSelectedAccountId: (selectedAccountId) => {
    const state = get();
    const conversationCache = saveConversationCache(
      state.selectedAccountId,
      {
        conversations: state.conversations,
        conversationLinks: state.conversationLinks,
        conversationPage: state.conversationPage,
        conversationSearch: state.conversationSearch,
        conversationFilter: state.conversationFilter,
        selectedCategoryId: state.selectedCategoryId,
      },
      state.conversationCache,
    );

    const cached = selectedAccountId
      ? loadConversationCache(selectedAccountId, conversationCache)
      : null;

    // Đổi nick → cho phép fetch labels / tin nhanh lại; hủy request nick cũ
    if (state.selectedAccountId !== selectedAccountId) {
      conversationSelectionGeneration += 1;
      conversationsRequestGeneration += 1;
      conversationsLoadMoreRequestGeneration += 1;
      messagesRequestGeneration += 1;
      messagesLoadMoreRequestGeneration += 1;
      labelCategoriesLoadedFor = null;
      fastRepliesLoadedFor = null;
      if (selectedAccountId != null) {
        abortOtherAccountFetches(selectedAccountId);
      } else {
        abortOtherAccountFetches(-1);
      }
    }

    set({
      conversationCache,
      selectedAccountId,
      conversations: cached?.conversations ?? [],
      conversationLinks: cached?.conversationLinks ?? null,
      conversationPage: cached?.conversationPage ?? 1,
      conversationSearch: cached?.conversationSearch ?? "",
      conversationFilter: cached?.conversationFilter ?? "all",
      selectedCategoryId: cached?.selectedCategoryId ?? null,
      labelCategories: [],
      labelCategoriesLoading: false,
      fastReplies: [],
      conversationsLoading: false,
      conversationsLoadingMore: false,
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      messageLinks: null,
      messagePage: 1,
      messagesLoading: false,
      messagesLoadingMore: false,
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
      uploadingAttachment: false,
      mobilePanel: selectedAccountId ? "conversations" : "accounts",
    });
  },

  switchAccount: async (accountId) => {
    if (get().selectedAccountId === accountId) return;

    const gen = ++accountSwitchGeneration;
    // Cho switch đồng thời (25 rồi 21) cùng tick đăng ký gen;
    // chỉ gen mới nhất được setSelected + fetch.
    await Promise.resolve();
    if (gen !== accountSwitchGeneration) return;

    get().setSelectedAccountId(accountId);
    if (gen !== accountSwitchGeneration) return;
    if (get().selectedAccountId !== accountId) return;

    // Labels + tin nhanh: chỉ từ useEffect theo selectedAccountId (1 nguồn).
    // Ở đây chỉ load list hội thoại.
    const cached = loadConversationCache(accountId, get().conversationCache);
    if (!cached?.conversations.length) {
      await get().fetchConversations(accountId, { page: 1 });
      return;
    }
    if (gen !== accountSwitchGeneration) return;
    if (get().selectedAccountId !== accountId) return;
    void get().fetchConversations(accountId, { page: 1 });
  },

  applyConversationFilter: async (filter) => {
    const { conversationFilter, selectedAccountId } = get();
    if (conversationFilter === filter) return;
    set({ conversationFilter: filter });
    if (!selectedAccountId) return;
    await get().fetchConversations(selectedAccountId, { page: 1 });
  },

  applyCategoryFilter: async (categoryId) => {
    const { selectedCategoryId, selectedAccountId } = get();
    if (selectedCategoryId === categoryId) return;
    set({ selectedCategoryId: categoryId });
    if (!selectedAccountId) return;
    await get().fetchConversations(selectedAccountId, { page: 1 });
  },

  applyInboxFilter: async (filter, categoryId) => {
    const { conversationFilter, selectedCategoryId, selectedAccountId } = get();
    if (conversationFilter === filter && selectedCategoryId === categoryId) return;
    set({ conversationFilter: filter, selectedCategoryId: categoryId });
    if (!selectedAccountId) return;
    await get().fetchConversations(selectedAccountId, { page: 1 });
  },

  fetchLabelCategories: async (accountId, options = {}) => {
    const force = options.force === true;
    if (!force && labelCategoriesLoadedFor === accountId) return;
    if (get().selectedAccountId !== accountId) return;

    abortOtherAccountFetches(accountId);

    const inflight = labelCategoriesInflight.get(accountId);
    if (inflight) return inflight;

    const controller = new AbortController();
    labelCategoriesAbort.set(accountId, controller);

    const run = async () => {
      set({ labelCategoriesLoading: true });
      try {
        const labelCategories = await zaloLabelService.listCategories(
          accountId,
          { signal: controller.signal },
        );
        if (get().selectedAccountId !== accountId) return;
        set({ labelCategories });
        labelCategoriesLoadedFor = accountId;
      } catch {
        if (controller.signal.aborted) return;
        if (get().selectedAccountId !== accountId) return;
        set({ labelCategories: [] });
        labelCategoriesLoadedFor = accountId;
      } finally {
        const isCurrentRequest =
          labelCategoriesAbort.get(accountId) === controller;
        if (isCurrentRequest) {
          labelCategoriesAbort.delete(accountId);
        }
        if (isCurrentRequest && get().selectedAccountId === accountId) {
          set({ labelCategoriesLoading: false });
        }
      }
    };

    const promise = run().finally(() => {
      if (labelCategoriesInflight.get(accountId) === promise) {
        labelCategoriesInflight.delete(accountId);
      }
    });
    labelCategoriesInflight.set(accountId, promise);
    return promise;
  },

  assignConversationLabel: async (conversationId, categoryId) => {
    const { selectedAccountId, labelCategories, conversations, activeConversation } =
      get();
    if (!selectedAccountId) return;

    const conversation =
      conversations.find((item) => item.id === conversationId) ??
      (activeConversation?.id === conversationId ? activeConversation : null);
    if (!conversation) return;

    const category =
      labelCategories.find((item) => item.id === categoryId) ?? {
        id: categoryId,
        name: `Nhãn #${categoryId}`,
      };

    await zaloLabelService.assignToConversation({
      categoryId,
      accountId: selectedAccountId,
      conversation,
    });

    set((state) =>
      state.selectedAccountId !== selectedAccountId
        ? state
        : {
            conversations: dedupeConversations(
              state.conversations.map((item) =>
                item.id === conversationId
                  ? patchConversationLabels(item, category, true)
                  : item,
              ),
            ),
            activeConversation:
              state.activeConversationId === conversationId &&
              state.activeConversation
                ? patchConversationLabels(
                    state.activeConversation,
                    category,
                    true,
                  )
                : state.activeConversation,
          },
    );

    if (get().selectedAccountId !== selectedAccountId) return;

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        selectedAccountId,
        conversationId,
      );
      set((state) =>
        state.selectedAccountId !== selectedAccountId
          ? state
          : {
              conversations: dedupeConversations(
                state.conversations.map((item) =>
                  item.id === conversationId ? { ...item, ...detail } : item,
                ),
              ),
              activeConversation:
                state.activeConversationId === conversationId
                  ? { ...state.activeConversation, ...detail }
                  : state.activeConversation,
            },
      );
    } catch {
      // optimistic patch is enough
    }
  },

  removeConversationLabel: async (conversationId, categoryId) => {
    const { selectedAccountId, labelCategories, conversations, activeConversation } =
      get();
    if (!selectedAccountId) return;

    const conversation =
      conversations.find((item) => item.id === conversationId) ??
      (activeConversation?.id === conversationId ? activeConversation : null);
    if (!conversation) return;

    const category =
      labelCategories.find((item) => item.id === categoryId) ?? {
        id: categoryId,
        name: `Nhãn #${categoryId}`,
      };

    await zaloLabelService.removeFromConversation({
      categoryId,
      accountId: selectedAccountId,
      conversation,
    });

    set((state) =>
      state.selectedAccountId !== selectedAccountId
        ? state
        : {
            conversations: dedupeConversations(
              state.conversations.map((item) =>
                item.id === conversationId
                  ? patchConversationLabels(item, category, false)
                  : item,
              ),
            ),
            activeConversation:
              state.activeConversationId === conversationId &&
              state.activeConversation
                ? patchConversationLabels(
                    state.activeConversation,
                    category,
                    false,
                  )
                : state.activeConversation,
          },
    );

    if (get().selectedAccountId !== selectedAccountId) return;

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        selectedAccountId,
        conversationId,
      );
      set((state) =>
        state.selectedAccountId !== selectedAccountId
          ? state
          : {
              conversations: dedupeConversations(
                state.conversations.map((item) =>
                  item.id === conversationId ? { ...item, ...detail } : item,
                ),
              ),
              activeConversation:
                state.activeConversationId === conversationId
                  ? { ...state.activeConversation, ...detail }
                  : state.activeConversation,
            },
      );
    } catch {
      // optimistic patch is enough
    }
  },

  submitConversationSearch: async (search) => {
    const { conversationSearch, selectedAccountId } = get();
    if (conversationSearch === search) return;
    set({ conversationSearch: search });
    if (!selectedAccountId) return;
    await get().fetchConversations(selectedAccountId, { page: 1, search });
  },

  /** Đánh dấu đã đọc đúng nick, không xóa badge hội thoại nick vừa chuyển sang. */
  markAllConversationsRead: async (accountId) => {
    const requestState = get();
    const requestAccountSwitchGeneration = accountSwitchGeneration;
    const conversationSnapshots = new Map<number, MessengerConversation>(
      requestState.conversations
        .filter((item) => item.new_message)
        .map((item) => [item.id, item]),
    );
    const accountSnapshot = requestState.accounts.find(
      (item) => item.id === accountId,
    );

    await zaloMessengerService.markAllConversationsRead(accountId);
    if (accountSwitchGeneration !== requestAccountSwitchGeneration) return;

    set((state) => {
      const conversations =
        state.selectedAccountId === accountId
          ? state.conversations.map((item) =>
              item.new_message && conversationSnapshots.get(item.id) === item
                ? { ...item, new_message: false }
                : item,
            )
          : state.conversations;
      const hasNewerUnread =
        state.selectedAccountId === accountId &&
        conversations.some((item) => item.new_message);
      return {
        conversations,
        accounts: state.accounts.map((item) =>
          item.id === accountId &&
          item === accountSnapshot &&
          !hasNewerUnread
            ? { ...item, new_message: false }
            : item,
        ),
      };
    });
  },

  resetConversationUnread: (accountId, conversationId) => {
    const state = get();
    if (state.selectedAccountId !== accountId) return;
    const conversation =
      state.conversations.find((item) => item.id === conversationId) ??
      (state.activeConversationId === conversationId
        ? state.activeConversation
        : null);
    if (!conversation?.new_message) return;

    useWebSocketStore
      .getState()
      .send(buildResetUnreadWsPayload({ accountId, conversationId }));

    set((current) => {
      const conversations = current.conversations.map((item) =>
        item.id === conversationId ? { ...item, new_message: false } : item,
      );
      const hasUnread = conversations.some((item) => item.new_message);
      const accounts = current.accounts.map((item) =>
        item.id === accountId ? { ...item, new_message: hasUnread } : item,
      );
      const activeConversation =
        current.activeConversationId === conversationId &&
        current.activeConversation
          ? { ...current.activeConversation, new_message: false }
          : current.activeConversation;

      return {
        conversations,
        accounts,
        activeConversation,
        ...(current.selectedAccountId === accountId
          ? {
              conversationCache: saveConversationCache(
                accountId,
                {
                  conversations,
                  conversationLinks: current.conversationLinks,
                  conversationPage: current.conversationPage,
                  conversationSearch: current.conversationSearch,
                  conversationFilter: current.conversationFilter,
                  selectedCategoryId: current.selectedCategoryId,
                },
                current.conversationCache,
              ),
            }
          : {}),
      };
    });
  },

  fetchFriendsForCreateGroup: async (accountId, options = {}) => {
    // detail: true → full FriendDetail (uid/avatar/name); type=simple thiếu uid
    // → filter isSelectableFriendForCreateGroup loại hết → list trống
    return zaloFriendService.list({
      accountId,
      page: options.page ?? 1,
      pageSize: 100,
      name: options.search,
      detail: true,
    });
  },

  createZaloGroup: async (payload) => {
    return zaloMessengerService.createGroup(payload);
  },

  fetchAccounts: async () => {
    const requestSessionGeneration = messengerSessionGeneration;
    return dedupeInflight(
      `messenger:fetchAccounts:${requestSessionGeneration}`,
      async () => {
        if (messengerSessionGeneration !== requestSessionGeneration) return;
        set({ accountsLoading: true, error: null });
        try {
          let accounts = await zaloMessengerService.listAccounts();
          if (messengerSessionGeneration !== requestSessionGeneration) return;
          const user = useAuthStore.getState().user;
          if (isEmployeeUser(user)) {
            const assignedIds = new Set(
              (await fetchAccessibleAccounts()).map((account) => account.id),
            );
            if (messengerSessionGeneration !== requestSessionGeneration) return;
            accounts = accounts.filter((account) => assignedIds.has(account.id));
          }
          const sorted = sortMessengerAccounts(accounts);
          const selectedAccountId = get().selectedAccountId;
          const selectedStillValid =
            selectedAccountId == null ||
            sorted.some((account) => account.id === selectedAccountId);

          // F5 / bootstrap: nick tin mới nhất lên đầu (pin trước)
          // Đổi user: bỏ selected/cache nếu nick không còn trong list
          if (!selectedStillValid) {
            conversationSelectionGeneration += 1;
            conversationsRequestGeneration += 1;
            conversationsLoadMoreRequestGeneration += 1;
            messagesRequestGeneration += 1;
            messagesLoadMoreRequestGeneration += 1;
            labelCategoriesLoadedFor = null;
            fastRepliesLoadedFor = null;
            abortOtherAccountFetches(-1);
            set({
              accounts: sorted,
              accountsLoading: false,
              selectedAccountId: null,
              conversations: [],
              conversationLinks: null,
              conversationPage: 1,
              conversationSearch: "",
              conversationFilter: "all",
              selectedCategoryId: null,
              labelCategories: [],
              labelCategoriesLoading: false,
              activeConversationId: null,
              activeConversation: null,
              messages: [],
              messageLinks: null,
              messagePage: 1,
              composerText: "",
              quoteMessage: null,
              attachmentDrafts: [],
              uploadingAttachment: false,
              fastReplies: [],
              conversationCache: {},
              messagesCache: {},
              mobilePanel: "accounts",
            });
          } else {
            set({
              accounts: sorted,
              accountsLoading: false,
            });
          }
        } catch {
          if (messengerSessionGeneration !== requestSessionGeneration) return;
          set({ accountsLoading: false, accounts: [] });
        }
      },
    );
  },

  /** Tải đúng snapshot inbox; response cũ không được ghi vào query/cache mới. */
  fetchConversations: async (accountId, options = {}) => {
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const search = options.search ?? get().conversationSearch;
    const { conversationFilter, selectedCategoryId } = get();
    if (get().selectedAccountId !== accountId) return;
    const requestAccountSwitchGeneration = accountSwitchGeneration;
    const requestKey = `${buildConversationsRequestKey(
      accountId,
      page,
      search,
      conversationFilter,
      selectedCategoryId,
      append,
    )}|${requestAccountSwitchGeneration}`;

    if (!append) {
      const inflight = conversationsInflight.get(requestKey);
      if (inflight) return inflight;
    }

    const loadingKey = append
      ? "conversationsLoadingMore"
      : "conversationsLoading";
    const requestGeneration = append
      ? ++conversationsLoadMoreRequestGeneration
      : ++conversationsRequestGeneration;
    const conversationsAtRequestStart = new Set(get().conversations);

    const run = async () => {
      set({
        [loadingKey]: true,
        error: null,
      });

      try {
        const data = await zaloMessengerService.fetchConversations({
          id_account: accountId,
          page,
          name: search,
          ...(conversationFilter === "unread" ? { unread: true } : {}),
          ...(conversationFilter === "friend"
            ? { conversation_type: "friend" }
            : {}),
          ...(conversationFilter === "group"
            ? { conversation_type: "group" }
            : {}),
          ...(selectedCategoryId ? { id_category: selectedCategoryId } : {}),
        });

        const results = (data.results ?? []).filter(
          (item) =>
            item.updated_time != null || item.friend?.id || item.group?.id,
        );

        set((state) => {
          const isLatestRequest = append
            ? conversationsLoadMoreRequestGeneration === requestGeneration
            : conversationsRequestGeneration === requestGeneration;
          if (
            !isLatestRequest ||
            accountSwitchGeneration !== requestAccountSwitchGeneration ||
            state.selectedAccountId !== accountId ||
            state.conversationSearch !== search ||
            state.conversationFilter !== conversationFilter ||
            state.selectedCategoryId !== selectedCategoryId
          ) {
            return state;
          }
          const liveConversations =
            !append && page === 1
              ? state.conversations.filter(
                  (item) => !conversationsAtRequestStart.has(item),
                )
              : [];
          const conversations = append
            ? dedupeConversations([...state.conversations, ...results])
            : page === 1
              ? dedupeConversations([...results, ...liveConversations])
              : dedupeConversations(results);
          const patch = {
            conversations,
            conversationLinks: data.links ?? null,
            conversationPage: page,
            conversationSearch: search,
          };
          return {
            ...patch,
            conversationCache: saveConversationCache(
              accountId,
              {
                ...patch,
                conversationFilter,
                selectedCategoryId,
              },
              state.conversationCache,
            ),
          };
        });
      } catch (error) {
        const isLatestRequest = append
          ? conversationsLoadMoreRequestGeneration === requestGeneration
          : conversationsRequestGeneration === requestGeneration;
        if (
          !isLatestRequest ||
          accountSwitchGeneration !== requestAccountSwitchGeneration
        ) {
          return;
        }
        if (handleConsentChatRequired(error)) {
          const state = get();
          if (
            state.selectedAccountId === accountId &&
            state.conversationSearch === search &&
            state.conversationFilter === conversationFilter &&
            state.selectedCategoryId === selectedCategoryId
          ) {
            set({ error: getApiErrorMessage(error) });
          }
          return;
        }
        const state = get();
        if (
          state.selectedAccountId === accountId &&
          state.conversationSearch === search &&
          state.conversationFilter === conversationFilter &&
          state.selectedCategoryId === selectedCategoryId
        ) {
          set({ error: "Không tải được danh sách hội thoại." });
        }
      } finally {
        const isLatestRequest = append
          ? conversationsLoadMoreRequestGeneration === requestGeneration
          : conversationsRequestGeneration === requestGeneration;
        if (
          isLatestRequest &&
          accountSwitchGeneration === requestAccountSwitchGeneration
        ) {
          set({ [loadingKey]: false });
        }
      }
    };

    const promise = run().finally(() => {
      if (conversationsInflight.get(requestKey) === promise) {
        conversationsInflight.delete(requestKey);
      }
    });
    if (!append) conversationsInflight.set(requestKey, promise);
    return promise;
  },

  /** Mở hội thoại theo navigation hiện tại; detail cũ bị bỏ sau mọi lần switch. */
  selectConversation: async (accountId, conversationId) => {
    const initialState = get();
    if (initialState.selectedAccountId !== accountId) return;

    const inflightKey = `${accountId}|${conversationId}|${conversationSelectionGeneration}`;
    const inflight = selectConversationInflight.get(inflightKey);
    if (
      inflight &&
      initialState.activeConversationId === conversationId
    ) {
      return inflight;
    }

    const selectionGeneration = ++conversationSelectionGeneration;
    const requestKey = `${accountId}|${conversationId}|${selectionGeneration}`;

    const run = async () => {
      const state = get();
      const existingConversation =
        state.conversations.find((c) => c.id === conversationId) ??
        (state.activeConversationId === conversationId &&
        state.activeConversation?.id === conversationId &&
        (state.activeConversation.account == null ||
          Number(state.activeConversation.account) === Number(accountId))
          ? state.activeConversation
          : null);

      if (
        state.activeConversationId === conversationId &&
        state.messages.length > 0 &&
        !state.messagesLoading &&
        !state.messagesLoadingMore
      ) {
        if (existingConversation?.new_message) {
          get().resetConversationUnread(accountId, conversationId);
        }
        set({ mobilePanel: "chat" });
        return;
      }

      get().prepareConversationSwitch(conversationId);
      set({ mobilePanel: "chat" });

      if (existingConversation) {
        set({ activeConversation: existingConversation });
        if (existingConversation.new_message) {
          get().resetConversationUnread(accountId, conversationId);
        }
      }

      /**
       * Detail/get-message có thể lỏng hơn list (BE cũ leak access).
       * - Không INSERT sidebar nếu conv chưa có trong list nick đang chọn
       * - detail.account phải khớp nick (khi BE trả field này)
       */
      let detailOk = Boolean(existingConversation);
      try {
        const detail = await zaloMessengerService.fetchConversationDetail(
          accountId,
          conversationId,
        );
        if (
          conversationSelectionGeneration !== selectionGeneration ||
          get().selectedAccountId !== accountId ||
          get().activeConversationId !== conversationId
        ) {
          return;
        }
        const detailAccount =
          detail?.account != null ? Number(detail.account) : null;
        if (
          detailAccount != null &&
          Number.isFinite(detailAccount) &&
          detailAccount !== Number(accountId)
        ) {
          toast.error("Hội thoại không thuộc tài khoản Zalo đang chọn.");
          set((s) => ({
            activeConversation:
              s.activeConversationId === conversationId
                ? null
                : s.activeConversation,
            messages:
              s.activeConversationId === conversationId ? [] : s.messages,
          }));
          detailOk = false;
        } else {
          const normalizedDetail: MessengerConversation = {
            ...detail,
            account:
              detailAccount != null && Number.isFinite(detailAccount)
                ? detailAccount
                : accountId,
          };
          set((current) => {
            const inSidebar = current.conversations.some(
              (item) => item.id === conversationId,
            );
            return {
              activeConversation: normalizedDetail,
              // Chỉ patch tại chỗ — không upsert ghost vào sidebar
              conversations: inSidebar
                ? dedupeConversations(
                    current.conversations.map((item) =>
                      item.id === conversationId
                        ? { ...item, ...normalizedDetail }
                        : item,
                    ),
                  )
                : current.conversations,
            };
          });
          detailOk = true;
        }
      } catch (error) {
        if (
          conversationSelectionGeneration !== selectionGeneration ||
          get().selectedAccountId !== accountId ||
          get().activeConversationId !== conversationId
        ) {
          return;
        }
        if (handleConsentChatRequired(error)) {
          set({ error: getApiErrorMessage(error) });
          detailOk = false;
          return;
        }
        // detail optional khi đã có trong list; URL lạ / không quyền → chặn load tin
        if (!existingConversation) {
          toast.error("Không mở được hội thoại này.");
          set((s) => ({
            activeConversation:
              s.activeConversationId === conversationId
                ? null
                : s.activeConversation,
            messages:
              s.activeConversationId === conversationId ? [] : s.messages,
          }));
          detailOk = false;
        }
      }

      if (
        detailOk &&
        conversationSelectionGeneration === selectionGeneration &&
        get().selectedAccountId === accountId &&
        get().activeConversationId === conversationId
      ) {
        await get().fetchMessages(accountId, conversationId, { page: 1 });
      }
    };

    const promise = run().finally(() => {
      if (selectConversationInflight.get(requestKey) === promise) {
        selectConversationInflight.delete(requestKey);
      }
    });
    selectConversationInflight.set(requestKey, promise);
    return promise;
  },

  /** Tải đúng chat; page 1 thay snapshot REST nhưng giữ delta WS mới hơn. */
  fetchMessages: async (accountId, conversationId, options = {}) => {
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const selectionGeneration = conversationSelectionGeneration;
    if (
      get().selectedAccountId !== accountId ||
      get().activeConversationId !== conversationId
    ) {
      return;
    }
    const requestKey = `${accountId}|${conversationId}|${page}|${append ? 1 : 0}|${selectionGeneration}`;

    if (!append) {
      const inflight = messagesInflight.get(requestKey);
      if (inflight) return inflight;
    }

    const loadingKey = append ? "messagesLoadingMore" : "messagesLoading";
    const requestGeneration = append
      ? ++messagesLoadMoreRequestGeneration
      : ++messagesRequestGeneration;
    const messagesAtRequestStart = new Set(get().messages);

    /**
     * Page 1 có thể gần 100% chat.reaction (nhóm hot).
     * FE partition reaction khỏi bubble + auto fetch page 2… đến khi đủ bubble
     * hoặc hết next / chạm maxPages (docs/fe_integration_notes.md).
     */
    const MIN_TIMELINE_BUBBLES = 15;
    const MAX_REACTION_FILL_PAGES = 5;

    const run = async () => {
      set({ [loadingKey]: true, error: null });

      try {
        const existingMessages = append
          ? get().activeConversationId === conversationId
            ? get().messages
            : []
          : [];

        let currentPage = page;
        let pagesFetched = 0;
        let rawBatch: RawZaloMessage[] = [];
        let messageLinks: {
          next: string | null;
          previous: string | null;
        } = { next: null, previous: null };
        let lastPage = page;

        while (pagesFetched < MAX_REACTION_FILL_PAGES) {
          const data = await zaloMessengerService.fetchMessages(
            accountId,
            conversationId,
            currentPage,
          );
          if (
            conversationSelectionGeneration !== selectionGeneration ||
            get().selectedAccountId !== accountId ||
            get().activeConversationId !== conversationId
          ) {
            return;
          }
          rawBatch = [...rawBatch, ...(data.results ?? [])];
          messageLinks = {
            next: data.links?.next ?? data.next ?? null,
            previous: data.links?.previous ?? data.previous ?? null,
          };
          lastPage = currentPage;
          pagesFetched += 1;

          const batchMessages = normalizeIncomingMessages(rawBatch);
          const combined = normalizeMessageList(
            append ? [...batchMessages, ...existingMessages] : batchMessages,
          );
          const timelineCount = filterDisplayMessages(combined).length;
          const nextPage = extractNextPage(messageLinks);

          if (append) {
            // Load older: dừng khi batch mới có ≥1 bubble timeline, hoặc hết page
            const newTimelineCount = filterDisplayMessages(batchMessages).length;
            if (newTimelineCount >= 1 || nextPage == null) break;
          } else if (
            timelineCount >= MIN_TIMELINE_BUBBLES ||
            nextPage == null
          ) {
            break;
          }

          if (nextPage == null) break;
          currentPage = nextPage;
        }

        const incoming = normalizeIncomingMessages(rawBatch);

        set((state) => {
          if (
            conversationSelectionGeneration !== selectionGeneration ||
            state.selectedAccountId !== accountId ||
            state.activeConversationId !== conversationId
          ) {
            return state;
          }
          const liveMessages =
            !append && page === 1
              ? state.messages.filter(
                  (message) => !messagesAtRequestStart.has(message),
                )
              : [];
          const messages = normalizeMessageList(
            append
              ? [...incoming, ...state.messages]
              : page === 1
                ? [...incoming, ...liveMessages]
                : incoming,
          );
          const cacheKey = messageCacheKey(accountId, conversationId);
          return {
            messages,
            messageLinks,
            messagePage: lastPage,
            messagesCache: {
              ...state.messagesCache,
              [cacheKey]: {
                messages,
                messageLinks,
                messagePage: lastPage,
              },
            },
          };
        });
      } catch (error) {
        if (
          conversationSelectionGeneration !== selectionGeneration ||
          get().selectedAccountId !== accountId ||
          get().activeConversationId !== conversationId
        ) {
          return;
        }
        if (handleConsentChatRequired(error)) {
          set({ error: getApiErrorMessage(error) });
          return;
        }
        set({ error: "Không tải được tin nhắn." });
      } finally {
        const isLatestRequest = append
          ? messagesLoadMoreRequestGeneration === requestGeneration
          : messagesRequestGeneration === requestGeneration;
        if (
          isLatestRequest &&
          conversationSelectionGeneration === selectionGeneration &&
          get().selectedAccountId === accountId &&
          get().activeConversationId === conversationId
        ) {
          set({ [loadingKey]: false });
        }
      }
    };

    const promise = run().finally(() => {
      if (messagesInflight.get(requestKey) === promise) {
        messagesInflight.delete(requestKey);
      }
    });
    if (!append) messagesInflight.set(requestKey, promise);
    return promise;
  },

  pinConversation: async (accountId, conversationId, pinning) => {
    await zaloMessengerService.pinConversation(
      accountId,
      conversationId,
      pinning,
    );
    set((state) =>
      state.selectedAccountId !== accountId
        ? state
        : {
            conversations: dedupeConversations(
              state.conversations.map((item) =>
                item.id === conversationId ? { ...item, pinning } : item,
              ),
            ),
            activeConversation:
              state.activeConversationId === conversationId &&
              state.activeConversation
                ? { ...state.activeConversation, pinning }
                : state.activeConversation,
          },
    );
  },

  /** Refresh detail chỉ khi account và hội thoại vẫn là snapshot ban đầu. */
  refreshActiveConversation: async () => {
    const { selectedAccountId, activeConversationId } = get();
    if (!selectedAccountId || !activeConversationId) return;
    const selectionGeneration = conversationSelectionGeneration;

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        selectedAccountId,
        activeConversationId,
      );
      if (
        conversationSelectionGeneration !== selectionGeneration ||
        get().selectedAccountId !== selectedAccountId ||
        get().activeConversationId !== activeConversationId
      ) {
        return;
      }
      const detailAccount =
        detail?.account != null ? Number(detail.account) : null;
      if (
        detailAccount != null &&
        Number.isFinite(detailAccount) &&
        detailAccount !== Number(selectedAccountId)
      ) {
        return;
      }
      const normalizedDetail: MessengerConversation = {
        ...detail,
        account:
          detailAccount != null && Number.isFinite(detailAccount)
            ? detailAccount
            : selectedAccountId,
      };
      set((state) => {
        if (
          conversationSelectionGeneration !== selectionGeneration ||
          state.selectedAccountId !== selectedAccountId ||
          state.activeConversationId !== activeConversationId
        ) {
          return state;
        }
        const inSidebar = state.conversations.some(
          (item) => item.id === activeConversationId,
        );
        return {
          activeConversation: normalizedDetail,
          conversations: inSidebar
            ? dedupeConversations(
                state.conversations.map((item) =>
                  item.id === activeConversationId
                    ? { ...item, ...normalizedDetail }
                    : item,
                ),
              )
            : state.conversations,
        };
      });
    } catch {
      // optional refresh — giữ state cũ
    }
  },

  pinAccount: async (accountId, pinning) => {
    await zaloMessengerService.pinAccount(accountId, pinning);
    set((state) => ({
      accounts: sortMessengerAccounts(
        state.accounts.map((item) =>
          item.id === accountId ? { ...item, pinning } : item,
        ),
      ),
    }));
  },

  mergeConversations: (items, accountId) => {
    if (!items.length) return;

    /**
     * Bắt buộc scope theo nick sở hữu.
     * Không merge conv nick khác / thiếu account vào list nick đang xem
     * (ghost “Hội thoại #id”, F5 mới hết).
     */
    const ownerAccountId =
      accountId != null && Number.isFinite(Number(accountId))
        ? Number(accountId)
        : items.find((item) => item.account != null)?.account != null
          ? Number(items.find((item) => item.account != null)!.account)
          : null;

    if (ownerAccountId == null) return;

    const scopedItems = scopeConversationsToAccount(items, ownerAccountId);
    if (!scopedItems.length) return;

    set((state) => {
      const mergeList = (current: MessengerConversation[]) =>
        dedupeConversations([...current, ...scopedItems]);

      // Nick khác nick đang chọn → chỉ cập nhật cache của nick đó
      if (state.selectedAccountId !== ownerAccountId) {
        const cached = state.conversationCache[ownerAccountId];
        if (!cached) return state;
        const conversations = mergeList(cached.conversations);
        return {
          conversationCache: saveConversationCache(
            ownerAccountId,
            { ...cached, conversations },
            state.conversationCache,
          ),
        };
      }

      // Nick đang chọn — scopedItems đã filter account === selected
      const conversations = mergeList(state.conversations);
      const activePatch = scopedItems.find(
        (item) => item.id === state.activeConversationId,
      );
      const patch = {
        conversations,
        activeConversation: activePatch
          ? mergeConversationRecords(
              state.activeConversation ?? activePatch,
              activePatch,
            )
          : state.activeConversation,
      };

      return {
        ...patch,
        conversationCache: saveConversationCache(
          ownerAccountId,
          {
            conversations,
            conversationLinks: state.conversationLinks,
            conversationPage: state.conversationPage,
            conversationSearch: state.conversationSearch,
            conversationFilter: state.conversationFilter,
            selectedCategoryId: state.selectedCategoryId,
          },
          state.conversationCache,
        ),
      };
    });
  },

  mergeAccountBadge: (accountId, hasUnread) => {
    set((state) => ({
      accounts: sortMessengerAccounts(
        state.accounts.map((item) =>
          item.id === accountId ? { ...item, new_message: hasUnread } : item,
        ),
      ),
    }));
  },

  /** Merge activity theo timestamp; mark-read thắng frame unread cùng activity đến trễ. */
  mergeAccountActivity: (accountId, options) => {
    const { ts, hasUnread } = options;
    set((state) => {
      const exists = state.accounts.some((item) => item.id === accountId);
      if (!exists) return state;

      const accounts = sortMessengerAccounts(
        state.accounts.map((item) => {
          if (item.id !== accountId) return item;
          const currentTs = parseZaloUpdatedTimeMs(item.updated_time);
          const incomingTs = parseZaloUpdatedTimeMs(ts);
          const next: MessengerAccount = {
            ...item,
            updated_time: maxMessengerAccountActivityTime(
              item.updated_time,
              ts ?? null,
            ),
          };
          const canApplyUnread =
            hasUnread !== undefined &&
            (incomingTs > currentTs ||
              currentTs === 0 ||
              (incomingTs === currentTs &&
                !(item.new_message === false && hasUnread === true)));
          if (canApplyUnread) {
            next.new_message = hasUnread;
          }
          return next;
        }),
      );
      return { accounts };
    });
  },

  appendLiveMessages: (accountId, openConversation, accountUid, rawMessages) => {
    if (
      openConversation?.account != null &&
      Number(openConversation.account) !== Number(accountId)
    ) {
      return;
    }

    const forOpen = rawMessages.filter((msg) =>
      belongsToOpenChat(msg, openConversation, accountUid, accountId),
    );
    if (!forOpen.length) return;

    const incoming = normalizeIncomingMessages(forOpen);
    set((state) => {
      if (state.selectedAccountId !== accountId) return state;
      if (
        state.activeConversationId &&
        openConversation &&
        state.activeConversationId !== openConversation.id
      ) {
        return state;
      }
      const messages = normalizeMessageList([...state.messages, ...incoming]);
      const cacheKey =
        state.selectedAccountId && state.activeConversationId
          ? messageCacheKey(state.selectedAccountId, state.activeConversationId)
          : null;
      return {
        messages,
        ...(cacheKey
          ? {
              messagesCache: {
                ...state.messagesCache,
                [cacheKey]: {
                  messages,
                  messageLinks: state.messageLinks,
                  messagePage: state.messagePage,
                },
              },
            }
          : {}),
      };
    });
  },

  /** Gộp nhiều ảnh thành một WS payload; file/video vẫn gửi riêng như cũ. */
  buildOutboundPayloads: (accountId, conversationId, options = {}) => {
    const state = get();
    const text = state.composerText.trim();
    const attachments = state.attachmentDrafts;
    const quoteMessage = state.quoteMessage;
    const mentionInfo = options.mentionInfo ?? [];
    const quoteDetails = quoteMessage
      ? buildQuoteDetails(quoteMessage, options.accountUid)
      : null;

    if (!text && attachments.length === 0) return [];

    const payloads: SendMessagePayload[] = [];

    if (text && attachments.length === 0) {
      payloads.push({
        id_account: accountId,
        id_conversation: conversationId,
        message: text,
        chat_type: resolveChatType({
          hasQuote: Boolean(quoteDetails),
          text,
          mentionInfo,
        }),
        clientMsgId: generateClientMsgId(),
        attachment: null,
        message_details: quoteDetails,
        phone_number: null,
        ...(mentionInfo.length ? { mention_info: mentionInfo } : {}),
      });
      return payloads;
    }

    const shouldSendImageAlbum =
      !quoteDetails &&
      attachments.length > 1 &&
      attachments.every(isImageAttachmentDraft);

    if (shouldSendImageAlbum) {
      payloads.push({
        id_account: accountId,
        id_conversation: conversationId,
        message: text,
        attachments: attachments.map((file) => file.link),
        chat_type: "send-message",
        clientMsgId: generateClientMsgId(),
        attachment: null,
        message_details: null,
        phone_number: null,
      });
      return payloads;
    }

    for (const file of attachments) {
      const chatType = resolveAttachmentChatType({
        draft: file,
        hasQuote: Boolean(quoteDetails),
      });

      payloads.push({
        id_account: accountId,
        id_conversation: conversationId,
        message: text,
        attachment: file.link,
        chat_type: chatType,
        clientMsgId: generateClientMsgId(),
        message_details: quoteDetails,
        phone_number: null,
        ...(chatType === "send-file" || chatType === "send-video"
          ? { file_name: file.name }
          : {}),
      });
    }

    return payloads;
  },

  /** Đổi chat, phục hồi cache đích và reset loader của request chat cũ. */
  prepareConversationSwitch: (conversationId) => {
    const state = get();
    const messagesCache = { ...state.messagesCache };

    if (state.selectedAccountId && state.activeConversationId) {
      const prevKey = messageCacheKey(
        state.selectedAccountId,
        state.activeConversationId,
      );
      messagesCache[prevKey] = {
        messages: state.messages,
        messageLinks: state.messageLinks,
        messagePage: state.messagePage,
      };
    }

    const nextKey =
      state.selectedAccountId != null
        ? messageCacheKey(state.selectedAccountId, conversationId)
        : null;
    const cached = nextKey ? messagesCache[nextKey] : null;

    set({
      messagesCache,
      activeConversationId: conversationId,
      messages: cached?.messages ?? [],
      messageLinks: cached?.messageLinks ?? null,
      messagePage: cached?.messagePage ?? 1,
      messagesLoading: false,
      messagesLoadingMore: false,
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
      uploadingAttachment: false,
    });
  },

  resetChatState: () => {
    conversationSelectionGeneration += 1;
    messagesRequestGeneration += 1;
    messagesLoadMoreRequestGeneration += 1;
    set({
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      messageLinks: null,
      messagePage: 1,
      messagesLoading: false,
      messagesLoadingMore: false,
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
      uploadingAttachment: false,
      mobilePanel: "conversations",
    });
  },

  resetSession: () => {
    clearMessengerRuntimeCaches();
    set({ ...messengerSessionDefaults });
  },
}));

export function getConversationHasMore(
  links: { next?: string | null } | null,
): boolean {
  return extractNextPage(links) !== null;
}
