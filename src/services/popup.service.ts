import { API_BASE_URL, API_POPUP } from "@/config/api";
import api from "@/lib/axios";
import type { DecreeItem, RegisterPopupItem } from "@/types/auth";

export const popupService = {
  async getRegisterPopup(): Promise<RegisterPopupItem | null> {
    const { data } = await api.get<RegisterPopupItem[]>(API_POPUP.REGISTER);
    return data?.[0] ?? null;
  },

  async getDecree(): Promise<DecreeItem | null> {
    const { data } = await api.get<DecreeItem>(API_POPUP.DECREE);
    return data ?? null;
  },

  resolvePopupImage(image?: string): string | null {
    if (!image) return null;
    if (image.startsWith("http")) return image;
    return `${API_BASE_URL}/${image.replace(/^\//, "")}`;
  },

  resolvePopupContent(content?: string): string {
    if (!content) {
      return "Đăng ký thành công! Vui lòng kiểm tra email hoặc liên hệ hỗ trợ.<br />Lưu ý: Nếu không thấy mail, hãy kiểm tra hộp thư rác.";
    }
    if (typeof window === "undefined") return content;
    return content.replace(/{{\s*domain\s*}}/g, window.location.origin);
  },
};