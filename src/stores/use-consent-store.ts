import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/errors";
import { consentService } from "@/services/consent.service";
import type { MessageProcessingConsentStatus } from "@/types/consent";

/** Local — tránh circular import consent-utils ↔ store */
function statusKeepsWizardOpen(
  status: MessageProcessingConsentStatus,
): boolean {
  if (!status.system_activated) return false;
  const s = status.status || "none";
  // pending/approved: đóng wizard; rejected/none: giữ force nếu đang mở ký lại
  if (s === "pending_approval" || s === "approved") return false;
  if (status.show_pending_status) return false;
  if (typeof status.need_wizard === "boolean") return status.need_wizard;
  return s === "none" || s === "rejected";
}

type ConsentState = {
  status: MessageProcessingConsentStatus | null;
  statusLoading: boolean;
  statusError: string | null;
  /** Ép mở wizard khi API gate hoặc user bấm “Tạo / ký lại” */
  forceWizardOpen: boolean;
  fetchStatus: (options?: {
    force?: boolean;
  }) => Promise<MessageProcessingConsentStatus | null>;
  applyStatus: (status: MessageProcessingConsentStatus) => void;
  openConsentWizard: () => void;
  closeConsentWizard: () => void;
  reset: () => void;
};

export const useConsentStore = create<ConsentState>((set, get) => ({
  status: null,
  statusLoading: false,
  statusError: null,
  forceWizardOpen: false,

  fetchStatus: async (options) => {
    const force = options?.force === true;
    if (!force && get().statusLoading) {
      return get().status;
    }

    set({ statusLoading: true, statusError: null });
    try {
      const status = await consentService.getStatus();
      set({
        status,
        statusLoading: false,
        statusError: null,
        forceWizardOpen: statusKeepsWizardOpen(status)
          ? get().forceWizardOpen
          : false,
      });
      return status;
    } catch (error) {
      set({
        statusLoading: false,
        statusError: getApiErrorMessage(error),
      });
      return null;
    }
  },

  applyStatus: (status) => {
    set({
      status,
      forceWizardOpen: statusKeepsWizardOpen(status)
        ? get().forceWizardOpen
        : false,
      statusError: null,
    });
  },

  openConsentWizard: () => set({ forceWizardOpen: true }),
  closeConsentWizard: () => set({ forceWizardOpen: false }),

  reset: () =>
    set({
      status: null,
      statusLoading: false,
      statusError: null,
      forceWizardOpen: false,
    }),
}));
