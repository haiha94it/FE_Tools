import axios from "axios";
import { API_AUTH, API_BASE_URL } from "@/config/api";
import { unwrapAuthTokens } from "@/lib/api-response";
import careApi, {
  getCareAccessToken,
  getCareRefreshToken,
  updateCareTokens,
} from "@/lib/care-axios";
import { getAccessToken } from "@/lib/axios";
import type { LoginCareResponse } from "@/types/auth";

let activeLoginPromise: Promise<boolean> | null = null;

/** Đăng nhập Care bằng token API chính — dùng trước khi gọi Zalo messenger */
export async function loginCareWithMainToken(): Promise<boolean> {
  if (activeLoginPromise) {
    return activeLoginPromise;
  }

  const mainAccessToken = getAccessToken();
  if (!mainAccessToken) return false;

  activeLoginPromise = (async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_AUTH.LOGIN_CARE}`,
        {},
        { headers: { Authorization: `Bearer ${mainAccessToken}` } },
      );
      const tokens = unwrapAuthTokens(response.data) as LoginCareResponse;
      updateCareTokens(tokens.access, tokens.refresh);
      return true;
    } catch {
      return false;
    } finally {
      activeLoginPromise = null;
    }
  })();

  return activeLoginPromise;
}

export async function ensureCareAuth(): Promise<boolean> {
  if (getCareAccessToken() || getCareRefreshToken()) return true;
  return loginCareWithMainToken();
}

/** Bọc request Care — tự login/refresh khi cần */
export async function withCareAuth<T>(request: () => Promise<T>): Promise<T> {
  const authed = await ensureCareAuth();
  if (!authed) {
    throw new Error("Chưa đăng nhập Care. Vui lòng đăng nhập lại.");
  }

  try {
    return await request();
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      throw error;
    }

    const relogged = await loginCareWithMainToken();
    if (!relogged) throw error;
    return request();
  }
}

export { careApi };