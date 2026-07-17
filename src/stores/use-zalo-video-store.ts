"use client";

import { getApiErrorMessage } from "@/lib/errors";
import {
  getVideoTaskErrorMessage,
  isVideoTaskBusinessSuccess,
  normalizeVideoTaskResult,
} from "@/lib/zalo-video/task-utils";
import { hasZaloVideoChannel } from "@/lib/zalo-video/channel-utils";
import { patchDataFbWebSession, refreshCsrfToken } from "@/lib/zalo-video/session";
import { syncDataFbAccounts } from "@/lib/zalo-video/sync-data-fb";
import { toast } from "@/lib/toast";
import { zaloVideoService } from "@/services/zalo-video.service";
import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import type { RenewGeneralType, ZaloChannelInfo } from "@/types/zalo-video";
import type { ZaloAccount } from "@/types/zalo-account";
import { create } from "zustand";

interface ActivateAccountOptions {
  /** Bỏ qua cache session — dùng sau khi quét QR lại */
  force?: boolean;
}

interface ZaloVideoState {
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  channelInfo: ZaloChannelInfo | null;
  channelLoading: boolean;
  loginLoading: boolean;
  channelError: string | null;
  needsQr: boolean;
  noChannel: boolean;
  sessionAccountId: number | null;
  activatingAccountId: number | null;

  fetchAccounts: () => Promise<void>;
  activateAccount: (
    accountId: number,
    options?: ActivateAccountOptions,
  ) => Promise<void>;
  refreshChannelInfo: (accountId: number) => Promise<void>;
  renewChannel: (accountId: number) => Promise<void>;
  renewGeneral: (accountId: number, type: RenewGeneralType) => Promise<void>;
  resetChannelState: () => void;
}

export const useZaloVideoStore = create<ZaloVideoState>((set, get) => ({
  accounts: [],
  accountsLoading: false,
  channelInfo: null,
  channelLoading: false,
  loginLoading: false,
  channelError: null,
  needsQr: false,
  noChannel: false,
  sessionAccountId: null,
  activatingAccountId: null,

  resetChannelState: () => {
    set({
      channelInfo: null,
      channelError: null,
      needsQr: false,
      noChannel: false,
      sessionAccountId: null,
      activatingAccountId: null,
    });
  },

  fetchAccounts: async () => {
    set({ accountsLoading: true });
    try {
      const accounts = await fetchAccessibleAccounts();
      syncDataFbAccounts(accounts);
      set({ accounts, accountsLoading: false });
    } catch (error) {
      set({ accountsLoading: false });
      toast.error(getApiErrorMessage(error));
    }
  },

  refreshChannelInfo: async (accountId: number) => {
    set({ channelLoading: true });
    try {
      const info = await zaloVideoService.getChannelInfo(accountId);
      set({ channelInfo: info, channelLoading: false });
    } catch {
      set({ channelInfo: null, channelLoading: false });
    }
  },

  activateAccount: async (accountId: number, options?: ActivateAccountOptions) => {
    const force = options?.force ?? false;
    const state = get();

    if (!force) {
      if (
        state.loginLoading &&
        state.activatingAccountId === accountId
      ) {
        return;
      }

      if (
        state.sessionAccountId === accountId &&
        hasZaloVideoChannel(state.channelInfo) &&
        !state.channelError &&
        !state.needsQr &&
        !state.noChannel
      ) {
        return;
      }
    }

    const account = state.accounts.find((item) => item.id === accountId);
    set({
      loginLoading: true,
      activatingAccountId: accountId,
      channelError: null,
      needsQr: false,
      noChannel: false,
      channelInfo: null,
      sessionAccountId: null,
    });

    try {
      // 1) BE login channel trước — lấy web_session mới (CSRF cần cookie này)
      const result = normalizeVideoTaskResult(
        await zaloVideoService.loginChannel(accountId),
      );
      const errorMessage = getVideoTaskErrorMessage(result);

      if (errorMessage.includes("Quét mã QR lại")) {
        set({
          needsQr: true,
          loginLoading: false,
          activatingAccountId: null,
        });
        return;
      }

      if (!isVideoTaskBusinessSuccess(result)) {
        if (errorMessage.includes("Bạn cần có kênh")) {
          set({
            noChannel: true,
            channelError: errorMessage,
            loginLoading: false,
            activatingAccountId: null,
          });
        } else {
          set({
            channelError: errorMessage,
            loginLoading: false,
            activatingAccountId: null,
          });
          toast.error(errorMessage);
        }
        return;
      }

      // 2) Lưu webSession từ BE → localStorage rồi mới lấy CSRF (Next → Zalo)
      // Celery result nằm ở result.result sau normalizeVideoTaskResult
      const rawResult = result as {
        web_session?: string;
        webSession?: string;
        result?: { web_session?: string; webSession?: string };
      };
      const webSession =
        rawResult.web_session
        ?? rawResult.webSession
        ?? rawResult.result?.web_session
        ?? rawResult.result?.webSession;
      if (webSession) {
        patchDataFbWebSession(accountId, webSession);
        set({
          accounts: get().accounts.map((item) =>
            item.id === accountId ? { ...item, webSession } : item,
          ),
        });
      }
      try {
        await refreshCsrfToken(accountId);
      } catch {
        // CSRF lỗi không chặn xem info kênh
      }

      const info = await zaloVideoService.getChannelInfo(accountId);
      set({
        channelInfo: info,
        loginLoading: false,
        activatingAccountId: null,
        sessionAccountId: accountId,
        needsQr: Boolean(account?.checkpoint),
      });
    } catch (error) {
      set({ loginLoading: false, activatingAccountId: null });
      toast.error(getApiErrorMessage(error));
    }
  },

  renewChannel: async (accountId: number) => {
    try {
      await zaloVideoService.renewChannel(accountId);
      toast.success("Đã làm mới dữ liệu kênh");
      await get().refreshChannelInfo(accountId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  },

  renewGeneral: async (accountId: number, type: RenewGeneralType) => {
    try {
      await zaloVideoService.renewGeneralChannel(accountId, type);
      toast.success("Đã làm mới thống kê");
      await get().refreshChannelInfo(accountId);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  },
}));