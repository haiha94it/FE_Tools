import type {
  AddFriendCampaignRunStatus,
  AddFriendResultStatus,
} from "@/types/zalo-add-friend-campaign";

/**
 * status kịch bản (category) — living doc:
 * 0 tạm dừng · 1 đang chạy · 2 hoàn thành · 3 bị chặn/limit · 4 chưa chạy
 */
export function formatCampaignRunStatus(
  status: AddFriendCampaignRunStatus,
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

export interface CampaignLogStatusDisplay {
  label: string;
  className: string;
}

/**
 * Màu trạng thái dòng log (khác status kịch bản).
 * Living doc: 1 thành công · 0 thất bại · 3 limit/bị chặn
 */
export function getCampaignLogResultColor(
  status: number | null | undefined,
): string {
  switch (status) {
    case 1:
      return "text-success-600 dark:text-success-400";
    case 0:
      return "text-error-600 dark:text-error-400";
    case 3:
      return "text-amber-600 dark:text-amber-400";
    case 5:
      return "text-brand-600 dark:text-brand-400";
    default:
      return "text-gray-600 dark:text-gray-400";
  }
}

export function formatResultStatus(
  status: AddFriendResultStatus,
): CampaignLogStatusDisplay {
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
    default:
      label = "Không xác định";
  }
  return { label, className: getCampaignLogResultColor(status) };
}

export function formatCampaignStartTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const [datePart, timePart] = value.split("T");
    if (!datePart) return value;
    const [y, m, d] = datePart.split("-");
    const time = timePart?.split(".")[0] ?? "";
    return `${time} — ${d}/${m}/${y}`;
  }
  return date.toLocaleString("vi-VN");
}

/** HH:mm:00 cho API — null nếu không bật khung giờ */
export function formatTimeForApi(date: Date | null): string | null {
  if (!date) return null;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}:00`;
}

export function parseTimeToDate(value?: string | null): Date | null {
  if (!value) return null;
  const parts = value.replace(/:00$/, "").split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}