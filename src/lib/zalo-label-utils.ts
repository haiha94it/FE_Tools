import type {
  MessengerCategoryLabel,
  MessengerConversation,
} from "@/types/zalo-messenger";

export const ZALO_LABEL_MAX_COUNT = 12;

export function resolveZaloLabelColor(color?: string | null): string {
  const value = color?.trim();
  if (!value) return "#64748b";
  if (value.startsWith("#")) return value;
  const map: Record<string, string> = {
    blue: "#3b82f6",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    red: "#ef4444",
    orange: "#f97316",
    amber: "#f59e0b",
    emerald: "#10b981",
    slate: "#64748b",
  };
  return map[value.toLowerCase()] ?? value;
}

export function resolveConversationLabels(
  conversation: MessengerConversation,
  categories: MessengerCategoryLabel[],
): MessengerCategoryLabel[] {
  const raw = conversation.category_message ?? [];
  return raw.map((entry) => {
    if (typeof entry === "number") {
      return (
        categories.find((item) => item.id === entry) ?? {
          id: entry,
          name: `Nhãn #${entry}`,
        }
      );
    }
    return entry;
  });
}

export function getAssignedLabelIds(
  conversation: MessengerConversation,
): number[] {
  return (conversation.category_message ?? [])
    .map((entry) => (typeof entry === "number" ? entry : entry.id))
    .filter((id): id is number => typeof id === "number");
}