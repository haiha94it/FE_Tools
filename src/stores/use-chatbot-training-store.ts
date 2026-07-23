import { handleApiError } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { chatbotService } from "@/services/chatbot.service";
import type {
  ChatbotCategory,
  CreateCategoryPayload,
  CreateTrainingDataPayload,
  TrainingDataItem,
  TrainingImage,
  UpdateCategoryPayload,
  UpdateTrainingDataPayload,
} from "@/types/chatbot";
import { create } from "zustand";

interface ChatbotTrainingState {
  chatbotId: number | null;

  trainingData: TrainingDataItem[];
  trainingCount: number;
  isLoadingTraining: boolean;
  trainingSearch: string;
  categoryFilter: number | null;
  hideAutoHarvested: boolean;
  page: number;
  pageSize: number;

  categories: ChatbotCategory[];
  isLoadingCategories: boolean;

  images: TrainingImage[];
  imageCount: number;
  maxUpload: number;
  isLoadingImages: boolean;
  selectedImageIds: number[];
  isUploading: boolean;

  isSavingTraining: boolean;
  isSavingCategory: boolean;

  setChatbotId: (id: number | null) => void;
  setTrainingSearch: (value: string) => void;
  setCategoryFilter: (id: number | null) => void;
  setHideAutoHarvested: (value: boolean) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  fetchTrainingData: (options?: { silent?: boolean }) => Promise<void>;
  createTrainingData: (payload: CreateTrainingDataPayload) => Promise<boolean>;
  updateTrainingData: (
    id: number,
    payload: UpdateTrainingDataPayload,
  ) => Promise<boolean>;
  deleteTrainingData: (id: number) => Promise<boolean>;
  clearAllTrainingData: () => Promise<boolean>;
  syncEmbeddings: () => Promise<boolean>;
  exportTrainingData: () => Promise<unknown>;

  fetchCategories: (options?: { silent?: boolean }) => Promise<void>;
  createCategory: (payload: CreateCategoryPayload) => Promise<boolean>;
  updateCategory: (
    id: number,
    payload: UpdateCategoryPayload,
  ) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;

  fetchImages: (options?: { silent?: boolean }) => Promise<void>;
  uploadImages: (files: File[]) => Promise<boolean>;
  deleteImages: (ids: number[]) => Promise<boolean>;
  toggleSelectImage: (id: number) => void;
  clearSelectedImages: () => void;
  setSelectedImageIds: (ids: number[]) => void;
}

