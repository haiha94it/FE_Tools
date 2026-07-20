import { create } from "zustand";
import { getApiErrorMessage } from "@/lib/errors";
import { consentService } from "@/services/consent.service";
import type { MessageProcessingConsentStatus } from "@/types/consent";

type ConsentState = {
  status: MessageProcessingConsentStatus | null;
  statusLoading: boolean;
  statusError: string | null;
  /** Ép mở modal khi API trả CONSENT_CHAT_REQUIRED hoặc sau sign fail */
  forceModalOpen: boolean;
  fetchStatus: (options?: { force?: boolean }) => Promise<MessageProcessingConsentStatus | null>;
  applySignedStatus: (status: MessageProcessingConsentStatus) => void;
  openConsentModal: () => void;
  closeConsentModal: () => void;
  reset: () => void;
};

export const useConsentStore = create<ConsentState>((set, get) => ({
  status: null,
  statusLoading: false,
  statusError: null,
  forceModalOpen: false,

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
        forceModalOpen: status.need_sign ? get().forceModalOpen : false,
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

  applySignedStatus: (status) => {
    set({
      status,
      forceModalOpen: false,
      statusError: null,
    });
  },

  openConsentModal: () => set({ forceModalOpen: true }),
  closeConsentModal: () => set({ forceModalOpen: false }),

  reset: () =>
    set({
      status: null,
      statusLoading: false,
      statusError: null,
      forceModalOpen: false,
    }),
}));
