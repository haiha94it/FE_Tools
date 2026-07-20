import { API_BASE_URL, API_CONSENT } from "@/config/api";
import api, { getAccessToken } from "@/lib/axios";
import { dedupeInflight } from "@/lib/inflight";
import type {
  ConsentAdminSetup,
  ConsentAdminSetupSavePayload,
  ConsentUserContract,
  MessageProcessingConsentStatus,
  MessageProcessingTerms,
  SignMessageProcessingPayload,
  SignMessageProcessingResult,
} from "@/types/consent";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function fetchPdfBlob(path: string): Promise<Blob> {
  const token = getAccessToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Không tải được PDF";
    try {
      const body = (await response.json()) as {
        message?: string;
        error?: string;
      };
      message = body.message || body.error || message;
    } catch {
      // binary error body
    }
    throw new Error(message);
  }

  return response.blob();
}

export const consentService = {
  getStatus(): Promise<MessageProcessingConsentStatus> {
    return dedupeInflight("consent:status", async () => {
      const response = await api.get<MessageProcessingConsentStatus>(
        API_CONSENT.STATUS,
      );
      return response.data;
    });
  },

  getTerms(): Promise<MessageProcessingTerms> {
    // Không dedupe lâu — mỗi lần mở modal lấy bản mới
    return dedupeInflight("consent:terms", async () => {
      const response = await api.get<MessageProcessingTerms>(API_CONSENT.TERMS);
      return response.data;
    });
  },

  async sign(
    payload: SignMessageProcessingPayload,
  ): Promise<SignMessageProcessingResult> {
    const response = await api.post<SignMessageProcessingResult>(
      API_CONSENT.SIGN,
      payload,
    );
    return response.data;
  },

  async downloadUserPdf(filename?: string): Promise<void> {
    const blob = await fetchPdfBlob(API_CONSENT.PDF);
    downloadBlob(blob, filename ?? "consent_message_processing.pdf");
  },

  getAdminSetup(): Promise<ConsentAdminSetup> {
    return dedupeInflight("consent:admin-setup", async () => {
      const response = await api.get<ConsentAdminSetup>(API_CONSENT.ADMIN_SETUP);
      return response.data;
    });
  },

  async saveAdminSetup(
    payload: ConsentAdminSetupSavePayload,
  ): Promise<ConsentAdminSetup> {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("body_html", payload.body_html);
    form.append("company_name", payload.company_name);
    form.append("company_tax_code", payload.company_tax_code);
    form.append("company_address", payload.company_address);
    if (payload.company_signature) {
      form.append("company_signature", payload.company_signature);
    }
    if (payload.contract_pdf) {
      form.append("contract_pdf", payload.contract_pdf);
    }
    if (payload.clear_contract_pdf) {
      form.append("clear_contract_pdf", "1");
    }
    const response = await api.post<ConsentAdminSetup>(
      API_CONSENT.ADMIN_SETUP,
      form,
      { timeout: 120_000 },
    );
    return response.data;
  },

  async activate(): Promise<ConsentAdminSetup> {
    const response = await api.post<ConsentAdminSetup>(
      API_CONSENT.ADMIN_ACTIVATE,
    );
    return response.data;
  },

  async deactivate(): Promise<ConsentAdminSetup> {
    const response = await api.post<ConsentAdminSetup>(
      API_CONSENT.ADMIN_DEACTIVATE,
    );
    return response.data;
  },

  async getUserContract(userId: number): Promise<ConsentUserContract> {
    const response = await api.get<ConsentUserContract>(
      API_CONSENT.adminUserContract(userId),
    );
    return response.data;
  },

  async downloadAdminUserPdf(userId: number, filename?: string): Promise<void> {
    const blob = await fetchPdfBlob(API_CONSENT.adminUserPdf(userId));
    downloadBlob(
      blob,
      filename ?? `consent_message_processing_${userId}.pdf`,
    );
  },
};
