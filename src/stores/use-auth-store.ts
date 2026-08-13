import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clearTokens, getAccessToken } from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/errors";
import { authService } from "@/services/auth.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import type { AuthUser, LoginPayload } from "@/types/auth";

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBootstrapped: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<void>;
  fetchProfile: (options?: { force?: boolean }) => Promise<void>;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

let lastFetchProfileAt = 0;
const PROFILE_FETCH_TTL_MS = 2500;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isBootstrapped: false,
      error: null,

      login: async (payload) => {
        await runAsyncAction(
          async () => {
            await authService.login(payload);
            const user = await authService.fetchMe();
            set({ user, isAuthenticated: true });
          },
          set,
          { silent: true },
        );
      },

      fetchProfile: async (options = {}) => {
        const now = Date.now();
        if (!options.force && now - lastFetchProfileAt < PROFILE_FETCH_TTL_MS) {
          return;
        }
        lastFetchProfileAt = now;
        if (!getAccessToken()) {
          set({ user: null, isAuthenticated: false });
          return;
        }
        try {
          const user = await authService.fetchMe();
          set({ user, isAuthenticated: true, error: null });
        } catch (error) {
          clearTokens();
          set({
            user: null,
            isAuthenticated: false,
            error: getApiErrorMessage(error),
          });
        }
      },

      bootstrap: async () => {
        if (get().isBootstrapped) return;
        try {
          if (getAccessToken()) {
            await get().fetchProfile({ force: true });
          }
        } finally {
          set({ isBootstrapped: true });
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } finally {
          set({ user: null, isAuthenticated: false, error: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "tools-auth",
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);
