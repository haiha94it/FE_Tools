import type { NavItemConfig, NavSubItem } from "@/config/navigation";
import type { AuthUser } from "@/types/auth";
import type {
  CampaignPermissionsMap,
  CampaignTypeKey,
  CampaignWithTeamMeta,
  SentByPayload,
  TeamCategoryFields,
  TeamUserRef,
} from "@/types/team-collaboration";

/** Map path sidebar → key quyền chiến dịch (§4.7) */
export const CAMPAIGN_PATH_PERMISSION: Record<string, CampaignTypeKey> = {
  "/zalo-campaigns/join-group": "join_group",
  "/zalo-campaigns/invite-join-group": "invite_group",
  "/zalo-campaigns/phone-number-invite-group": "invite_phone_group",
  "/zalo-campaigns/send-mes-fr": "mess_friend",
  "/zalo-campaigns/send-mes-group": "mess_group",
  "/zalo-campaigns/send-mess-member-gr": "mess_member_group",
  /** Gộp KB SĐT + nhắn SĐT — quyền mess_phone | add_friend (OR) */
  "/zalo-campaigns/send-mess-number-phone": "mess_phone",
  "/zalo-campaigns/messenger-birthday": "mess_birthday",
};

/** Manager-only cứng (không thuộc gói socialmedia) */
export const MANAGER_ONLY_PATHS = new Set([
  "/zalo-accounts/proxy",
  "/zalo-accounts/contacts",
]);

/** Birthday + Channel — manager hoặc NV socialmedia */
export const SOCIALMEDIA_MODULE_PATHS = new Set([
  "/zalo-campaigns/post-video",
  "/zalo-campaigns/messenger-birthday",
]);

/** Admin panel only — sidebar `roles: ["admin"]` + TeamRouteGuard */
export const ADMIN_ONLY_PATHS = new Set(["/shop"]);

export const TEAM_MANAGER_PATH_PREFIX = "/team/employees";

/** Manager — CRUD nick, proxy, listener (CARE 2 §2) */
export function canManageNickCrud(
  user: Pick<AuthUser, "isEmployee" | "isManager"> | null | undefined,
): boolean {
  return !isEmployeeUser(user);
}

/** Manager hoặc NV được gán quyền socialmedia (SN + Channel). */
export function canUseSocialmediaModules(
  user: Pick<AuthUser, "isManager" | "canUseSocialmedia" | "isSocialmediaEmployee"> | null | undefined,
): boolean {
  if (!user) return false;
  if (isManagerUser(user)) return true;
  return Boolean(user.canUseSocialmedia || user.isSocialmediaEmployee);
}

export function canToggleListener(
  user: Pick<AuthUser, "isEmployee"> | null | undefined,
): boolean {
  return !isEmployeeUser(user);
}

/** Chỉ manager tạo/sửa/xóa định nghĩa nhãn chat */
export function canManageLabelDefinitions(
  user: Pick<AuthUser, "isEmployee"> | null | undefined,
): boolean {
  return !isEmployeeUser(user);
}

