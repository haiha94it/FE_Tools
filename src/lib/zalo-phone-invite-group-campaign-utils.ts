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

export function buildGroupInviteString(group: PhoneInviteGroupItem): string {
  const avatar = group.avt ?? group.avatar ?? "";
  return `${group.name}|${avatar}`;
}

export function parseGroupInviteString(
  value?: string | null,
): { name: string; avatar: string } | null {
  if (!value?.includes("|")) return null;
  const [name, avatar] = value.split("|");
  if (!name) return null;
  return { name, avatar: avatar ?? "" };
}

export function getGroupAvatar(group: PhoneInviteGroupItem): string | undefined {
  return group.avt ?? group.avatar;
}

export function isZaloAccountRunnable(account: ZaloAccount): boolean {
  return isZaloAccountActive(account) && account.proxy?.status === true;
}