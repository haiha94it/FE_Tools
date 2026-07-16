import type { ApiUserProfile, AuthUser } from "@/types/auth";

/** Chỉ super admin — trang Cài đặt hệ thống (/admin/settings) */
export function canAccessAdminSettings(
  user: Pick<AuthUser, "isAdmin"> | null | undefined,
): boolean {
  return Boolean(user?.isAdmin);
}

/**
 * CRUD hướng dẫn & tài nguyên — chỉ quản trị viên hệ thống (is_admin / is_superuser).
 * Manager KH, nhân viên, CSKH chỉ xem nội dung, không thấy Thêm/Sửa/Xóa.
 */
export function canManageGuidesAndResources(
  user: Pick<
    AuthUser,
    "isAdmin" | "isEmployee" | "isManager" | "isSaler" | "isSaleManager"
  > | null | undefined,
): boolean {
  if (!user?.isAdmin) return false;
  if (user.isEmployee || user.isManager) return false;
  if (user.isSaler || user.isSaleManager) return false;
  return true;
}

/** Admin / saler / sale manager — truy cập Quản lý người dùng (/admin/users) */
export function canAccessUserAdmin(
  user: Pick<AuthUser, "isAdmin" | "isSaler" | "isSaleManager"> | null | undefined,
): boolean {
  if (!user) return false;
  return Boolean(user.isAdmin || user.isSaler || user.isSaleManager);
}

/** Admin / saler / sale manager — được để trống proxy khi thêm/sửa tài khoản Zalo */
export function canSkipZaloProxyRequirement(
  user: Pick<AuthUser, "isAdmin" | "isSaler" | "isSaleManager"> | null | undefined,
): boolean {
  if (!user) return false;
  return Boolean(user.isAdmin || user.isSaler || user.isSaleManager);
}

/** Chuẩn hóa profile API → AuthUser cho store/UI */
export function mapApiUser(profile: ApiUserProfile): AuthUser {
  return {
    id: String(profile.id),
    username: profile.username,
    email: profile.mail ?? "",
    name: profile.fullname ?? profile.full_name ?? profile.username,
    phone: profile.phone_number,
    facebookLink: profile.facebook_link,
    coinBalance: profile.coin_balance,
    expirationDate: profile.expiration_date,
    accountCount: profile.account_count,
    accountLimit: profile.account_limit,
    employeeLimit: profile.employee_limit,
    isAdmin: profile.is_admin ?? profile.is_superuser,
    isSaler: profile.is_saler,
    isSaleManager: profile.is_sale_manager,
    isAgencyAdmin: profile.is_agency_admin,
    isManager: profile.is_manager,
    isEmployee: profile.is_employee,
    isDeveloper: profile.is_developer,
    acceptTerms: profile.accept_terms ?? false,
  };
}