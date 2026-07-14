import type { InviteJoinGroupResultStatus } from "@/types/zalo-invite-join-group-campaign";

export {
  formatCampaignRunStatus,
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-add-friend-campaign-utils";

export function formatInviteJoinGroupResultStatus(
  status: InviteJoinGroupResultStatus,
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

export function normalizePhoneNumbers(
  value?: string | string[] | null,
): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  return value;
}