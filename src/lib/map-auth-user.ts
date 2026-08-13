import type { ApiUserProfile, AuthUser } from "@/types/auth";

/** Full admin settings / user manage */
export function canAccessAdminSettings(
  user: Pick<AuthUser, "isAdmin"> | null | undefined,
): boolean {
  return Boolean(user?.isAdmin);
}

/** Chuẩn hóa profile API → AuthUser */
export function mapApiUser(profile: ApiUserProfile): AuthUser {
  return {
    id: String(profile.id),
    username: profile.username,
    email: profile.mail ?? "",
    name: profile.fullname ?? profile.full_name ?? profile.username,
    phone: profile.phone_number,
    isAdmin: Boolean(profile.is_admin || profile.is_superuser),
    isPremium: Boolean(profile.is_premium),
  };
}
