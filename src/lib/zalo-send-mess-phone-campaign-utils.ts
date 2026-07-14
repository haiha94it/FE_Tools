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
        label: "Dừng do bị hạn chế",
        className: "text-error-600 dark:text-error-400",
      };
    case 4:
      return {
        label: "Mới tạo",
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
): string {
  switch (status) {
    case 0:
      return "Thất bại";
    case 1:
      return "Thành công";
    case 2:
      return "Không xác định";
    case 3:
      return "Hạn chế";
    case 4:
      return "Nhóm chặn chat";
    case 5:
      return "Đang chờ duyệt";
    default:
      return "Không xác định";
  }
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
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}