import type {
  PhoneInviteGroupCampaignRunStatus,
  PhoneInviteGroupResultStatus,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import { isZaloAccountActive } from "@/lib/zalo-account-utils";

export {
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-add-friend-campaign-utils";
import { getCampaignLogResultColor } from "@/lib/zalo-add-friend-campaign-utils";

export function formatCampaignRunStatus(
  status: PhoneInviteGroupCampaignRunStatus,
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

export const MAX_PHONE_NUMBERS = 1000;

export function formatPhoneInviteGroupResultStatus(
  status: PhoneInviteGroupResultStatus,
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
    default:
      label = "Không xác định";
  }
  return {
    label,
    className: getCampaignLogResultColor(status),
  };
}

export function normalizePhoneNumbers(
  value?: string | string[] | null,
): string {
  if (!value) return "";
  if (Array.isArray(value)) return value.join("\n");
  return value;
}

/** Doc: `${group.name || ""}|${group.avt || ""}` — avatar rỗng OK: "Tên nhóm|" */
export function buildGroupInviteString(group: PhoneInviteGroupItem): string {
  const name = group.name?.trim() || "";
  const avt = group.avt?.trim() || group.avatar?.trim() || "";
  return `${name}|${avt}`;
}

export function parseGroupInviteString(
  value?: string | null,
): { name: string; avt: string } | null {
  if (!value?.includes("|")) return null;
  const pipe = value.indexOf("|");
  const name = value.slice(0, pipe).trim();
  const avt = value.slice(pipe + 1).trim();
  if (!name) return null;
  return { name, avt };
}

export function getGroupAvatar(group: PhoneInviteGroupItem): string | undefined {
  return group.avt?.trim() || group.avatar?.trim() || undefined;
}

export function isZaloAccountRunnable(account: ZaloAccount): boolean {
  return isZaloAccountActive(account) && account.proxy?.status === true;
}

/** BE: mọi nick phải đã join nhóm trong group_invite */
export const GROUP_NOT_ON_ALL_ACCOUNTS = "GROUP_NOT_ON_ALL_ACCOUNTS";

export const GROUP_NOT_ON_ALL_ACCOUNTS_MESSAGE =
  "Một số nick chưa có nhóm này hoặc chưa sync. Bỏ nick đó hoặc chọn nhóm chung khác.";