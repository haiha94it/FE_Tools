import type { JoinGroupResultStatus } from "@/types/zalo-join-group-campaign";
import type { CampaignLogStatusDisplay } from "@/lib/zalo-add-friend-campaign-utils";
import { getCampaignLogResultColor } from "@/lib/zalo-add-friend-campaign-utils";

export {
  formatCampaignRunStatus,
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-add-friend-campaign-utils";

export function formatJoinGroupResultStatus(
  status: JoinGroupResultStatus,
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
    case 5:
      label = "Đang chờ duyệt";
      break;
    default:
      label = "Không xác định";
  }
  return { label, className: getCampaignLogResultColor(status) };
}
