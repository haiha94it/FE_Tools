import axios from "axios";
import { API_CARE_AUTH, CARE_API_BASE_URL } from "@/config/api";
import { STORAGE_KEYS } from "@/constants/storage-keys";

export const CARE_TOKEN_REFRESH_FAILURE = "careTokenRefreshFailure";

interface QueuedCareRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export function isCareTokenRefreshFailure(error: unknown): boolean {
  if (error && typeof error === "object" && CARE_TOKEN_REFRESH_FAILURE in error) {
    return Boolean((error as Record<string, unknown>)[CARE_TOKEN_REFRESH_FAILURE]);
  }

  if (axios.isAxiosError(error)) {
    const url = error.config?.url ?? "";
    return url.includes(API_CARE_AUTH.REFRESH);
  }

  return false;
}

const markCareTokenRefreshFailure = (error: unknown) => {
  if (error && typeof error === "object") {
    (error as Record<string, unknown>)[CARE_TOKEN_REFRESH_FAILURE] = true;
  }
  return error;
};

export function getCareAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.CARE_ACCESS_TOKEN);
}

export function getCareRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.CARE_REFRESH_TOKEN);
}

export function updateCareTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.CARE_ACCESS_TOKEN, access);
  if (refresh) {
    localStorage.setItem(STORAGE_KEYS.CARE_REFRESH_TOKEN, refresh);
  }
}

export function clearCareTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.CARE_ACCESS_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CARE_REFRESH_TOKEN);
}

const careApi = axios.create({
  baseURL: CARE_API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshingCare = false;
let careRequestQueue: QueuedCareRequest[] = [];

const processCareQueue = (error: unknown, token: string | null = null) => {
  careRequestQueue.forEach((request) => {
    if (error) request.reject(error);
    else if (token) request.resolve(token);
  });
  careRequestQueue = [];
};

careApi.interceptors.request.use(
  async (config) => {
    let token = getCareAccessToken();
    if (!token && getCareRefreshToken()) {
      token = await refreshCareAccessToken();
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

careApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      ![401, 403].includes(error.response?.status) ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getCareRefreshToken();
    if (!refreshToken) {
      clearCareTokens();
      return Promise.reject(error);
    }

    if (isRefreshingCare) {
      return new Promise((resolve, reject) => {
        careRequestQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(careApi(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshingCare = true;

    try {
      const response = await axios.post<{ access: string; refresh: string }>(
        `${CARE_API_BASE_URL}${API_CARE_AUTH.REFRESH}`,
        { refresh: refreshToken },
      );
      const { access, refresh } = response.data;

      updateCareTokens(access, refresh);
      originalRequest.headers.Authorization = `Bearer ${access}`;
      processCareQueue(null, access);

      return careApi(originalRequest);
    } catch (refreshError) {
      markCareTokenRefreshFailure(refreshError);
      processCareQueue(refreshError, null);
      clearCareTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshingCare = false;
    }
  },
);

export async function refreshCareAccessToken(): Promise<string | null> {
  if (isRefreshingCare) {
    return new Promise((resolve) => {
      careRequestQueue.push({
        resolve: (token: string) => resolve(token),
        reject: () => resolve(null),
      });
    });
  }

  const refreshToken = getCareRefreshToken();
  if (!refreshToken) return null;

  isRefreshingCare = true;
  try {
    const response = await axios.post<{ access: string; refresh: string }>(
      `${CARE_API_BASE_URL}${API_CARE_AUTH.REFRESH}`,
      { refresh: refreshToken },
    );
    const { access, refresh } = response.data;

    updateCareTokens(access, refresh);
    processCareQueue(null, access);
    return access;
  } catch (error) {
    markCareTokenRefreshFailure(error);
    processCareQueue(error, null);
    clearCareTokens();
    return null;
  } finally {
    isRefreshingCare = false;
  }
}

export default careApi;