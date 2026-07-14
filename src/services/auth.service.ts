import { API_AUTH, API_BASE_URL, API_ZALO_USER_ADMIN } from "@/config/api";
import api, { clearTokens, getRefreshToken, updateTokens } from "@/lib/axios";
import { clearCareTokens, updateCareTokens } from "@/lib/care-axios";
import { mapApiUser } from "@/lib/map-auth-user";
import type {
  ApiUserProfile,
  AuthUser,
  LoginCareResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from "@/types/auth";

function resolveIsPro(): boolean {
  return !API_BASE_URL.includes("care.chotnhanh.vn");
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(API_AUTH.LOGIN, payload);
    const tokens = response.data;
    updateTokens(tokens.access, tokens.refresh);
    return tokens;
  },

  async loginCare(): Promise<LoginCareResponse> {
    const response = await api.post<LoginCareResponse>(API_AUTH.LOGIN_CARE, {});
    const tokens = response.data;
    updateCareTokens(tokens.access, tokens.refresh);
    return tokens;
  },

  async fetchMe(): Promise<AuthUser> {
    const response = await api.get<ApiUserProfile>(API_AUTH.ME);
    return mapApiUser(response.data);
  },

  async logout(): Promise<void> {
    const refresh = getRefreshToken();
    try {
      if (refresh) {
        await api.post(API_AUTH.LOGOUT, { refresh });
      }
    } finally {
      clearTokens();
      clearCareTokens();
    }
  },

  /** Đăng ký tài khoản — ZaloCN */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const response = await api.post<RegisterResponse | null>(
      API_AUTH.REGISTER,
      {
        ...payload,
        is_pro: payload.is_pro ?? resolveIsPro(),
      },
    );
    return {
      ...(response.data ?? {}),
      message: response.apiMessage ?? response.data?.message,
    };
  },

  /** Yêu cầu reset mật khẩu — ZaloCN */
  async resetPassword(
    payload: ResetPasswordPayload,
  ): Promise<ResetPasswordResponse> {
    const response = await api.post<ResetPasswordResponse | null>(
      API_AUTH.RESET_PASSWORD,
      payload,
    );
    return {
      ...(response.data ?? {}),
      message: response.apiMessage ?? response.data?.message,
    };
  },

  /** Đổi mật khẩu tài khoản đang đăng nhập */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await api.post(API_ZALO_USER_ADMIN.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};