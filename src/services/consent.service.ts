import { API_BASE_URL, API_CONSENT } from "@/config/api";
import api, { getAccessToken } from "@/lib/axios";
import { dedupeInflight } from "@/lib/inflight";
import type {
  ConsentAgreementPayload,
  MessageProcessingConsentStatus,
  MessageProcessingTerms,
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
    return dedupeInflight("consent:terms", async () => {
      const response = await api.get<MessageProcessingTerms>(API_CONSENT.TERMS);
      return response.data;
    });
  },

  async preview(
    payload: Omit<ConsentAgreementPayload, "signature">,
  ): Promise<{ body_html: string }> {
    const response = await api.post<{ body_html: string }>(
      API_CONSENT.PREVIEW,
      payload,
    );
    return response.data;
  },

  /** Ký và xác nhận — 1 lần POST, không OTP */
  async sign(payload: ConsentAgreementPayload): Promise<void> {
    await api.post(API_CONSENT.SIGN, payload);
  },

  async downloadUserPdf(filename?: string): Promise<void> {
    const blob = await fetchPdfBlob(API_CONSENT.PDF);
    downloadBlob(blob, filename ?? "consent_message_processing.pdf");
  },
};
