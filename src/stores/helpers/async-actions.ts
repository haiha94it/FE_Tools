import { API_ERROR_FALLBACK } from "@/constants/api-errors";
import { getApiErrorMessage, handleApiError } from "@/lib/errors";

type AsyncPatch = {
  isLoading?: boolean;
  error?: string | null;
};

type AsyncSet = (patch: AsyncPatch) => void;

export interface RunAsyncActionOptions {
  /** true = chỉ set error trong store, không toast (form auth dùng inline error) */
  silent?: boolean;
}

/**
 * Helper chạy async action trong Zustand store —
 * tự set isLoading/error, toast lỗi chuẩn khi fail.
 */
export async function runAsyncAction<R>(
  action: () => Promise<R>,
  set: AsyncSet,
  options?: RunAsyncActionOptions,
): Promise<R> {
  set({ isLoading: true, error: null });

  try {
    const result = await action();
    set({ isLoading: false, error: null });
    return result;
  } catch (error) {
    const messages = handleApiError(error, { silent: options?.silent });
    const message = messages[0] ?? getApiErrorMessage(error) ?? API_ERROR_FALLBACK;
    set({ isLoading: false, error: message });
    throw error;
  }
}