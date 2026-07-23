import { handleApiError } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { chatbotService } from "@/services/chatbot.service";
import type {
  ReminderGlobalConfig,
  ReminderTimeConfig,
  ReminderTimeConfigPayload,
} from "@/types/chatbot";
import { create } from "zustand";

interface ChatbotReminderState {
  chatbotId: number | null;
  globalConfig: ReminderGlobalConfig | null;
  timeConfigs: ReminderTimeConfig[];
  maxTimeConfigs: number;
  maxMessages: number;
  maxImages: number;

  isLoadingGlobal: boolean;
  isLoadingTimeConfigs: boolean;
  isSavingGlobal: boolean;
  isSavingTimeConfig: boolean;

  setChatbotId: (id: number | null) => void;
  fetchGlobalConfig: (options?: { silent?: boolean }) => Promise<void>;
  updateGlobalConfig: (
    payload: Partial<ReminderGlobalConfig>,
  ) => Promise<boolean>;
  fetchTimeConfigs: (options?: { silent?: boolean }) => Promise<void>;
  createTimeConfig: (payload: ReminderTimeConfigPayload) => Promise<boolean>;
  updateTimeConfig: (
    id: number,
    payload: ReminderTimeConfigPayload,
  ) => Promise<boolean>;
  deleteTimeConfig: (id: number) => Promise<boolean>;
  fetchAll: (options?: { silent?: boolean }) => Promise<void>;
}

const defaultGlobal: ReminderGlobalConfig = {
  is_active: false,
  is_loop_enabled: false,
  start_time: "08:00:00",
  end_time: "21:00:00",
  excluded_category_ids: [],
  excluded_special_case_ids: [],
};

export const useChatbotReminderStore = create<ChatbotReminderState>(
  (set, get) => ({
    chatbotId: null,
    globalConfig: null,
    timeConfigs: [],
    maxTimeConfigs: 10,
    maxMessages: 10,
    maxImages: 5,

    isLoadingGlobal: false,
    isLoadingTimeConfigs: false,
    isSavingGlobal: false,
    isSavingTimeConfig: false,

    setChatbotId: (id) => {
      if (get().chatbotId === id) return;
      set({
        chatbotId: id,
        globalConfig: null,
        timeConfigs: [],
      });
    },

    fetchGlobalConfig: async (options) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) {
        set({ globalConfig: null });
        return;
      }
      const silent = options?.silent ?? false;
      if (!silent) set({ isLoadingGlobal: true });
      try {
        const globalConfig =
          await chatbotService.getReminderGlobalConfig(chatbotId);
        set({ globalConfig, isLoadingGlobal: false });
      } catch {
        // BE có thể 404 khi chưa có config — dùng default
        set({ globalConfig: { ...defaultGlobal, chatbot: chatbotId }, isLoadingGlobal: false });
      }
    },

    updateGlobalConfig: async (payload) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      set({ isSavingGlobal: true });
      try {
        const globalConfig = await chatbotService.updateReminderGlobalConfig(
          chatbotId,
          payload,
        );
        set({ globalConfig, isSavingGlobal: false });
        toast.success("Đã lưu cài đặt nhắc nhở chung.");
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingGlobal: false });
        return false;
      }
    },

    fetchTimeConfigs: async (options) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) {
        set({ timeConfigs: [] });
        return;
      }
      const silent = options?.silent ?? false;
      if (!silent) set({ isLoadingTimeConfigs: true });
      try {
        const data = await chatbotService.listReminderTimeConfigs(chatbotId);
        set({
          timeConfigs: data.results,
          maxTimeConfigs: data.maxTimeConfigs,
          maxMessages: data.maxMessages,
          maxImages: data.maxImages,
          isLoadingTimeConfigs: false,
        });
      } catch (error) {
        handleApiError(error, { silent });
        set({ isLoadingTimeConfigs: false, timeConfigs: [] });
      }
    },

    createTimeConfig: async (payload) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      set({ isSavingTimeConfig: true });
      try {
        await chatbotService.createReminderTimeConfig(chatbotId, payload);
        toast.success("Đã thêm mốc nhắc nhở.");
        set({ isSavingTimeConfig: false });
        await get().fetchTimeConfigs({ silent: true });
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingTimeConfig: false });
        return false;
      }
    },

    updateTimeConfig: async (id, payload) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      set({ isSavingTimeConfig: true });
      try {
        await chatbotService.updateReminderTimeConfig(chatbotId, id, payload);
        toast.success("Đã cập nhật mốc nhắc nhở.");
        set({ isSavingTimeConfig: false });
        await get().fetchTimeConfigs({ silent: true });
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingTimeConfig: false });
        return false;
      }
    },

    deleteTimeConfig: async (id) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      try {
        await chatbotService.deleteReminderTimeConfig(chatbotId, id);
        set((state) => ({
          timeConfigs: state.timeConfigs.filter((item) => item.id !== id),
        }));
        toast.success("Đã xóa mốc nhắc nhở.");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    fetchAll: async (options) => {
      await Promise.all([
        get().fetchGlobalConfig(options),
        get().fetchTimeConfigs(options),
      ]);
    },
  }),
);