export function isManagerOnlyPath(pathname: string): boolean {
  return [...MANAGER_ONLY_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isSocialmediaModulePath(pathname: string): boolean {
  return [...SOCIALMEDIA_MODULE_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isAdminOnlyPath(pathname: string): boolean {
  return [...ADMIN_ONLY_PATHS].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isCampaignPermissionPath(pathname: string): boolean {
  return Object.keys(CAMPAIGN_PATH_PERMISSION).some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function canAccessAdminRoute(
  pathname: string,
  user: AuthUser | null | undefined,
  permissions: CampaignPermissionsMap | null = null,
): boolean {
  if (!user) return false;

  if (isAdminOnlyPath(pathname)) {
    return Boolean(user.isAdmin);
  }

  if (isSocialmediaModulePath(pathname)) {
    // permissions.mess_birthday true khi NV slot (API); fallback khi /me chưa refetch.
    return (
      canUseSocialmediaModules(user) || Boolean(permissions?.mess_birthday)
    );
  }

  if (isManagerOnlyPath(pathname)) {
    return canManageNickCrud(user);
  }

  if (
    pathname === TEAM_MANAGER_PATH_PREFIX ||
    pathname.startsWith(`${TEAM_MANAGER_PATH_PREFIX}/`)
  ) {
    return canManageTeam(user);
  }

  const campaignKey = Object.entries(CAMPAIGN_PATH_PERMISSION).find(
    ([path]) => pathname === path || pathname.startsWith(`${path}/`),
  )?.[1];

  if (campaignKey) {
    return hasCampaignPermission(permissions, campaignKey, user);
  }

  return true;
}

export function isManagerUser(
  user: Pick<AuthUser, "isManager"> | null | undefined,
): boolean {
  return Boolean(user?.isManager);
}

export function isEmployeeUser(
  user: Pick<AuthUser, "isEmployee"> | null | undefined,
): boolean {
  return Boolean(user?.isEmployee);
}

export function canManageTeam(
  user: Pick<AuthUser, "isManager" | "employeeLimit"> | null | undefined,
): boolean {
  if (!user?.isManager) return false;
  return (user.employeeLimit ?? 0) > 0;
}

export function hasCampaignPermission(
  permissions: CampaignPermissionsMap | null,
  key: CampaignTypeKey,
  user: Pick<AuthUser, "isManager" | "canUseSocialmedia" | "isSocialmediaEmployee"> | null | undefined,
): boolean {
  if (isManagerUser(user)) return true;
  if (key === "mess_birthday" && canUseSocialmediaModules(user)) return true;
  if (!permissions) return false;
  // Cutover: màn mess-phone gộp — đủ mess_phone hoặc add_friend (legacy)
  if (key === "mess_phone" || key === "add_friend") {
    return Boolean(permissions.mess_phone || permissions.add_friend);
  }
  return Boolean(permissions[key]);
}

export function filterCampaignSubItems(
  subItems: NavSubItem[] | undefined,
  permissions: CampaignPermissionsMap | null,
  user: AuthUser | null,
): NavSubItem[] {
  if (!subItems?.length) return [];
  return subItems.filter((item) => {
    const key = CAMPAIGN_PATH_PERMISSION[item.path];
    if (!key) return true;
    return hasCampaignPermission(permissions, key, user);
  });
}

export function filterNavItemsForTeam(
  items: NavItemConfig[],
  user: AuthUser | null,
  permissions: CampaignPermissionsMap | null,
): NavItemConfig[] {
  const employee = isEmployeeUser(user);

  return items
    .map((item) => {
      if (item.name === "Chiến dịch tự động" && item.subItems) {
        let subItems = filterCampaignSubItems(item.subItems, permissions, user);
        if (employee) {
          const allowSocial =
            canUseSocialmediaModules(user) ||
            Boolean(permissions?.mess_birthday);
          subItems = subItems.filter((sub) => {
            if (SOCIALMEDIA_MODULE_PATHS.has(sub.path)) return allowSocial;
            if (MANAGER_ONLY_PATHS.has(sub.path)) return false;
            return true;
          });
        }
        if (subItems.length === 0) return null;
        return { ...item, subItems };
      }

      if (employee && item.path === "/zalo-accounts") {
        return { ...item, name: "Nick được gán" };
      }

      if (item.name === "Quản lý nhân viên") {
        return canManageTeam(user) ? item : null;
      }

      return item;
    })
    .filter((item): item is NavItemConfig => item !== null);
}

export function formatTeamCreator(createdBy?: TeamUserRef | null): string {
  if (!createdBy) return "—";
  return createdBy.fullname?.trim() || createdBy.username;
}

export interface CampaignTeamAccess {
  isMine: boolean;
  canSelect: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewResults: boolean;
  canStartStop: boolean;
  isReadOnlyDetail: boolean;
}

export function getCampaignTeamAccess<T extends TeamCategoryFields>(
  campaign: CampaignWithTeamMeta<T>,
  user: AuthUser | null,
): CampaignTeamAccess {
  const isMine = campaign.is_mine !== false;
  const manager = isManagerUser(user);
  const employee = isEmployeeUser(user);

  if (employee && !isMine) {
    return {
      isMine: false,
      canSelect: false,
      canEdit: false,
      canDelete: false,
      canViewResults: false,
      canStartStop: false,
      isReadOnlyDetail: true,
    };
  }

  if (manager && !isMine) {
    return {
      isMine: false,
      canSelect: true,
      canEdit: false,
      canDelete: true,
      canViewResults: true,
      canStartStop: true,
      isReadOnlyDetail: true,
    };
  }

  return {
    isMine: true,
    canSelect: true,
    canEdit: true,
    canDelete: true,
    canViewResults: true,
    canStartStop: true,
    isReadOnlyDetail: false,
  };
}

export function shouldShowSentByLabel(
  sentBy: TeamUserRef | SentByPayload | null | undefined,
  currentUserId: string | undefined,
): boolean {
  if (!sentBy?.id || !currentUserId) return false;
  return String(sentBy.id) !== currentUserId;
}

export function formatSentByLabel(
  sentBy: SentByPayload | TeamUserRef | null | undefined,
): string {
  if (!sentBy) return "";
  return sentBy.fullname?.trim() || sentBy.username;
}

export function filterSelectableCampaignIds<T extends TeamCategoryFields & { id: number }>(
  campaigns: T[],
  user: AuthUser | null,
): number[] {
  return campaigns
    .filter((campaign) => getCampaignTeamAccess(campaign, user).canSelect)
    .map((campaign) => campaign.id);
}

export function filterStartStopCampaignIds<T extends TeamCategoryFields & { id: number }>(
  campaigns: T[],
  ids: number[],
  user: AuthUser | null,
): number[] {
  const byId = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  return ids.filter((id) => {
    const campaign = byId.get(id);
    if (!campaign) return false;
    return getCampaignTeamAccess(campaign, user).canStartStop;
  });
}

export function toggleAllSelectableIds(
  selectableIds: number[],
  selectedIds: number[],
): number[] {
  const allSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIds.includes(id));
  return allSelected ? [] : selectableIds;
}

export function resolveCampaignStatusDisplay<
  T extends TeamCategoryFields,
  S extends number | null | undefined = number,
>(
  campaign: T,
  formatLocal: (status: S) => { label: string; className: string },
): { label: string; className: string } {
  const rawStatus = (campaign as { status?: S }).status;
  const local = formatLocal((rawStatus ?? 0) as S);
  const remoteLabel = campaign.status_label?.trim();
  if (remoteLabel) {
    return { ...local, label: remoteLabel };
  }
  return local;
}
