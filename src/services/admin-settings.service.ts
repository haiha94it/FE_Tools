import { API_POPUP, API_UPLOAD } from "@/config/api";
import api from "@/lib/axios";
import { unwrapApiBody } from "@/lib/api-response";
import { dedupeInflight } from "@/lib/inflight";
import type {
  PopupAlertItem,
  PopupContentItem,
  PopupLogoItem,
  SaveCommunityPopupPayload,
  SaveExpirationPopupPayload,
  SaveHtmlPopupPayload,
  SaveLogoPayload,
  SavePopupAlertPayload,
  SaveRegisterPopupPayload,
} from "@/types/admin-settings";

function normalizeList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  return [];
}

function normalizeItem<T>(body: unknown): T | null {
  if (body == null) return null;
  if (Array.isArray(body)) return (body[0] as T) ?? null;
  return body as T;
}

export const adminSettingsService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await api.post(API_UPLOAD.SERVER, formData, {
      timeout: 120_000,
    });
    const body = unwrapApiBody<{ image?: string }>(response.data);
    const image = body.image;
    if (!image) {
      throw new Error("Không nhận được link ảnh sau khi upload.");
    }
    return image;
  },

  /** GET popup — dedupe Strict Mode double mount trên mọi tab settings */
  async listAlerts(): Promise<PopupAlertItem[]> {
    return dedupeInflight("admin-settings:listAlerts", async () => {
      const response = await api.get(API_POPUP.ALERT);
      return normalizeList<PopupAlertItem>(unwrapApiBody(response.data));
    });
  },

  async saveAlert(payload: SavePopupAlertPayload): Promise<void> {
    await api.post(API_POPUP.ALERT_EDIT, {
      popups: [
        {
          id: payload.id ?? null,
          link: payload.link ?? "",
          image: payload.image,
          active: payload.active,
        },
      ],
    });
  },

  async deleteAlerts(ids: number[]): Promise<void> {
    await api.post(API_POPUP.ALERT_DELETE, { ids });
  },

  async getExpiration(): Promise<PopupContentItem | null> {
    return dedupeInflight("admin-settings:getExpiration", async () => {
      const response = await api.get(API_POPUP.EXPIRATION);
      return normalizeItem<PopupContentItem>(unwrapApiBody(response.data));
    });
  },

  async saveExpiration(payload: SaveExpirationPopupPayload): Promise<void> {
    await api.post(API_POPUP.EXPIRATION_EDIT, payload);
  },

  async getLogo(): Promise<PopupLogoItem | null> {
    return dedupeInflight("admin-settings:getLogo", async () => {
      const response = await api.get(API_POPUP.LOGO);
      return normalizeItem<PopupLogoItem>(unwrapApiBody(response.data));
    });
  },

  async saveLogo(payload: SaveLogoPayload): Promise<void> {
    await api.post(API_POPUP.LOGO_EDIT, payload);
  },

  async getRegisterPopup(): Promise<PopupContentItem | null> {
    return dedupeInflight("admin-settings:getRegisterPopup", async () => {
      const response = await api.get(API_POPUP.REGISTER);
      return normalizeItem<PopupContentItem>(unwrapApiBody(response.data));
    });
  },

  async saveRegisterPopup(payload: SaveRegisterPopupPayload): Promise<void> {
    await api.post(API_POPUP.REGISTER_EDIT, payload);
  },

  async getTermPopup(): Promise<PopupContentItem | null> {
    return dedupeInflight("admin-settings:getTermPopup", async () => {
      const response = await api.get(API_POPUP.TERM);
      return normalizeItem<PopupContentItem>(unwrapApiBody(response.data));
    });
  },

  async saveTermPopup(payload: SaveHtmlPopupPayload): Promise<void> {
    await api.post(API_POPUP.TERM_EDIT, {
      content: payload.content,
      active: payload.active,
      image: payload.image ?? "",
    });
  },

  async getDecreePopup(): Promise<PopupContentItem | null> {
    return dedupeInflight("admin-settings:getDecreePopup", async () => {
      const response = await api.get(API_POPUP.DECREE);
      return normalizeItem<PopupContentItem>(unwrapApiBody(response.data));
    });
  },

  async saveDecreePopup(payload: SaveHtmlPopupPayload): Promise<void> {
    await api.post(API_POPUP.DECREE_EDIT, {
      content: payload.content,
      active: payload.active,
      image: payload.image ?? "",
    });
  },

  async getCommunityPopup(): Promise<PopupContentItem | null> {
    return dedupeInflight("admin-settings:getCommunityPopup", async () => {
      const response = await api.get(API_POPUP.COMMUNITY);
      return normalizeItem<PopupContentItem>(unwrapApiBody(response.data));
    });
  },

  async saveCommunityPopup(payload: SaveCommunityPopupPayload): Promise<void> {
    await api.post(API_POPUP.COMMUNITY_EDIT, {
      content: payload.content,
      link: payload.link,
      active: payload.active,
      type: payload.type ?? "care",
    });
  },
};