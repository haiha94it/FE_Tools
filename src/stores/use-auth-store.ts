import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearTokens, getAccessToken } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import { useTeamCollaborationStore } from "@/stores/use-team-collaboration-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isCareReady: boolean;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  resetPassword: (payload: ResetPasswordPayload) => Promise<string>;
  fetchProfile: () => Promise<void>;
  ensureCareSession: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
  activateEmail: (token: string) => Promise<void>;
  acceptTerms: (payload?: {
    signature?: string;
    contractPdfBase64?: string;
    contractFilename?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isCareReady: false,
      isLoading: false,
      isBootstrapped: false,
      error: null,

      login: async (payload) => {
        await runAsyncAction(
          async () => {
            await authService.login(payload);
            const user = await authService.fetchMe();
            set({
              user,
              isAuthenticated: true,
              isCareReady: true,
            });
            await useTeamCollaborationStore.getState().bootstrapTeamContext();
          },
          set,
          { silent: true },
        );
      },

      register: async (payload) => {
        await runAsyncAction(
          async () => {
            await authService.register(payload);
          },
          set,
          { silent: true },
        );
      },

      resetPassword: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const result = await authService.resetPassword(payload);
          set({ isLoading: false, error: null });
          return (
            result.message ||
            result.status ||
            "Yêu cầu đã được gửi. Vui lòng kiểm tra thông tin."
          );
        } catch (error) {
          const message = getApiErrorMessage(error);
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      fetchProfile: async () => {
        await runAsyncAction(
          async () => {
            const user = await authService.fetchMe();
            set({ user, isAuthenticated: true });
            await useTeamCollaborationStore.getState().bootstrapTeamContext();
          },
          set,
          { silent: true },
        ).catch(() => {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            isCareReady: false,
          });
        });
      },

      ensureCareSession: async () => {
        const ready = Boolean(getAccessToken());
        set({ isCareReady: ready });
        return ready;
      },

      activateEmail: async (token) => {
        await runAsyncAction(
          async () => {
            await authService.activateRegister(token);
            const user = await authService.fetchMe();
            set({
              user,
              isAuthenticated: true,
              isCareReady: true,
              isBootstrapped: true,
            });
            await useTeamCollaborationStore.getState().bootstrapTeamContext();
          },
          set,
          { silent: true },
        );
      },

      bootstrap: async () => {
        const token = getAccessToken();
        if (!token) {
          set({
            isBootstrapped: true,
            isAuthenticated: false,
            isCareReady: false,
            user: null,
          });
          return;
        }

        try {
          await get().fetchProfile();
          await useTeamCollaborationStore.getState().bootstrapTeamContext();
          set({ isCareReady: true });
        } catch (error) {
          set({ error: getApiErrorMessage(error) });
        } finally {
          set({ isBootstrapped: true });
        }
      },

      acceptTerms: async (payload) => {
        await runAsyncAction(
          async () => {
            await authService.acceptTerms(
              payload?.signature || payload?.contractPdfBase64
                ? {
                    signature: payload.signature,
                    contract_pdf: payload.contractPdfBase64,
                    contract_filename: payload.contractFilename,
                  }
                : undefined,
            );
            const user = await authService.fetchMe();
            set({ user, isAuthenticated: true });
          },
          set,
          { silent: true },
        );
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          useWebSocketStore.getState().disconnect();
          await authService.logout();
        } finally {
          useTeamCollaborationStore.setState({
            campaignPermissions: null,
            assignedAccounts: [],
            permissionsLoaded: false,
            accountsLoaded: false,
          });
          set({
            user: null,
            isAuthenticated: false,
            isCareReady: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "zalo-admin-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isCareReady: state.isCareReady,
      }),
      skipHydration: true,
    },
  ),
);