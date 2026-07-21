import { CARE_API_BASE_URL } from "@/config/api";
import type {
  SendMessPhoneCampaignRunStatus,
  SendMessPhoneResultStatus,
} from "@/types/zalo-send-mess-phone-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import { isZaloAccountActive } from "@/lib/zalo-account-utils";

export {
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-add-friend-campaign-utils";
import { getCampaignLogResultColor } from "@/lib/zalo-add-friend-campaign-utils";

export const MAX_PHONE_NUMBERS = 1000;

export function formatSendMessPhoneCampaignRunStatus(
  status: SendMessPhoneCampaignRunStatus,
): { label: string; className: string } {
  switch (status) {
    case 0:
      return {
        label: "Tạm dừng",
        className: "text-error-600 dark:text-error-400",
      };
    case 1:
      return {
        label: "Đang chạy",
        className: "text-amber-700 dark:text-amber-400",
      };
    case 2:
      return {
        label: "Hoàn thành",
        className: "text-brand-600 dark:text-brand-400",
      };
    case 3:
      return {
        label: "Bị chặn / limit",
        className: "text-error-600 dark:text-error-400",
      };
    case 4:
      return {
        label: "Chưa chạy",
        className: "text-gray-600 dark:text-gray-400",
      };
    default:
      return {
        label: "—",
        className: "text-gray-400",
      };
  }
}

export function formatSendMessPhoneResultStatus(
  status: SendMessPhoneResultStatus,
): { label: string; className: string } {
  let label: string;
  switch (status) {
    case 0:
      label = "Thất bại";
      break;
    case 1:
      label = "Thành công";
      break;
    case 2:
      label = "Không xác định";
      break;
    case 3:
      label = "Hạn chế";
      break;
    case 4:
      label = "Nhóm chặn chat";
      break;
    case 5:
      label = "Đang chờ duyệt";
      break;
    default:
      label = "Không xác định";
  }
  return {
    label,
    className: getCampaignLogResultColor(status),
  };
}

export function canEditSendMessPhoneNumbers(
  status: SendMessPhoneCampaignRunStatus,
): boolean {
  return status === null || status === 2 || status === 4;
}

export function normalizePhoneNumbers(
  value?: string | string[] | null,
): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  return value;
}

export function isZaloAccountRunnable(account: ZaloAccount): boolean {
  return isZaloAccountActive(account) && account.proxy?.status === true;
}

export function getSendMessPhoneMediaUrl(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${raw.replace(/^\//, "")}`;
}