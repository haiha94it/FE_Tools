import { API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN } from "@/config/api";
import api from "@/lib/axios";
import { createCampaignService } from "@/lib/campaign-service";
import type {
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics,
  PhoneInviteGroupItem,
} from "@/types/zalo-phone-invite-group-campaign";

const base = createCampaignService<
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaign,
  PhoneInviteGroupCampaignFormPayload,
  PhoneInviteGroupCampaignResult,
  PhoneInviteGroupCampaignStatistics
>(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN);

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/**
 * Map GroupDetail từ all-group:
 * id, uid, name, avt, link_group, total_member, is_joined, is_blocked_chat
 */
function mapGroupDetail(raw: unknown): PhoneInviteGroupItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const name =
    asOptionalString(record.name) ||
    // fallback nếu BE còn bọc global_profile
    (record.global_profile &&
    typeof record.global_profile === "object" &&
    !Array.isArray(record.global_profile)
      ? asOptionalString(
          (record.global_profile as Record<string, unknown>).name,
        )
      : undefined);

  if (!name) return null;

  const profile =
    record.global_profile &&
    typeof record.global_profile === "object" &&
    !Array.isArray(record.global_profile)
      ? (record.global_profile as Record<string, unknown>)
      : null;

  const avt =
    asOptionalString(record.avt) ||
    asOptionalString(record.avatar) ||
    asOptionalString(profile?.avt) ||
    asOptionalString(profile?.avatar);

  return {
    id: asOptionalNumber(record.id),
    uid: asOptionalString(record.uid),
    name,
    avt,
    avatar: avt,
    link_group: asOptionalString(record.link_group),
    total_member: asOptionalNumber(record.total_member),
    is_joined:
      typeof record.is_joined === "boolean" ? record.is_joined : undefined,
    is_blocked_chat:
      typeof record.is_blocked_chat === "boolean"
        ? record.is_blocked_chat
        : undefined,
  };
}

function stripCategoryId(
  payload: PhoneInviteGroupCampaignFormPayload,
): Omit<PhoneInviteGroupCampaignFormPayload, "id_category"> {
  const { id_category: _id, ...rest } = payload;
  return rest;
}

/**
 * Picker nhóm chung — POST invite-phone-group/category/all-group/
 * - 1 nick: toàn bộ nhóm nick đã join
 * - ≥ 2 nick: chỉ nhóm chung (mọi nick đều trong nhóm)
 * - Không chung: data []
 *
 * Không dùng spam-link-group/.../all-group/ hay GET /api/group/ union.
 */
export const zaloPhoneInviteGroupCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,

  /**
   * Update: PUT (doc) — shared campaign-service dùng PATCH; override cho resource này.
   * Create: POST .../category/
   * Body: group_invite only (không group_link).
   */
  async createOrEditCampaign(
    payload: PhoneInviteGroupCampaignFormPayload,
  ): Promise<void> {
    const body = stripCategoryId(payload);
    if (payload.id_category) {
      await api.put(
        API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.detail(payload.id_category),
        body,
      );
    } else {
      await api.post(API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.LIST, body);
    }
  },

  async fetchGroupsByAccounts(options: {
    accountIds: number[];
    keyword?: string;
  }): Promise<PhoneInviteGroupItem[]> {
    const accountIds = Array.from(new Set(options.accountIds)).filter(
      (id) => Number.isFinite(id) && id > 0,
    );
    if (!accountIds.length) return [];

    const response = await api.post(
      API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN.ALL_GROUPS,
      {
        id_accounts: accountIds,
        keyword: options.keyword?.trim() ?? "",
      },
    );

    // Envelope unwrap → data: GroupDetail[]
    const rawList = Array.isArray(response.data) ? response.data : [];
    const items = rawList
      .map(mapGroupDetail)
      .filter((item): item is PhoneInviteGroupItem => item != null);

    return items.sort((a, b) => a.name.localeCompare(b.name, "vi"));
  },
};