export const useChatbotTrainingStore = create<ChatbotTrainingState>(
  (set, get) => ({
    chatbotId: null,

    trainingData: [],
    trainingCount: 0,
    isLoadingTraining: false,
    trainingSearch: "",
    categoryFilter: null,
    hideAutoHarvested: false,
    page: 1,
    pageSize: 20,

    categories: [],
    isLoadingCategories: false,

    images: [],
    imageCount: 0,
    maxUpload: 200,
    isLoadingImages: false,
    selectedImageIds: [],
    isUploading: false,

    isSavingTraining: false,
    isSavingCategory: false,

    setChatbotId: (id) => {
      if (get().chatbotId === id) return;
      set({
        chatbotId: id,
        trainingData: [],
        trainingCount: 0,
        categories: [],
        trainingSearch: "",
        categoryFilter: null,
        page: 1,
      });
    },

    setTrainingSearch: (value) => set({ trainingSearch: value, page: 1 }),
    setCategoryFilter: (id) => set({ categoryFilter: id, page: 1 }),
    setHideAutoHarvested: (value) => set({ hideAutoHarvested: value }),
    setPage: (page) => set({ page }),
    setPageSize: (size) => set({ pageSize: size, page: 1 }),

    fetchTrainingData: async (options) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) {
        set({ trainingData: [], trainingCount: 0 });
        return;
      }

      const silent = options?.silent ?? false;
      if (!silent) set({ isLoadingTraining: true });

      try {
        const { trainingSearch, categoryFilter, page, pageSize } = get();
        const params: {
          chatbot_id: number;
          page: number;
          number_per_page: number;
          search?: string;
          category_id?: number;
        } = {
          chatbot_id: chatbotId,
          page,
          number_per_page: pageSize,
        };
        const search = trainingSearch.trim();
        if (search) params.search = search;
        if (categoryFilter != null) params.category_id = categoryFilter;

        const data = await chatbotService.listTrainingData(params);
        set({
          trainingData: data.results,
          trainingCount: data.count,
          isLoadingTraining: false,
        });
      } catch (error) {
        handleApiError(error, { silent });
        set({ isLoadingTraining: false, trainingData: [], trainingCount: 0 });
      }
    },

    createTrainingData: async (payload) => {
      set({ isSavingTraining: true });
      try {
        await chatbotService.createTrainingData(payload);
        toast.success("Đã thêm Q&A.");
        set({ isSavingTraining: false });
        await get().fetchTrainingData({ silent: true });
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingTraining: false });
        return false;
      }
    },

    updateTrainingData: async (id, payload) => {
      set({ isSavingTraining: true });
      try {
        const updated = await chatbotService.updateTrainingData(id, payload);
        set((state) => ({
          isSavingTraining: false,
          trainingData: state.trainingData.map((item) =>
            item.id === id ? { ...item, ...updated } : item,
          ),
        }));
        toast.success("Đã cập nhật Q&A.");
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingTraining: false });
        return false;
      }
    },

    deleteTrainingData: async (id) => {
      try {
        await chatbotService.deleteTrainingData(id);
        set((state) => ({
          trainingData: state.trainingData.filter((item) => item.id !== id),
          trainingCount: Math.max(0, state.trainingCount - 1),
        }));
        toast.success("Đã xóa Q&A.");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    clearAllTrainingData: async () => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      try {
        await chatbotService.clearTrainingData(chatbotId);
        set({ trainingData: [], trainingCount: 0 });
        toast.success("Đã xóa toàn bộ Q&A.");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    syncEmbeddings: async () => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return false;
      try {
        await chatbotService.syncEmbeddings(chatbotId);
        toast.info("Đang đồng bộ vector embedding…");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    exportTrainingData: async () => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) return null;
      try {
        const data = await chatbotService.exportTrainingData(chatbotId);
        toast.success("Đã xuất dữ liệu huấn luyện.");
        return data;
      } catch (error) {
        handleApiError(error);
        return null;
      }
    },

    fetchCategories: async (options) => {
      const chatbotId = get().chatbotId;
      if (!chatbotId) {
        set({ categories: [] });
        return;
      }
      const silent = options?.silent ?? false;
      if (!silent) set({ isLoadingCategories: true });
      try {
        const categories = await chatbotService.listCategories(chatbotId);
        set({ categories, isLoadingCategories: false });
      } catch (error) {
        handleApiError(error, { silent });
        set({ isLoadingCategories: false, categories: [] });
      }
    },

    createCategory: async (payload) => {
      set({ isSavingCategory: true });
      try {
        await chatbotService.createCategory(payload);
        toast.success("Đã tạo danh mục.");
        set({ isSavingCategory: false });
        await get().fetchCategories({ silent: true });
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingCategory: false });
        return false;
      }
    },

    updateCategory: async (id, payload) => {
      set({ isSavingCategory: true });
      try {
        const updated = await chatbotService.updateCategory(id, payload);
        set((state) => ({
          isSavingCategory: false,
          categories: state.categories.map((item) =>
            item.id === id ? { ...item, ...updated } : item,
          ),
        }));
        toast.success("Đã cập nhật danh mục.");
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isSavingCategory: false });
        return false;
      }
    },

    deleteCategory: async (id) => {
      try {
        await chatbotService.deleteCategory(id);
        set((state) => ({
          categories: state.categories.filter((item) => item.id !== id),
          categoryFilter:
            state.categoryFilter === id ? null : state.categoryFilter,
        }));
        toast.success("Đã xóa danh mục.");
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    fetchImages: async (options) => {
      const silent = options?.silent ?? false;
      if (!silent) set({ isLoadingImages: true });
      try {
        const data = await chatbotService.listTrainingImages();
        set({
          images: data.results,
          imageCount: data.count,
          maxUpload: data.maxUpload,
          isLoadingImages: false,
        });
      } catch (error) {
        handleApiError(error, { silent });
        set({ isLoadingImages: false });
      }
    },

    uploadImages: async (files) => {
      if (!files.length) return false;
      set({ isUploading: true });
      let successCount = 0;
      try {
        for (const file of files) {
          await chatbotService.uploadTrainingImage(file);
          successCount += 1;
        }
        toast.success(
          successCount === 1
            ? "Đã tải lên 1 ảnh."
            : `Đã tải lên ${successCount} ảnh.`,
        );
        set({ isUploading: false });
        await get().fetchImages({ silent: true });
        return true;
      } catch (error) {
        handleApiError(error);
        set({ isUploading: false });
        if (successCount > 0) {
          await get().fetchImages({ silent: true });
        }
        return false;
      }
    },

    deleteImages: async (ids) => {
      if (!ids.length) return false;
      try {
        await chatbotService.deleteTrainingImages(ids);
        set((state) => ({
          images: state.images.filter((img) => !ids.includes(img.id)),
          imageCount: Math.max(0, state.imageCount - ids.length),
          selectedImageIds: state.selectedImageIds.filter(
            (id) => !ids.includes(id),
          ),
        }));
        toast.success(
          ids.length === 1 ? "Đã xóa ảnh." : `Đã xóa ${ids.length} ảnh.`,
        );
        return true;
      } catch (error) {
        handleApiError(error);
        return false;
      }
    },

    toggleSelectImage: (id) =>
      set((state) => ({
        selectedImageIds: state.selectedImageIds.includes(id)
          ? state.selectedImageIds.filter((item) => item !== id)
          : [...state.selectedImageIds, id],
      })),

    clearSelectedImages: () => set({ selectedImageIds: [] }),
    setSelectedImageIds: (ids) => set({ selectedImageIds: ids }),
  }),
);
