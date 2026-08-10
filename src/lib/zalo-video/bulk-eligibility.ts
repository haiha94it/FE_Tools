import { getApiErrorMessage } from "@/lib/errors";
import { hasZaloVideoChannel } from "@/lib/zalo-video/channel-utils";
import {
  getVideoTaskErrorMessage,
  isNoZaloVideoChannelError,
  isVideoTaskBusinessSuccess,
  normalizeVideoTaskResult,
} from "@/lib/zalo-video/task-utils";
import { zaloVideoService } from "@/services/zalo-video.service";

export interface BulkPostEligibility {
  accountId: number;
  eligible: boolean;
  /** Lý do không đủ điều kiện (tiếng Việt) */
  reason?: string;
  channelName?: string;
}

export interface CheckBulkPostEligibilityOptions {
  /** Số nick kiểm tra song song (mặc định 3) */
  concurrency?: number;
  /** Tiến độ: đã xong / tổng */
  onProgress?: (done: number, total: number) => void;
  /**
   * Nick đã xác nhận đủ điều kiện trong session hiện tại
   * (ví dụ workspace đang mở và có kênh) — bỏ qua gọi API.
   */
  knownEligibleIds?: number[];
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (!items.length) return [];

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current], current);
    }
  };

  const poolSize = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

/**
 * Kiểm tra 1 nick có đủ điều kiện đăng video kênh hay không.
 * Tiêu chí: login kênh OK (không cần QR), có thông tin kênh Zalo Video.
 */
export async function checkAccountBulkPostEligibility(
  accountId: number,
): Promise<BulkPostEligibility> {
  try {
    const info = await zaloVideoService.getChannelInfo(accountId);
    if (hasZaloVideoChannel(info)) {
      return {
        accountId,
        eligible: true,
        channelName:
          info?.name?.trim() ||
          info?.display_name?.trim() ||
          undefined,
      };
    }
  } catch {
    // getChannelInfo lỗi — thử login để xác nhận
  }

  try {
    const loginResult = normalizeVideoTaskResult(
      await zaloVideoService.loginChannel(accountId),
    );
    const errorMessage = getVideoTaskErrorMessage(loginResult);

    if (errorMessage.includes("Quét mã QR lại")) {
      return {
        accountId,
        eligible: false,
        reason: "Cần quét mã QR lại",
      };
    }

    if (isNoZaloVideoChannelError(loginResult) || isNoZaloVideoChannelError(errorMessage)) {
      return {
        accountId,
        eligible: false,
        reason: "Chưa có kênh Zalo Video",
      };
    }

    if (!isVideoTaskBusinessSuccess(loginResult)) {
      return {
        accountId,
        eligible: false,
        reason: errorMessage || "Không đăng nhập được kênh",
      };
    }

    try {
      const info = await zaloVideoService.getChannelInfo(accountId);
      if (hasZaloVideoChannel(info)) {
        return {
          accountId,
          eligible: true,
          channelName:
            info?.name?.trim() ||
            info?.display_name?.trim() ||
            undefined,
        };
      }
    } catch {
      // fallthrough
    }

    return {
      accountId,
      eligible: false,
      reason: "Chưa có kênh Zalo Video",
    };
  } catch (error) {
    return {
      accountId,
      eligible: false,
      reason: getApiErrorMessage(error),
    };
  }
}

/**
 * Kiểm tra hàng loạt nick active — chỉ nick `eligible: true` được đưa vào chọn đăng.
 */
export async function checkBulkPostEligibilityForAccounts(
  accountIds: number[],
  options: CheckBulkPostEligibilityOptions = {},
): Promise<BulkPostEligibility[]> {
  const concurrency = options.concurrency ?? 3;
  const known = new Set(options.knownEligibleIds ?? []);
  const total = accountIds.length;
  let done = 0;

  const report = () => {
    done += 1;
    options.onProgress?.(done, total);
  };

  return mapWithConcurrency(accountIds, concurrency, async (accountId) => {
    if (known.has(accountId)) {
      report();
      return { accountId, eligible: true };
    }

    const result = await checkAccountBulkPostEligibility(accountId);
    report();
    return result;
  });
}
