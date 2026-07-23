import { handleApiError } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { chatbotService } from "@/services/chatbot.service";
import type {
  ChatbotPlaceholder,
  SpecialCaseConfig,
  SpecialCaseConfigPayload,
  SpecialCaseType,
} from "@/types/chatbot";
import { create } from "zustand";

interface ChatbotSpecialCaseState {
  chatbotId: number | null;
  types: SpecialCaseType[];
  configs: SpecialCaseConfig[];
  placeholders: ChatbotPlaceholder[];
  isLoading: boolean;
  isSaving: boolean;

  setChatbotId: (id: number | null) => void;
  fetchAll: (options?: { silent?: boolean }) => Promise<void>;
  saveConfig: (
    caseType: string,
    payload: Omit<SpecialCaseConfigPayload, "case_type" | "chatbot_id" | "chatbot">,
    existingId?: number | null,
  ) => Promise<boolean>;
  deleteConfig: (id: number) => Promise<boolean>;
}

export const useChatbotSpecialCaseStore = create<ChatbotSpecialCaseState>(
  (set, get) => ({
    chatbotId: null,
    types: [],
    configs: [],
    placeholders: [],
    isLoading: false,
    isSaving: false,

    setChatbotId: (id) => {
      if (get().chatbotId === id) return;
      set({ chatbotId: id, configs: [], types: [] });
    },

    fetchAll: async (options) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) {
        set({ configs: [], types: [], placeholders: [] });
        return;
      }

      const silent = options?.silent ?? false;
      if (!silent) set({ isLoading: true });

      try {
        const [types, configs, placeholders] = await Promise.all([
          chatbotService.listSpecialCaseTypes(),
          chatbotService.listSpecialCaseConfigs(chatbotId),
          chatbotService.listPlaceholders().catch(() => [] as ChatbotPlaceholder[]),
        ]);
        set({
          types,
          configs,
          placeholders,
          isLoading: false,
        });
      } catch (error) {
        handleApiError(error, { silent });
        set({ isLoading: false });
      }
    },

    saveConfig: async (caseType, payload, existingId) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;

      set({ isSaving: true });
      try {
        const body: SpecialCaseConfigPayload = {
          chatbot_id: chatbotId,
          chatbot: chatbotId,
          case_type: caseType,
          is_active: payload.is_active,
          auto_reply: payload.auto_reply,
          keywords: payload.keywords,
          metadata: payload.metadata ?? {},
        };

        if (existingId) {
          const updated = await chatbotService.updateSpecialCaseConfig(
            existingId,
            body,
          );
          set((state) => ({
            isSaving: false,
            configs: state.configs.map((item) =>
              item.id === existingId ? updated : item,
            ),
          }));
        } else {
          const created = await chatbotService.createSpecialCaseConfig(body);
          set((state) => ({
            isSaving: false,
            configs: [...state.configs, created],
          }));
        }

        toast.success("Đã lưu tình huống đặc biệt.");
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSaving: false });
        return false;
      }
    },

    deleteConfig: async (id) => {
      try {
        await chatbotService.deleteSpecialCaseConfig(id);
        set((state) => ({
          configs: state.configs.filter((item) => item.id !== id),
        }));
        toast.success("Đã xóa cấu hình.");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },
  }),
);
