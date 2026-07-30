import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/errors";
import { consentService } from "@/services/consent.service";
import type { MessageProcessingConsentStatus } from "@/types/consent";

/** Local — tránh circular import consent-utils ↔ store */
function statusKeepsWizardOpen(
  status: MessageProcessingConsentStatus,
): boolean {
  if (!status.system_activated) return false;
  if (status.is_employee) return false;
  return (
    status.need_wizard &&
    (status.status === "none" || status.status === "rejected")
  );
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
