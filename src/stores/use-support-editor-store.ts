import { getApiErrorMessage } from "@/lib/errors";
import { supportChatbotService } from "@/services/support-chatbot.service";
import type {
  SupportEditor,
  SupportEligibleUser,
  SupportRoleOption,
} from "@/types/support-chatbot";
import { create } from "zustand";

interface SupportEditorState {
  editors: SupportEditor[];
  candidates: SupportEligibleUser[];
  roleCatalog: SupportRoleOption[];
  candidateSearch: string;
  roleFilter: string; // "" = all
  onlyNotEditor: boolean;
  loading: boolean;
  candidatesLoading: boolean;
  saving: boolean;
  error: string | null;

  setCandidateSearch: (v: string) => void;
  setRoleFilter: (v: string) => void;
  setOnlyNotEditor: (v: boolean) => void;
  fetchEditors: () => Promise<void>;
  fetchCandidates: () => Promise<void>;
  grant: (userId: number) => Promise<void>;
  revoke: (userId: number) => Promise<void>;
}

export const useSupportEditorStore = create<SupportEditorState>((set, get) => ({
  editors: [],
  candidates: [],
  roleCatalog: [],
  candidateSearch: "",
  roleFilter: "",
  onlyNotEditor: false,
  loading: false,
  candidatesLoading: false,
  saving: false,
  error: null,

  setCandidateSearch: (candidateSearch) => set({ candidateSearch }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setOnlyNotEditor: (onlyNotEditor) => set({ onlyNotEditor }),

  fetchEditors: async () => {
    set({ loading: true, error: null });
    try {
      const editors = await supportChatbotService.listEditors();
      set({ editors, loading: false });
    } catch (err) {
      set({ loading: false, error: getApiErrorMessage(err) });
    }
  },

  fetchCandidates: async () => {
    set({ candidatesLoading: true });
    try {
      const { candidateSearch, roleFilter, onlyNotEditor } = get();
      const data = await supportChatbotService.listEligibleUsers({
        search: candidateSearch.trim() || undefined,
        role: roleFilter || undefined,
        only_not_editor: onlyNotEditor,
      });
      set({
        candidates: data.results,
        roleCatalog: data.roles,
        candidatesLoading: false,
      });
    } catch (err) {
      set({
        candidatesLoading: false,
        error: getApiErrorMessage(err),
      });
    }
  },

  grant: async (userId) => {
    set({ saving: true });
    try {
      await supportChatbotService.grantEditor(userId);
      await Promise.all([get().fetchEditors(), get().fetchCandidates()]);
      set({ saving: false });
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },

  revoke: async (userId) => {
    set({ saving: true });
    try {
      await supportChatbotService.revokeEditor(userId);
      set((s) => ({
        editors: s.editors.filter((e) => e.user_id !== userId),
        saving: false,
      }));
      await get().fetchCandidates();
    } catch (err) {
      set({ saving: false });
      throw err;
    }
  },
}));
