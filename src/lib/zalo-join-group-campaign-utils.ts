import type { JoinGroupResultStatus } from "@/types/zalo-join-group-campaign";

export {
  formatCampaignRunStatus,
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-add-friend-campaign-utils";

export function formatJoinGroupResultStatus(status: JoinGroupResultStatus): string {
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