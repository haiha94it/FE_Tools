import { getChatbotAccountKeys } from "@/lib/chatbot-utils";
import { handleApiError } from "@/lib/errors";
import { dedupeInflight } from "@/lib/inflight";
import { toast } from "@/lib/toast";
import { chatbotService } from "@/services/chatbot.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import type {
  ChatbotDetailTab,
  ChatbotInstance,
  UpdateChatbotPayload,
} from "@/types/chatbot";
import { create } from "zustand";

interface ChatbotState {
  chatbots: ChatbotInstance[];
  maxChatbots: number;
  count: number;
  isLoading: boolean;
  error: string | null;

  selectedChatbotId: number | null;
  selectedChatbot: ChatbotInstance | null;
  detailTab: ChatbotDetailTab;
  isDetailLoading: boolean;

  isSaving: boolean;
  isCopying: boolean;

  /** Form tạo kịch bản */
  isCreateOpen: boolean;
  createName: string;

  /** Form sao chép */
  isCopyOpen: boolean;
  copySourceId: number | null;
  copyName: string;

  fetchChatbots: (options?: { silent?: boolean }) => Promise<void>;
  fetchChatbotDetail: (id: number, options?: { silent?: boolean }) => Promise<void>;
  createChatbot: () => Promise<number | null>;
  updateChatbot: (
    id: number,
    payload: UpdateChatbotPayload,
  ) => Promise<boolean>;
  deleteChatbot: (id: number) => Promise<boolean>;
  copyChatbot: () => Promise<number | null>;
  assignAccounts: (id: number, accountKeys: number[]) => Promise<boolean>;
  toggleActive: (id: number, isActive: boolean) => Promise<boolean>;

  setDetailTab: (tab: ChatbotDetailTab) => void;
  selectChatbot: (id: number | null) => void;

  openCreate: () => void;
  closeCreate: () => void;
  setCreateName: (name: string) => void;

