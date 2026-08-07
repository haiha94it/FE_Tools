import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearTokens, getAccessToken } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/errors";
import { dedupeInflight } from "@/lib/inflight";
import { authService } from "@/services/auth.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import { useConsentStore } from "@/stores/use-consent-store";
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
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  ensureCareSession: () => Promise<boolean>;
  bootstrap: () => Promise<void>;
  activateEmail: (token: string) => Promise<void>;
  acceptTerms: (payload?: {
    signature?: string;
    contractPdfBase64?: string;
    contractFilename?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  toggleNewMessageNotification: (enable: boolean) => Promise<void>;
  clearError: () => void;
}

/** Tránh Strict Mode / double mount gọi /me liên tiếp trong vài giây */
let lastFetchProfileAt = 0;
const PROFILE_FETCH_TTL_MS = 2500;

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
            result.status ||
            (result.message && result.message !== "OK" ? result.message : "") ||
            "Yêu cầu khôi phục mật khẩu đã được gửi thành công. Vui lòng kiểm tra email của bạn."
          );
        } catch (error) {
          const message = getApiErrorMessage(error);
          set({ isLoading: false, error: message });
          throw error;
        }
      },

      fetchProfile: async (options = {}) => {
        const force = options.force === true;
        if (
          !force &&
          get().user &&
          Date.now() - lastFetchProfileAt < PROFILE_FETCH_TTL_MS
        ) {
          return;
        }

        await dedupeInflight("auth:fetchProfile", async () => {
          try {
            await runAsyncAction(
              async () => {
                const user = await dedupeInflight("auth:fetchMe", () =>
                  authService.fetchMe(),
                );
                set({ user, isAuthenticated: true });
                // Team context (permissions + accounts) — 1 lần, có dedupe riêng
                await useTeamCollaborationStore
                  .getState()
                  .bootstrapTeamContext();
                lastFetchProfileAt = Date.now();
              },
              set,
              { silent: true },
            );
          } catch {
            clearTokens();
            set({
              user: null,
              isAuthenticated: false,
              isCareReady: false,
            });
          }
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
            lastFetchProfileAt = Date.now();
            await useTeamCollaborationStore.getState().bootstrapTeamContext({
              force: true,
            });
          },
          set,
          { silent: true },
        );
      },

      bootstrap: async () => {
        return dedupeInflight("auth:bootstrap", async () => {
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
            // fetchProfile đã gọi bootstrapTeamContext — không gọi lại
            await get().fetchProfile({ force: true });
            set({ isCareReady: true });
          } catch (error) {
            set({ error: getApiErrorMessage(error) });
          } finally {
            set({ isBootstrapped: true });
          }
        });
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
        // Ngắt kết nối websocket & bắn API logout ngầm
        try {
          useWebSocketStore.getState().disconnect();
          void authService.logout();
        } catch {
          // ignore
        }

        // SPA không F5: xóa state theo user (messenger/accounts/consent/team)
        try {
          const { useZaloMessengerStore } = await import(
            "@/stores/use-zalo-messenger-store"
          );
          useZaloMessengerStore.getState().resetSession();
        } catch {
          // ignore — vẫn clear auth bên dưới
        }
        try {
          const { useZaloAccountStore } = await import(
            "@/stores/use-zalo-account-store"
          );
          useZaloAccountStore.getState().resetSession();
        } catch {
          // ignore
        }
        useConsentStore.getState().reset();
        useTeamCollaborationStore.setState({
          campaignPermissions: null,
          assignedAccounts: [],
          permissionsLoaded: false,
          accountsLoaded: false,
        });
        lastFetchProfileAt = 0;

        // Reset Auth State & Xóa localStorage persister
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("zalo-admin-auth");
          } catch {
            // ignore
          }
        }
        set({
          user: null,
          isAuthenticated: false,
          isCareReady: false,
          isLoading: false,
          error: null,
        });
      },

      toggleNewMessageNotification: async (enable: boolean) => {
        await authService.changeNewMessageNotification(enable);
        set((state) => ({
          user: state.user
            ? { ...state.user, newMessageNotification: enable }
            : null,
        }));
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