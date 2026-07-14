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
  "/zalo-campaigns/add-friend": "add_friend",
  "/zalo-campaigns/join-group": "join_group",
  "/zalo-campaigns/invite-join-group": "invite_group",
  "/zalo-campaigns/phone-number-invite-group": "invite_phone_group",
  "/zalo-campaigns/send-mes-fr": "mess_friend",
  "/zalo-campaigns/send-mes-group": "mess_group",
  "/zalo-campaigns/send-mess-member-gr": "mess_member_group",
  "/zalo-campaigns/send-mess-number-phone": "mess_phone",
  "/zalo-campaigns/messenger-birthday": "mess_birthday",
};

export const MANAGER_ONLY_PATHS = new Set([
  "/zalo-accounts/proxy",
  "/zalo-accounts/contacts",
]);

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
  user: Pick<AuthUser, "isManager"> | null | undefined,
): boolean {
  if (isManagerUser(user)) return true;
  if (!permissions) return false;
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
      if (item.name === "Chiến dịch" && item.subItems) {
        const subItems = filterCampaignSubItems(item.subItems, permissions, user);
        if (subItems.length === 0) return null;
        return { ...item, subItems };
      }

      if (employee && item.path === "/zalo-accounts") {
        return item;
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