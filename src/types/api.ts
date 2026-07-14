/**
 * Envelope response chuẩn dự án:
 * { success, message, data }
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

/** Response API chuẩn phân trang */
export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
}

/** Lỗi validation field từ backend */
export interface ApiFieldErrors {
  [field: string]: string[];
}

export interface ApiErrorBody {
  success?: boolean;
  data?: unknown;
  detail?: string;
  message?: string;
  error?: string;
  /** Một số endpoint CN trả message qua field status */
  status?: string;
  error_code?: string;
  type?: string;
  errors?: ApiFieldErrors;
  non_field_errors?: string[];
}

/** Trạng thái async chung cho Zustand store */
export interface AsyncState {
  isLoading: boolean;
  error: string | null;
}

/** Kết quả parse lỗi API — dùng bởi handleApiError / getApiErrorMessage */
export interface ParsedApiError {
  messages: string[];
  status?: number;
  isNetworkError?: boolean;
  /** Bỏ qua toast (vd. care token refresh failure) */
  skipped?: boolean;
}