import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { normalizeIncomingMessages } from "@/lib/zalo-messenger-message-utils";
import { isEmployeeUser } from "@/lib/team-collaboration-utils";
import {
  belongsToOpenChat,
  dedupeConversations,
  extractNextPage,
  generateClientMsgId,
  mergeConversationRecords,
  normalizeMessageList,
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
import { zaloMessengerService } from "@/services/zalo-messenger.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { PaginatedResponse, ZaloFriendItem } from "@/types/zalo-contacts";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  buildQuoteDetails,
  detectAttachmentKind,
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
let selectConversationInflight: number | null = null;

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
  mobilePanel: MessengerMobilePanel;
  error: string | null;
  conversationCache: Record<number, ConversationCacheEntry>;
  messagesCache: Record<string, MessageCacheEntry>;

  setComposerText: (value: string) => void;
  setQuoteMessage: (message: DisplayMessage | null) => void;
  clearComposer: () => void;
  uploadAttachments: (files: File[]) => Promise<void>;
  removeAttachmentDraft: (index: number) => void;
  fetchFastReplies: (accountId: number) => Promise<void>;
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
  fetchLabelCategories: (accountId: number) => Promise<void>;
  assignConversationLabel: (
    conversationId: number,
    categoryId: number,
  ) => Promise<void>;
  removeConversationLabel: (
    conversationId: number,
    categoryId: number,
  ) => Promise<void>;
  markAllConversationsRead: (accountId: number) => Promise<void>;
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
  pinAccount: (accountId: number, pinning: boolean) => Promise<void>;

  mergeConversations: (
    items: MessengerConversation[],
    accountId?: number | null,
  ) => void;
  mergeAccountBadge: (accountId: number, hasUnread: boolean) => void;
  appendLiveMessages: (
    accountId: number,
    openConversation: MessengerConversation | null,
    accountUid: string | null | undefined,
    rawMessages: RawZaloMessage[],
  ) => void;
  handleMessageAck: (
    clientMsgId: string,
    success: boolean,
  ) => void;

  addOptimisticMessage: (
    message: DisplayMessage,
    retryData?: SendMessagePayload,
  ) => string;
  buildOutboundPayloads: (
    accountId: number,
    conversationId: number,
    options?: {
      mentionInfo?: MessengerMentionInfo[];
      accountUid?: string | null;
    },
  ) => SendMessagePayload[];
  retryOptimisticMessage: (clientMsgId: string) => SendMessagePayload | null;
  prepareConversationSwitch: (conversationId: number) => void;
  resetChatState: () => void;
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
  mobilePanel: "accounts",
  error: null,
  conversationCache: {},
  messagesCache: {},

  setComposerText: (composerText) => set({ composerText }),
  setQuoteMessage: (quoteMessage) => set({ quoteMessage }),
  clearComposer: () =>
    set({ composerText: "", attachmentDrafts: [], quoteMessage: null }),
  removeAttachmentDraft: (index) =>
    set((state) => ({
      attachmentDrafts: state.attachmentDrafts.filter((_, i) => i !== index),
    })),

  uploadAttachments: async (files) => {
    if (!files.length) return;
    set({ uploadingAttachment: true, error: null });
    let uploadedCount = 0;

    for (const file of files) {
      try {
        const link = await zaloMessengerService.uploadFile(file);
        uploadedCount += 1;
        const { isImage } = detectAttachmentKind(file, link);
        set((state) => ({
          attachmentDrafts: [
            ...state.attachmentDrafts,
            { link, name: file.name, isImage },
          ],
        }));
      } catch (error) {
        const message =
          getApiErrorMessage(error) ||
          `Không tải được file "${file.name}".`;
        set({ error: message });
        toast.error(message);
      }
    }

    if (uploadedCount === 0 && files.length > 0) {
      set({ error: "Không tải file đính kèm được." });
    }

    set({ uploadingAttachment: false });
  },

  fetchFastReplies: async (accountId) => {
    try {
      const fastReplies = await zaloMessengerService.fetchFastReplies(accountId);
      set({ fastReplies });
    } catch {
      set({ fastReplies: [] });
    }
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
    await get().fetchFastReplies(accountId);
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
    await get().fetchFastReplies(accountId);
  },

  deleteFastReply: async (accountId, replyId) => {
    const message = await zaloMessengerService.deleteFastReply(replyId);
    await get().fetchFastReplies(accountId);
    return message;
  },

  saveConversationNote: async (accountId, conversationId, note) => {
    await zaloMessengerService.saveNote(accountId, conversationId, note);
    set((state) => ({
      conversations: dedupeConversations(
        state.conversations.map((item) =>
          item.id === conversationId ? { ...item, note } : item,
        ),
      ),
      activeConversation:
        state.activeConversationId === conversationId && state.activeConversation
          ? { ...state.activeConversation, note }
          : state.activeConversation,
    }));
  },
  setConversationSearch: (conversationSearch) => set({ conversationSearch }),
  setConversationFilter: (conversationFilter) => set({ conversationFilter }),
  setMobilePanel: (mobilePanel) => set({ mobilePanel }),
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
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      messageLinks: null,
      messagePage: 1,
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
      mobilePanel: selectedAccountId ? "conversations" : "accounts",
    });
  },

  switchAccount: async (accountId) => {
    const { selectedAccountId } = get();
    if (selectedAccountId === accountId) return;
    get().setSelectedAccountId(accountId);
    void get().fetchLabelCategories(accountId);
    const cached = loadConversationCache(accountId, get().conversationCache);
    if (!cached?.conversations.length) {
      await get().fetchConversations(accountId, { page: 1 });
      return;
    }
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

  fetchLabelCategories: async (accountId) => {
    set({ labelCategoriesLoading: true });
    try {
      const labelCategories = await zaloLabelService.listCategories(accountId);
      set({ labelCategories });
    } catch {
      set({ labelCategories: [] });
    } finally {
      set({ labelCategoriesLoading: false });
    }
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

    set((state) => ({
      conversations: dedupeConversations(
        state.conversations.map((item) =>
          item.id === conversationId
            ? patchConversationLabels(item, category, true)
            : item,
        ),
      ),
      activeConversation:
        state.activeConversationId === conversationId && state.activeConversation
          ? patchConversationLabels(state.activeConversation, category, true)
          : state.activeConversation,
    }));

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        selectedAccountId,
        conversationId,
      );
      set((state) => ({
        conversations: dedupeConversations(
          state.conversations.map((item) =>
            item.id === conversationId ? { ...item, ...detail } : item,
          ),
        ),
        activeConversation:
          state.activeConversationId === conversationId
            ? { ...state.activeConversation, ...detail }
            : state.activeConversation,
      }));
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

    set((state) => ({
      conversations: dedupeConversations(
        state.conversations.map((item) =>
          item.id === conversationId
            ? patchConversationLabels(item, category, false)
            : item,
        ),
      ),
      activeConversation:
        state.activeConversationId === conversationId && state.activeConversation
          ? patchConversationLabels(state.activeConversation, category, false)
          : state.activeConversation,
    }));

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        selectedAccountId,
        conversationId,
      );
      set((state) => ({
        conversations: dedupeConversations(
          state.conversations.map((item) =>
            item.id === conversationId ? { ...item, ...detail } : item,
          ),
        ),
        activeConversation:
          state.activeConversationId === conversationId
            ? { ...state.activeConversation, ...detail }
            : state.activeConversation,
      }));
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

  markAllConversationsRead: async (accountId) => {
    await zaloMessengerService.markAllConversationsRead(accountId);
    set((state) => ({
      conversations: state.conversations.map((item) => ({
        ...item,
        new_message: false,
      })),
      accounts: state.accounts.map((item) =>
        item.id === accountId ? { ...item, new_message: false } : item,
      ),
    }));
  },

  fetchFriendsForCreateGroup: async (accountId, options = {}) => {
    return zaloFriendService.list({
      accountId,
      page: options.page ?? 1,
      pageSize: 100,
      name: options.search,
    });
  },

  createZaloGroup: async (payload) => {
    return zaloMessengerService.createGroup(payload);
  },

  fetchAccounts: async () => {
    set({ accountsLoading: true, error: null });
    try {
      let accounts = sortMessengerAccounts(
        await zaloMessengerService.listAccounts(),
      );
      const user = useAuthStore.getState().user;
      if (isEmployeeUser(user)) {
        const assignedIds = new Set(
          (await fetchAccessibleAccounts()).map((account) => account.id),
        );
        accounts = accounts.filter((account) => assignedIds.has(account.id));
      }
      set({ accounts, accountsLoading: false });
    } catch {
      set({ accountsLoading: false, accounts: [] });
    }
  },

  fetchConversations: async (accountId, options = {}) => {
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const search = options.search ?? get().conversationSearch;
    const { conversationFilter, selectedCategoryId } = get();
    const requestKey = buildConversationsRequestKey(
      accountId,
      page,
      search,
      conversationFilter,
      selectedCategoryId,
      append,
    );

    if (!append) {
      const inflight = conversationsInflight.get(requestKey);
      if (inflight) return inflight;
    }

    const loadingKey = append
      ? "conversationsLoadingMore"
      : "conversationsLoading";

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
          const conversations = append
            ? dedupeConversations([...state.conversations, ...results])
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
                conversationFilter: state.conversationFilter,
                selectedCategoryId: state.selectedCategoryId,
              },
              state.conversationCache,
            ),
          };
        });
      } catch {
        set({ error: "Không tải được danh sách hội thoại." });
      } finally {
        set({ [loadingKey]: false });
        if (!append) conversationsInflight.delete(requestKey);
      }
    };

    const promise = run();
    if (!append) conversationsInflight.set(requestKey, promise);
    return promise;
  },

  selectConversation: async (accountId, conversationId) => {
    if (selectConversationInflight === conversationId) return;

    const state = get();
    if (
      state.activeConversationId === conversationId &&
      state.messages.length > 0 &&
      !state.messagesLoading &&
      !state.messagesLoadingMore
    ) {
      set({ mobilePanel: "chat" });
      return;
    }

    selectConversationInflight = conversationId;
    get().prepareConversationSwitch(conversationId);
    set({ mobilePanel: "chat" });

    const existing = get().conversations.find((c) => c.id === conversationId);
    if (existing) {
      set({ activeConversation: existing });
    }

    try {
      const detail = await zaloMessengerService.fetchConversationDetail(
        accountId,
        conversationId,
      );
      set((state) => ({
        activeConversation: detail,
        conversations: dedupeConversations(
          state.conversations.some((item) => item.id === conversationId)
            ? state.conversations.map((item) =>
                item.id === conversationId ? { ...item, ...detail } : item,
              )
            : [...state.conversations, detail],
        ),
      }));
    } catch {
      // detail optional — messages still load
    }

    try {
      await get().fetchMessages(accountId, conversationId, { page: 1 });
    } finally {
      if (selectConversationInflight === conversationId) {
        selectConversationInflight = null;
      }
    }
  },

  fetchMessages: async (accountId, conversationId, options = {}) => {
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const requestKey = `${accountId}|${conversationId}|${page}|${append ? 1 : 0}`;

    if (!append) {
      const inflight = messagesInflight.get(requestKey);
      if (inflight) return inflight;
    }

    const loadingKey = append ? "messagesLoadingMore" : "messagesLoading";

    const run = async () => {
      set({ [loadingKey]: true, error: null });

      try {
        const data = await zaloMessengerService.fetchMessages(
          accountId,
          conversationId,
          page,
        );
        const incoming = normalizeIncomingMessages(data.results ?? []);

        set((state) => {
          if (state.activeConversationId !== conversationId) return state;
          const messages = normalizeMessageList(
            append ? [...incoming, ...state.messages] : incoming,
          );
          const messageLinks = {
            next: data.links?.next ?? data.next ?? null,
            previous: data.links?.previous ?? data.previous ?? null,
          };
          const cacheKey = messageCacheKey(accountId, conversationId);
          return {
            messages,
            messageLinks,
            messagePage: page,
            messagesCache: {
              ...state.messagesCache,
              [cacheKey]: { messages, messageLinks, messagePage: page },
            },
          };
        });
      } catch {
        set({ error: "Không tải được tin nhắn." });
      } finally {
        set({ [loadingKey]: false });
        if (!append) messagesInflight.delete(requestKey);
      }
    };

    const promise = run();
    if (!append) messagesInflight.set(requestKey, promise);
    return promise;
  },

  pinConversation: async (accountId, conversationId, pinning) => {
    await zaloMessengerService.pinConversation(
      accountId,
      conversationId,
      pinning,
    );
    set((state) => ({
      conversations: dedupeConversations(
        state.conversations.map((item) =>
          item.id === conversationId ? { ...item, pinning } : item,
        ),
      ),
      activeConversation:
        state.activeConversationId === conversationId && state.activeConversation
          ? { ...state.activeConversation, pinning }
          : state.activeConversation,
    }));
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
    const wsAccountId =
      accountId ?? items.find((item) => item.account != null)?.account ?? null;

    set((state) => {
      const mergeList = (current: MessengerConversation[]) =>
        dedupeConversations([...current, ...items]);

      if (wsAccountId != null && state.selectedAccountId !== wsAccountId) {
        const cached = state.conversationCache[wsAccountId];
        if (!cached) return state;
        const conversations = mergeList(cached.conversations);
        return {
          conversationCache: saveConversationCache(
            wsAccountId,
            { ...cached, conversations },
            state.conversationCache,
          ),
        };
      }

      const conversations = mergeList(state.conversations);
      const activePatch = items.find(
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
        ...(wsAccountId != null && state.selectedAccountId === wsAccountId
          ? {
              conversationCache: saveConversationCache(
                wsAccountId,
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
            }
          : {}),
      };
    });
  },

  mergeAccountBadge: (accountId, hasUnread) => {
    set((state) => ({
      accounts: state.accounts.map((item) =>
        item.id === accountId ? { ...item, new_message: hasUnread } : item,
      ),
    }));
  },

  appendLiveMessages: (accountId, openConversation, accountUid, rawMessages) => {
    const forOpen = rawMessages.filter((msg) =>
      belongsToOpenChat(msg, openConversation, accountUid),
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

  handleMessageAck: (clientMsgId, success) => {
    set((state) => ({
      messages: state.messages.map((message) => {
        const id = message.clientMsgId ?? message.cliMsgId;
        if (id !== clientMsgId) return message;
        return {
          ...message,
          _optimistic: false,
          _status: success ? "sent" : "failed",
        };
      }),
    }));
  },

  addOptimisticMessage: (message, retryData) => {
    const clientMsgId =
      message.clientMsgId ?? message.cliMsgId ?? generateClientMsgId();
    const optimistic: DisplayMessage = {
      ...message,
      clientMsgId,
      cliMsgId: clientMsgId,
      _optimistic: true,
      _status: "sending",
      uidFrom: "0",
      _retryData: retryData,
    };
    set((state) => ({
      messages: normalizeMessageList([...state.messages, optimistic]),
    }));
    return clientMsgId;
  },

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
        ...(chatType === "send-file" ? { file_name: file.name } : {}),
      });
    }

    return payloads;
  },

  retryOptimisticMessage: (clientMsgId) => {
    const message = get().messages.find(
      (item) => (item.clientMsgId ?? item.cliMsgId) === clientMsgId,
    );
    if (!message?._retryData) return null;
    set((state) => ({
      messages: state.messages.map((item) => {
        const id = item.clientMsgId ?? item.cliMsgId;
        if (id !== clientMsgId) return item;
        return { ...item, _status: "sending" as const };
      }),
    }));
    return message._retryData;
  },

  prepareConversationSwitch: (conversationId) => {
    const state = get();
    let messagesCache = { ...state.messagesCache };

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
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
    });
  },

  resetChatState: () => {
    set({
      activeConversationId: null,
      activeConversation: null,
      messages: [],
      messageLinks: null,
      messagePage: 1,
      composerText: "",
      quoteMessage: null,
      attachmentDrafts: [],
      mobilePanel: "conversations",
    });
  },
}));

export function getConversationHasMore(
  links: { next?: string | null } | null,
): boolean {
  return extractNextPage(links) !== null;
}