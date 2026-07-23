import { CARE_API_BASE_URL } from "@/config/api";
import type {
  SendMessMemberGrAssignMode,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignRunStatus,
  SendMessMemberGrResultStatus,
} from "@/types/zalo-send-mess-member-gr-campaign";
import type { ZaloAccount } from "@/types/zalo-account";

export {
  formatCampaignStartTime,
  formatTimeForApi,
  parseTimeToDate,
} from "@/lib/zalo-add-friend-campaign-utils";
import { getCampaignLogResultColor } from "@/lib/zalo-add-friend-campaign-utils";

export function formatSendMessMemberGrCampaignRunStatus(
  status: SendMessMemberGrCampaignRunStatus,
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

export function formatSendMessMemberGrResultStatus(
  status: SendMessMemberGrResultStatus | undefined,
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
      label = "Không chạy";
      break;
    case 3:
      label = "Hạn chế / limit";
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

/**
 * Cấu trúc (nick / nhóm / TV / assign_mode) — chỉ khóa khi đang chạy (status === 1).
 * Nội dung + media vẫn sửa được khi status === 1.
 */
export function canEditSendMessMemberGrTargets(
  status: SendMessMemberGrCampaignRunStatus,
): boolean {
  return status !== 1;
}

export function getSendMessMemberGrMemberCount(campaign: {
  member_count?: number;
  list_uid_count?: number;
}): number {
  if (typeof campaign.member_count === "number") return campaign.member_count;
  if (typeof campaign.list_uid_count === "number") return campaign.list_uid_count;
  return 0;
}

export function formatSendMessMemberGrAssignMode(
  mode: SendMessMemberGrAssignMode | undefined,
): string {
  return mode === "all"
    ? "Mọi nick gửi tất cả TV"
    : "Chia thành viên cho các nick";
}

export function getSendMessMemberGrMediaUrl(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return "";
  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }
  const base = CARE_API_BASE_URL.replace(/\/$/, "");
  return `${base}/${raw.replace(/^\//, "")}`;
}

/** Format datetime cho export CSV/Excel */
export function formatSendMessMemberGrExportDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Thống kê ngày BE: %d-%m-%Y (vd 20-07-2026).
 * Input HTML date = YYYY-MM-DD.
 */
export function toSendMessMemberGrStatsDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}-${m}-${y}`;
}

export function downloadSendMessMemberGrResultsCsv(
  rows: SendMessMemberGrCampaignResult[],
  accounts: ZaloAccount[],
  filename: string,
): void {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const headers = [
    "Thời gian",
    "Nick ID",
    "Nick (tên)",
    "Người nhận",
    "Nội dung tin",
    "Lời kết bạn",
    "TT gửi tin",
    "Lý do tin",
    "TT kết bạn",
    "Lý do KB",
    "Có media",
  ];

  const escape = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...rows.map((row) => {
      const account = accountMap.get(row.account);
      const hasMedia = Boolean(
        row.thumb_url || row.image || (row.images && row.images.length),
      );
      return [
        formatSendMessMemberGrExportDateTime(row.created_at),
        row.account,
        account?.name || "",
        row.name || "",
        row.content || "",
        row.first_message || "",
        formatSendMessMemberGrResultStatus(row.status_send_message).label,
        row.status_send_message_message || "",
        formatSendMessMemberGrResultStatus(row.status_add_friend).label,
        row.status_add_friend_message || row.status_find_info_message || "",
        hasMedia ? "Có" : "Không",
      ]
        .map(escape)
        .join(",");
    }),
  ];

  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}