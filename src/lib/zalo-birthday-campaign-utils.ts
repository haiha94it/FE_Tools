import { CARE_API_BASE_URL } from "@/config/api";
import { getCampaignLogResultColor } from "@/lib/zalo-add-friend-campaign-utils";
import type { BirthdayResultStatus } from "@/types/zalo-birthday-campaign";

export { formatCampaignStartTime } from "@/lib/zalo-add-friend-campaign-utils";

export const BIRTHDAY_DEFAULT_TEMPLATE =
  "Xin chào [gender] [name] chúc [gender] có một ngày sinh nhật vui vẻ!";

export const BIRTHDAY_CAMPAIGN_NAME = "Chúc mừng sinh nhật";

export function formatBirthdayResultStatus(
  status: BirthdayResultStatus | undefined,
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
      label = "—";
  }
  return {
    label,
    className: getCampaignLogResultColor(status),
  };
}

export function getBirthdayMediaUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${path.replace(/^\//, "")}`;
}
