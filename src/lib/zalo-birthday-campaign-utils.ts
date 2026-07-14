import { CARE_API_BASE_URL } from "@/config/api";
import type { BirthdayResultStatus } from "@/types/zalo-birthday-campaign";

export { formatCampaignStartTime } from "@/lib/zalo-add-friend-campaign-utils";

export const BIRTHDAY_DEFAULT_TEMPLATE =
  "Xin chào [gender] [name] chúc [gender] có một ngày sinh nhật vui vẻ!";

export const BIRTHDAY_CAMPAIGN_NAME = "Chúc mừng sinh nhật";

export function formatBirthdayResultStatus(
  status: BirthdayResultStatus | undefined,
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
      return "—";
  }
}

export function getBirthdayMediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}