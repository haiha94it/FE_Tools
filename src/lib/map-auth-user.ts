import type { ApiUserProfile, AuthUser } from "@/types/auth";

/** Full Cài đặt hệ thống (mọi tab) — admin/superuser */
export function canAccessAdminSettings(
  user: Pick<AuthUser, "isAdmin"> | null | undefined,
): boolean {
  return Boolean(user?.isAdmin);
}

/**
 * Setup bot hỏi đáp CSKH — admin hoặc user đã được gán editor
 * (`can_manage_support_faq` từ /me). Role supporter/saler alone không đủ.
 */
export function canAccessSupportBotSetup(
  user: Pick<AuthUser, "isAdmin" | "canManageSupportFaq"> | null | undefined,
): boolean {
  return Boolean(user?.isAdmin || user?.canManageSupportFaq);
}

/** Vào /admin/settings: admin (full) hoặc editor bot (chỉ tab bot) */
export function canAccessAdminSettingsPage(
  user: Pick<AuthUser, "isAdmin" | "canManageSupportFaq"> | null | undefined,
): boolean {
  return canAccessAdminSettings(user) || canAccessSupportBotSetup(user);
}

/**
 * CRUD hướng dẫn & tài nguyên — quản trị viên hệ thống (is_admin / is_superuser).
 * Đồng bộ ZaloCN: chỉ cần is_admin; user thường chỉ xem, không thấy Thêm/Sửa/Xóa.
 *
 * Không loại trừ theo is_manager / is_saler / is_employee: nhiều tài khoản admin
 * vẫn mang các cờ đó trên API — loại theo cờ phụ sẽ ẩn nút dù đang là admin.
 */
export function canManageGuidesAndResources(
  user: Pick<AuthUser, "isAdmin"> | null | undefined,
): boolean {
  return Boolean(user?.isAdmin);
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
    expirationDate: profile.expiration_date,
    accountCount: profile.account_count,
    accountLimit: profile.account_limit,
    employeeLimit: profile.employee_limit,
    // `??` sai khi is_admin=false nhưng is_superuser=true
    isAdmin: Boolean(profile.is_admin || profile.is_superuser),
    isSaler: profile.is_saler,
    isSaleManager: profile.is_sale_manager,
    isAgencyAdmin: profile.is_agency_admin,
    isManager: profile.is_manager,
    isEmployee: profile.is_employee,
    isDeveloper: profile.is_developer,
    isSupporter: Boolean(profile.is_supporter),
    canManageSupportFaq: Boolean(
      profile.can_manage_support_faq ||
        profile.is_admin ||
        profile.is_superuser,
    ),
    acceptTerms: profile.accept_terms ?? false,
  };
}
