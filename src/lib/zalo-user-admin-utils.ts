import type { ManagedUser, UserPermissionFilter } from "@/types/zalo-user-admin";

export const USER_PERMISSION_OPTIONS: {
  label: string;
  value: UserPermissionFilter;
}[] = [
  { label: "Lập trình viên", value: "is_developer" },
  { label: "Quản trị viên", value: "is_admin" },
  { label: "Quản lý Bán hàng", value: "is_sale_manager" },
  { label: "Chăm sóc khách hàng", value: "is_saler" },
  { label: "Khách hàng", value: "is_manager" },
  { label: "Chưa xác nhận mail", value: "no_active" },
  { label: "Tất cả", value: "all" },
];

export const USER_PERMISSION_CREATE_OPTIONS = USER_PERMISSION_OPTIONS.filter(
  (item) =>
    item.value !== "no_active" && item.value !== "all",
);

export const EXPORT_PERMISSION_OPTIONS = [
  { label: "Người dùng", value: "is_manager" },
  { label: "Khách hàng đại lý", value: "is_ai" },
  { label: "Dùng thử", value: "is_trial" },
  { label: "Khách hàng đại lý dùng thử", value: "is_ai_trial" },
];

export function formatManagedUserDate(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const raw = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr.split(" ")[0];
  const parts = raw.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatActivityLogDateTime(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.toLocaleDateString("vi-VN")} ${date.toLocaleTimeString("vi-VN")}`;
}

export type PermissionBadgeColor =
  | "primary"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "light"
  | "dark";

export function getPermissionFilterLabel(
  filter: UserPermissionFilter,
): string {
  return (
    USER_PERMISSION_OPTIONS.find((item) => item.value === filter)?.label ??
    "Tất cả"
  );
}

export function getManagedUserPermissionBadgeColor(
  user: ManagedUser,
): PermissionBadgeColor {
  if (user.is_trial) return "warning";
  if (user.is_admin) return "error";
  if (user.is_developer) return "info";
  if (user.is_sale_manager) return "primary";
  if (user.is_saler) return "success";
  if (user.is_manager) return "light";
  return "dark";
}

export function getManagedUserPermissionLabel(user: ManagedUser): string {
  if (user.is_trial) return "Dùng thử";
  if (user.is_admin) return "Admin";
  if (user.is_developer && !user.is_superuser) return "Lập Trình Viên";
  if (user.is_sale_manager && !user.is_superuser) return "QL Bán hàng";
  if (user.is_saler && !user.is_superuser) return "CSKH";
  if (user.is_manager && !user.is_superuser) return "KH";
  if (user.manager_name) return `NV - ${user.manager_name}`;
  return user.permission ?? "";
}

export function getSystemDomainLabel(systemDomain?: string): string {
  return systemDomain?.replace(".chotnhanh.vn", "") ?? "";
}

export function formatDateForApi(date: Date | null | undefined): string | null {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day} 23:59:59`;
}

export function toIsoDate(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().split("T")[0];
}