  openCopy: (source: ChatbotInstance) => void;
  closeCopy: () => void;
  setCopyName: (name: string) => void;
}

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  chatbots: [],
  maxChatbots: 10,
  count: 0,
  isLoading: false,
  error: null,

  selectedChatbotId: null,
  selectedChatbot: null,
  detailTab: "training",
  isDetailLoading: false,

  isSaving: false,
  isCopying: false,

  isCreateOpen: false,
  createName: "",

  isCopyOpen: false,
  copySourceId: null,
  copyName: "",

  fetchChatbots: async (options) => {
    const silent = options?.silent ?? false;
    return dedupeInflight(
      `chatbot:list:${silent ? "silent" : "full"}`,
      async () => {
        if (!silent) set({ isLoading: true, error: null });

        try {
          const data = await chatbotService.listChatbots();
          const selectedId = get().selectedChatbotId;
          const selectedChatbot =
            selectedId != null
              ? (data.results.find((item) => item.id === selectedId) ??
                get().selectedChatbot)
              : get().selectedChatbot;

          set({
            chatbots: data.results,
            count: data.count,
            maxChatbots: data.maxChatbots,
            selectedChatbot,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const messages = handleApiError(error, { silent });
          set({
            isLoading: false,
            error: messages[0] ?? "Không tải được danh sách kịch bản.",
          });
        }
      },
    );
  },

  fetchChatbotDetail: async (id, options) => {
    const silent = options?.silent ?? false;
    return dedupeInflight(
      `chatbot:detail:${id}:${silent ? "silent" : "full"}`,
      async () => {
        if (!silent) set({ isDetailLoading: true, error: null });

        try {
          const chatbot = await chatbotService.getChatbot(id);
          set((state) => ({
            selectedChatbotId: id,
            selectedChatbot: chatbot,
            isDetailLoading: false,
            chatbots: state.chatbots.some((item) => item.id === id)
              ? state.chatbots.map((item) => (item.id === id ? chatbot : item))
              : state.chatbots,
          }));
        } catch (error) {
          const messages = handleApiError(error, { silent });
          set({
            isDetailLoading: false,
            error: messages[0] ?? "Không tải được chi tiết kịch bản.",
          });
        }
      },
    );
  },

  createChatbot: async () => {
    const name = get().createName.trim();
    if (!name) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return null;
    }

    const { count, maxChatbots } = get();
    if (count >= maxChatbots) {
      toast.error(`Tối đa ${maxChatbots} kịch bản.`);
      return null;
    }

    set({ isSaving: true });
    try {
      const created = await chatbotService.createChatbot({ name });
      toast.success("Đã tạo kịch bản.");
      set({ isCreateOpen: false, createName: "", isSaving: false });
      await get().fetchChatbots({ silent: true });
      return created.id ?? null;
    } catch (error) {
      handleApiError(error);
      set({ isSaving: false });
      return null;
    }
  },

  updateChatbot: async (id, payload) => {
    set({ isSaving: true });
    try {
      const updated = await chatbotService.updateChatbot(id, payload);
      set((state) => ({
        isSaving: false,
        selectedChatbot:
          state.selectedChatbotId === id ? updated : state.selectedChatbot,
        chatbots: state.chatbots.map((item) =>
          item.id === id ? { ...item, ...updated } : item,
        ),
      }));
      toast.success("Đã cập nhật kịch bản.");
      return true;
    } catch (error) {
      handleApiError(error);
      set({ isSaving: false });
      return false;
    }
  },

  deleteChatbot: async (id) => {
    try {
      await chatbotService.deleteChatbot(id);
      set((state) => ({
        chatbots: state.chatbots.filter((item) => item.id !== id),
        count: Math.max(0, state.count - 1),
        selectedChatbotId:
          state.selectedChatbotId === id ? null : state.selectedChatbotId,
        selectedChatbot:
          state.selectedChatbotId === id ? null : state.selectedChatbot,
      }));
      toast.success("Đã xóa kịch bản.");
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  },

  copyChatbot: async () => {
    const { copySourceId, copyName } = get();
    const name = copyName.trim();
    if (!copySourceId || !name) {
      toast.error("Vui lòng nhập tên kịch bản sao chép.");
      return null;
    }

    set({ isCopying: true });
    try {
      const result = await chatbotService.copyChatbot(copySourceId, name);
      const newId = result.new_chatbot_id ?? result.id ?? null;
      const parts = [
        result.copied_categories != null
          ? `${result.copied_categories} danh mục`
          : null,
        result.copied_training_data != null
          ? `${result.copied_training_data} Q&A`
          : null,
        result.copied_images != null
          ? `${result.copied_images} ảnh`
          : null,
      ].filter(Boolean);

      toast.success(
        parts.length
          ? `Đã sao chép kịch bản (${parts.join(", ")}).`
          : result.message || "Đã sao chép kịch bản.",
      );
      set({ isCopyOpen: false, copySourceId: null, copyName: "", isCopying: false });
      await get().fetchChatbots({ silent: true });
      return newId;
    } catch (error) {
      handleApiError(error);
      set({ isCopying: false });
      return null;
    }
  },

  assignAccounts: async (id, accountKeys) => {
    set({ isSaving: true });
    try {
      const updated = await chatbotService.assignAccounts(id, {
        zalo_account_keys: accountKeys,
      });
      set((state) => ({
        isSaving: false,
        selectedChatbot:
          state.selectedChatbotId === id
            ? { ...state.selectedChatbot!, ...updated }
            : state.selectedChatbot,
        chatbots: state.chatbots.map((item) =>
          item.id === id ? { ...item, ...updated } : item,
        ),
      }));
      toast.success("Đã cập nhật gán tài khoản Zalo.");
      return true;
    } catch (error) {
      handleApiError(error);
      set({ isSaving: false });
      return false;
    }
  },

  toggleActive: async (id, isActive) => {
    try {
      const updated = await chatbotService.updateChatbot(id, {
        is_active: isActive,
      });
      set((state) => ({
        selectedChatbot:
          state.selectedChatbotId === id
            ? { ...state.selectedChatbot!, is_active: isActive }
            : state.selectedChatbot,
        chatbots: state.chatbots.map((item) =>
          item.id === id ? { ...item, ...updated, is_active: isActive } : item,
        ),
      }));
      toast.success(isActive ? "Đã bật kịch bản." : "Đã tắt kịch bản.");
      return true;
    } catch (error) {
      handleApiError(error);
      return false;
    }
  },

  setDetailTab: (tab) => set({ detailTab: tab }),

  selectChatbot: (id) => {
    if (id == null) {
      set({ selectedChatbotId: null, selectedChatbot: null });
      return;
    }
    const found = get().chatbots.find((item) => item.id === id) ?? null;
    set({ selectedChatbotId: id, selectedChatbot: found });
  },

  openCreate: () => set({ isCreateOpen: true, createName: "" }),
  closeCreate: () => set({ isCreateOpen: false, createName: "" }),
  setCreateName: (name) => set({ createName: name }),

  openCopy: (source) =>
    set({
      isCopyOpen: true,
      copySourceId: source.id,
      copyName: `${source.name} (bản sao)`,
    }),
  closeCopy: () =>
    set({ isCopyOpen: false, copySourceId: null, copyName: "" }),
  setCopyName: (name) => set({ copyName: name }),
}));

export function useChatbotAccountKeys(chatbot?: ChatbotInstance | null) {
  return getChatbotAccountKeys(chatbot);
}

/** Bootstrap list — dùng cho lần mount list page */
export async function bootstrapChatbots() {
  await runAsyncAction(
    async () => {
      const data = await chatbotService.listChatbots();
      useChatbotStore.setState({
        chatbots: data.results,
        count: data.count,
        maxChatbots: data.maxChatbots,
      });
    },
    (patch) => useChatbotStore.setState(patch),
  );
}
