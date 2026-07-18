import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import { dedupeInflight } from "@/lib/inflight";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import { getScanTaskStatus, isScanTaskDone } from "@/lib/zalo-contacts-utils";
import {
  getZaloAccountStatus,
  isZaloAccountRunnable,
} from "@/lib/zalo-account-utils";
import { zaloCampaignNotificationService } from "@/services/zalo-campaign-notification.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { ZaloAccount } from "@/types/zalo-account";
import { create } from "zustand";

interface CampaignNotificationState {
  accounts: ZaloAccount[];
  selectedAccountId: number | null;
  phoneNumber: string;
  active: boolean;
  loading: boolean;
  saving: boolean;
  accountsLoading: boolean;

  fetchAll: () => Promise<void>;
  setSelectedAccountId: (id: number | null) => void;
  setPhoneNumber: (value: string) => void;
  setActive: (value: boolean) => void;
  save: () => Promise<void>;
}

function filterEligibleAccounts(
  accounts: ZaloAccount[],
  canSkipProxy: boolean,
): ZaloAccount[] {
  return accounts.filter((account) =>
    isZaloAccountRunnable(account, canSkipProxy),
  );
}

async function pollSetupTask(
  taskId: string | number,
  maxAttempts = 40,
  intervalMs = 3000,
): Promise<{ ok: boolean; message?: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = await zaloCampaignNotificationService.pollSetupResult(taskId);
    const status = getScanTaskStatus(result);
    if (!isScanTaskDone(status)) {
      await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
      continue;
    }
    const message =
      zaloCampaignNotificationService.extractSetupOutcome(result) ??
      result.message;
    return { ok: status === "SUCCESS", message: message ?? undefined };
  }
  return { ok: false, message: "Hết thời gian chờ thiết lập." };
}

export const useZaloCampaignNotificationStore = create<CampaignNotificationState>(
  (set, get) => ({
    accounts: [],
    selectedAccountId: null,
    phoneNumber: "",
    active: false,
    loading: false,
    saving: false,
    accountsLoading: false,

    fetchAll: async () => {
      // Strict Mode / multi-mount: 1 HTTP account + campaign-notification
      return dedupeInflight("campaign-notification:fetchAll", async () => {
        set({ loading: true, accountsLoading: true });

        let accounts: ZaloAccount[] = [];
        let config: Awaited<
          ReturnType<typeof zaloCampaignNotificationService.getConfig>
        > = null;

        try {
          accounts = await fetchAccessibleAccounts();
        } catch {
          accounts = [];
        }

        try {
          config = await zaloCampaignNotificationService.getConfig();
        } catch {
          config = null;
        }

        const canSkipProxy = canSkipZaloProxyRequirement(
          useAuthStore.getState().user,
        );
        const eligible = filterEligibleAccounts(accounts, canSkipProxy);
        const accountId = config?.account ?? null;
        const selected =
          accountId != null && eligible.some((a) => a.id === accountId)
            ? accountId
            : (eligible[0]?.id ?? null);

        set({
          accounts: eligible,
          selectedAccountId: selected,
          phoneNumber: config?.phone_number?.trim() ?? "",
          active: Boolean(config?.active),
          loading: false,
          accountsLoading: false,
        });
      });
    },

    setSelectedAccountId: (id) => set({ selectedAccountId: id }),

    setPhoneNumber: (value) => set({ phoneNumber: value }),

    setActive: (value) => set({ active: value }),

    save: async () => {
      const { selectedAccountId, phoneNumber, active } = get();
      if (!selectedAccountId) {
        throw new Error("Chọn nick Zalo gửi thông báo.");
      }
      const normalizedPhone = phoneNumber.trim();
      if (!normalizedPhone) {
        throw new Error("Nhập số điện thoại Zalo nhận thông báo.");
      }

      set({ saving: true });
      try {
        const taskId = await zaloCampaignNotificationService.setup({
          id_account: selectedAccountId,
          phone_number: normalizedPhone,
          active,
        });

        if (taskId) {
          const outcome = await pollSetupTask(taskId);
          if (!outcome.ok) {
            throw new Error(outcome.message || "Thiết lập thông báo thất bại.");
          }
        }

        await get().fetchAll();
      } finally {
        set({ saving: false });
      }
    },
  }),
);

/** Hiển thị trạng thái nick trong picker */
export function getCampaignNotificationAccountLabel(
  account: ZaloAccount,
): string {
  const status = getZaloAccountStatus(account, []);
  return status.label;
}