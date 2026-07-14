import type { AuthUser } from "@/types/auth";

export function formatAccountDate(value?: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function isAccountExpired(expirationDate?: string | null): boolean {
  if (!expirationDate) return false;
  const end = new Date(expirationDate);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

/** Nhãn quyền — đồng bộ ZaloCN ViewInforAccount */
export function getUserRoleLabel(user: AuthUser | null | undefined): string {
  if (!user) return "—";
  if (user.employeeLimit === 0 && user.isManager) return "Thường";
  if (user.isAdmin) return "Admin";
  if (user.isDeveloper) return "Lập trình viên";
  if (user.isSaler) return "CSKH";
  if (user.isEmployee) return "Nhân viên";
  if (user.isSaleManager) return "Quản lý sale";
  if (user.isAgencyAdmin) return "Quản lý đại lý";
  if (user.isManager) return "Quản lý";
  return "Người dùng";
}

export function formatCoinBalance(value?: number): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("vi-VN");
}