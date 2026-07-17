import { CARE_API_BASE_URL } from "@/config/api";
import type {
  SendMesFrCampaignRunStatus,
  SendMesFrResultStatus,
} from "@/types/zalo-send-mes-fr-campaign";

export {
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
} from "@/lib/zalo-add-friend-campaign-utils";

export function formatSendMesFrCampaignRunStatus(
  status: SendMesFrCampaignRunStatus,
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

export function formatSendMesFrResultStatus(status: SendMesFrResultStatus): string {
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

export function canEditSendMesFrFriends(status: SendMesFrCampaignRunStatus): boolean {
  return status === null || status === 2 || status === 4;
}

export function getSendMesFrMediaUrl(path: string): string {
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}