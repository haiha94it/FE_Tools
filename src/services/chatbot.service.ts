import { API_CHATBOT } from "@/config/api";
import {
  extractChatbotList,
  normalizeList,
  normalizePaginatedList,
  normalizeTrainingImagesResponse,
  toApiTrainingImageSendMode,
} from "@/lib/chatbot-utils";
import api from "@/lib/axios";
import type {
  AssignChatbotAccountsPayload,
  ChatbotCategory,
  ChatbotCopyResponse,
  ChatbotInstance,
  ChatbotPlaceholder,
  CreateCategoryPayload,
  CreateChatbotPayload,
  CreateTrainingDataPayload,
  ReminderGlobalConfig,
  ReminderTimeConfig,
  ReminderTimeConfigPayload,
  ReminderTimeConfigsResponse,
  SpecialCaseConfig,
  SpecialCaseConfigPayload,
  SpecialCaseType,
  TrainingDataItem,
  TrainingImage,
  UpdateCategoryPayload,
  UpdateChatbotPayload,
  UpdateTrainingDataPayload,
  TestMessageResult,
} from "@/types/chatbot";

export const chatbotService = {
  /* ── Instances ── */
  async listChatbots(): Promise<{
    results: ChatbotInstance[];
    count: number;
    maxChatbots: number;
  }> {
    const response = await api.get(API_CHATBOT.CHATBOTS);
    return extractChatbotList(response.data);
  },

  async getChatbot(id: number): Promise<ChatbotInstance> {
    const response = await api.get(API_CHATBOT.CHATBOT_DETAIL(id));
    return response.data as ChatbotInstance;
  },

  async createChatbot(payload: CreateChatbotPayload): Promise<ChatbotInstance> {
    const response = await api.post(API_CHATBOT.CHATBOTS, {
      name: payload.name.trim(),
      is_active: payload.is_active ?? true,
    });
    return response.data as ChatbotInstance;
  },

  async updateChatbot(
    id: number,
    payload: UpdateChatbotPayload,
  ): Promise<ChatbotInstance> {
    const response = await api.patch(API_CHATBOT.CHATBOT_DETAIL(id), payload);
    return response.data as ChatbotInstance;
  },

  async deleteChatbot(id: number): Promise<void> {
    await api.delete(API_CHATBOT.CHATBOT_DETAIL(id));
  },

  async copyChatbot(
    chatbotId: number,
    name: string,
  ): Promise<ChatbotCopyResponse> {
    const response = await api.post(API_CHATBOT.CHATBOT_COPY, {
      chatbot_id: chatbotId,
      name: name.trim(),
    });
    return (response.data ?? {}) as ChatbotCopyResponse;
  },

  async assignAccounts(
    id: number,
    payload: AssignChatbotAccountsPayload,
  ): Promise<ChatbotInstance> {
    const response = await api.patch(API_CHATBOT.CHATBOT_ASSIGNMENTS(id), payload);
    return response.data as ChatbotInstance;
  },

  /* ── Training data ── */
  async listTrainingData(params: {
    chatbot_id: number;
    page?: number;
    number_per_page?: number;
    search?: string;
    category_id?: number;
  }): Promise<{ results: TrainingDataItem[]; count: number }> {
    const response = await api.get(API_CHATBOT.TRAINING_DATA, { params });
    const normalized = normalizePaginatedList<TrainingDataItem>(response.data);
    return { results: normalized.results, count: normalized.count };
  },

  async createTrainingData(
    payload: CreateTrainingDataPayload,
  ): Promise<TrainingDataItem> {
    const body = {
      chatbot_id: payload.chatbot_id,
      question: payload.question,
      answer: payload.answer ?? "",
      category_id: payload.category_id ?? null,
      image_send_mode: toApiTrainingImageSendMode(payload.image_send_mode),
      training_images:
        payload.training_images ?? payload.image_ids ?? [],
    };
    const response = await api.post(API_CHATBOT.TRAINING_DATA, body);
    return response.data as TrainingDataItem;
  },

  async updateTrainingData(
    id: number,
    payload: UpdateTrainingDataPayload,
  ): Promise<TrainingDataItem> {
    const body: Record<string, unknown> = { ...payload };
    if (payload.image_send_mode != null) {
      body.image_send_mode = toApiTrainingImageSendMode(payload.image_send_mode);
    }
    if (payload.image_ids != null && payload.training_images == null) {
      body.training_images = payload.image_ids;
      delete body.image_ids;
    }
    const response = await api.patch(
      API_CHATBOT.TRAINING_DATA_DETAIL(id),
      body,
    );
    return response.data as TrainingDataItem;
  },

  async deleteTrainingData(id: number): Promise<void> {
    await api.delete(API_CHATBOT.TRAINING_DATA_DETAIL(id));
  },

  async clearTrainingData(chatbotId: number): Promise<void> {
    await api.delete(API_CHATBOT.TRAINING_DATA_CLEAR, {
      params: { chatbot_id: chatbotId },
    });
  },

  async syncEmbeddings(chatbotId: number): Promise<void> {
    await api.post(API_CHATBOT.TRAINING_DATA_SYNC_EMBEDDINGS, {
      chatbot_id: chatbotId,
    });
  },

  async exportTrainingData(chatbotId: number): Promise<unknown> {
    const response = await api.get(API_CHATBOT.TRAINING_DATA_EXPORT, {
      params: { chatbot_id: chatbotId },
    });
    return response.data;
  },

  /* ── Training images ── */
  async listTrainingImages(): Promise<{
    results: TrainingImage[];
    count: number;
    maxUpload: number;
  }> {
    const response = await api.get(API_CHATBOT.TRAINING_IMAGES);
    return normalizeTrainingImagesResponse(response.data);
  },

  async uploadTrainingImage(file: File): Promise<TrainingImage> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(API_CHATBOT.TRAINING_IMAGES, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data as TrainingImage;
  },

  async deleteTrainingImages(ids: number[]): Promise<void> {
    await api.delete(API_CHATBOT.TRAINING_IMAGES, { data: { ids } });
  },

  async deleteTrainingImage(id: number): Promise<void> {
    await api.delete(API_CHATBOT.TRAINING_IMAGE_DETAIL(id));
  },

  /* ── Categories ── */
  async listCategories(chatbotId: number): Promise<ChatbotCategory[]> {
    const response = await api.get(API_CHATBOT.CATEGORIES, {
      params: { chatbot_id: chatbotId, page_size: 1000 },
    });
    return normalizeList<ChatbotCategory>(response.data);
  },

  async createCategory(
    payload: CreateCategoryPayload,
  ): Promise<ChatbotCategory> {
    const response = await api.post(API_CHATBOT.CATEGORIES, {
      ...payload,
      chatbot: payload.chatbot_id,
    });
    return response.data as ChatbotCategory;
  },

  async updateCategory(
    id: number,
    payload: UpdateCategoryPayload,
  ): Promise<ChatbotCategory> {
    const response = await api.patch(API_CHATBOT.CATEGORY_DETAIL(id), payload);
    return response.data as ChatbotCategory;
  },

  async deleteCategory(id: number): Promise<void> {
    await api.delete(API_CHATBOT.CATEGORY_DETAIL(id));
  },

  /* ── Special cases ── */
  async listSpecialCaseTypes(): Promise<SpecialCaseType[]> {
    const response = await api.get(API_CHATBOT.SPECIAL_CASE_TYPES);
    return normalizeList<SpecialCaseType>(response.data);
  },

  async listSpecialCaseConfigs(
    chatbotId: number,
  ): Promise<SpecialCaseConfig[]> {
    const response = await api.get(API_CHATBOT.SPECIAL_CASE_CONFIGS, {
      params: { chatbot_id: chatbotId, page_size: 1000 },
    });
    return normalizeList<SpecialCaseConfig>(response.data);
  },

  async createSpecialCaseConfig(
    payload: SpecialCaseConfigPayload,
  ): Promise<SpecialCaseConfig> {
    const response = await api.post(API_CHATBOT.SPECIAL_CASE_CONFIGS, payload);
    return response.data as SpecialCaseConfig;
  },

  async updateSpecialCaseConfig(
    id: number,
    payload: SpecialCaseConfigPayload,
  ): Promise<SpecialCaseConfig> {
    const response = await api.put(
      API_CHATBOT.SPECIAL_CASE_CONFIG_DETAIL(id),
      payload,
    );
    return response.data as SpecialCaseConfig;
  },

  async deleteSpecialCaseConfig(id: number): Promise<void> {
    await api.delete(API_CHATBOT.SPECIAL_CASE_CONFIG_DETAIL(id));
  },

  async listPlaceholders(): Promise<ChatbotPlaceholder[]> {
    const response = await api.get(API_CHATBOT.PLACEHOLDERS);
    const data = response.data as
      | ChatbotPlaceholder[]
      | { placeholders?: ChatbotPlaceholder[] };
    if (Array.isArray(data)) return data;
    return Array.isArray(data.placeholders) ? data.placeholders : [];
  },

  /* ── Reminders ── */
  async getReminderGlobalConfig(
    chatbotId: number,
  ): Promise<ReminderGlobalConfig> {
    const response = await api.get(API_CHATBOT.REMINDER_GLOBAL, {
      params: { chatbot_id: chatbotId },
    });
    return response.data as ReminderGlobalConfig;
  },

  async updateReminderGlobalConfig(
    chatbotId: number,
    payload: Partial<ReminderGlobalConfig>,
  ): Promise<ReminderGlobalConfig> {
    const response = await api.patch(
      API_CHATBOT.REMINDER_GLOBAL,
      {
        ...payload,
        chatbot: chatbotId,
        chatbot_id: chatbotId,
      },
      { params: { chatbot_id: chatbotId } },
    );
    return response.data as ReminderGlobalConfig;
  },

  async listReminderTimeConfigs(chatbotId: number): Promise<{
    results: ReminderTimeConfig[];
    maxTimeConfigs: number;
    maxMessages: number;
    maxImages: number;
  }> {
    const response = await api.get(API_CHATBOT.REMINDER_TIME_CONFIGS, {
      params: { chatbot_id: chatbotId },
    });
    const data = (response.data ?? {}) as ReminderTimeConfigsResponse;
    return {
      results: Array.isArray(data.results) ? data.results : [],
      maxTimeConfigs: data.max_time_configs ?? 10,
      maxMessages: data.max_messages_per_config ?? 10,
      maxImages: data.max_images_per_config ?? 5,
    };
  },

  async createReminderTimeConfig(
    chatbotId: number,
    payload: ReminderTimeConfigPayload,
  ): Promise<void> {
    await api.post(
      API_CHATBOT.REMINDER_TIME_CONFIGS,
      { ...payload, chatbot: chatbotId, chatbot_id: chatbotId },
      { params: { chatbot_id: chatbotId } },
    );
  },

  async updateReminderTimeConfig(
    chatbotId: number,
    id: number,
    payload: ReminderTimeConfigPayload,
  ): Promise<void> {
    await api.put(
      API_CHATBOT.REMINDER_TIME_CONFIG_DETAIL(id),
      { ...payload, chatbot: chatbotId, chatbot_id: chatbotId },
      { params: { chatbot_id: chatbotId } },
    );
  },

  async deleteReminderTimeConfig(
    chatbotId: number,
    id: number,
  ): Promise<void> {
    await api.delete(API_CHATBOT.REMINDER_TIME_CONFIG_DETAIL(id), {
      params: { chatbot_id: chatbotId },
    });
  },

  async copyReminderConfigs(
    sourceChatbotId: number,
    targetChatbotId: number,
  ): Promise<void> {
    await api.post(API_CHATBOT.REMINDER_COPY, {
      source_chatbot_id: sourceChatbotId,
      target_chatbot_id: targetChatbotId,
    });
  },

  async testMessage(
    chatbotId: number,
    message: string,
  ): Promise<TestMessageResult> {
    const response = await api.post(
      API_CHATBOT.TEST_MESSAGE,
      {
        chatbot_id: chatbotId,
        message,
      },
    );
    const body = response.data as {
      success?: boolean;
      result?: TestMessageResult;
    } & TestMessageResult;
    // Envelope { success, result } hoặc interceptor đã unwrap
    if (body?.result && typeof body.result === "object") {
      return body.result;
    }
    return body as TestMessageResult;
  },
};
