import type {
  DisplayMessage,
  MessengerConversation,
  MessengerConversationFilter,
} from "@/types/zalo-messenger";

export interface ConversationCacheEntry {
  conversations: MessengerConversation[];
  conversationLinks: { next?: string | null } | null;
  conversationPage: number;
  conversationSearch: string;
  conversationFilter: MessengerConversationFilter;
  selectedCategoryId: number | null;
}

export interface MessageCacheEntry {
  messages: DisplayMessage[];
  messageLinks: { next?: string | null; previous?: string | null } | null;
  messagePage: number;
}

export function messageCacheKey(
  accountId: number,
  conversationId: number,
): string {
  return `${accountId}:${conversationId}`;
}

export function saveConversationCache(
  accountId: number | null,
  entry: Omit<ConversationCacheEntry, never>,
  cache: Record<number, ConversationCacheEntry>,
): Record<number, ConversationCacheEntry> {
  if (!accountId) return cache;
  return { ...cache, [accountId]: entry };
}

export function loadConversationCache(
  accountId: number,
  cache: Record<number, ConversationCacheEntry>,
): ConversationCacheEntry | null {
  return cache[accountId] ?? null;
}