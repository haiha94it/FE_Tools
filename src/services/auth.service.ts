import { API_AUTH } from "@/config/api";
import api, { clearTokens, getRefreshToken, updateTokens } from "@/lib/axios";
import { mapApiUser } from "@/lib/map-auth-user";
import type {
  ApiUserProfile,
  AuthUser,
  LoginPayload,
  LoginResponse,
} from "@/types/auth";

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_AUTH.LOGIN, payload);
    const tokens = response.data;
    if (!tokens?.access || !tokens?.refresh) {
      throw new Error("Phản hồi đăng nhập không hợp lệ");
    }
    updateTokens(tokens.access, tokens.refresh);
    return tokens;
  },

  async fetchMe(): Promise<AuthUser> {
    const response = await api.get<ApiUserProfile>(API_AUTH.ME);
    return mapApiUser(response.data);
  },

  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    if (refresh) {
      void api.post(API_AUTH.LOGOUT, { refresh }).catch(() => undefined);
    }
    clearTokens();
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(API_AUTH.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};
