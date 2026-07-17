import { API_ZALO_PHONE_INVITE_GROUP_CAMPAIGN } from "@/config/api";
import { createCampaignService } from "@/lib/campaign-service";
import {
  getZaloGroupAvatar,
  getZaloGroupDisplayName,
} from "@/lib/zalo-contacts-utils";
import { zaloGroupService } from "@/services/zalo-group.service";
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

/**
 * BE **không** có POST invite-phone-group/category/all-group/ (404).
 * Picker nhóm: GET /api/group/?id_account= — lặp theo từng nick.
 */
async function fetchGroupsForAccount(
  accountId: number,
  keyword?: string,
): Promise<PhoneInviteGroupItem[]> {
  const page = await zaloGroupService.list({
    accountId,
    page: 1,
    pageSize: 100,
    name: keyword?.trim() || undefined,
    detail: true,
  });
  let groups = page.results ?? [];

  // List đôi khi thiếu avatar — hydrate bằng fetchs
  if (groups.some((item) => !getZaloGroupAvatar(item))) {
    try {
      const details = await zaloGroupService.fetchDetails(groups);
      if (details.length) {
        const map = new Map(details.map((item) => [item.id, item]));
        groups = groups.map((item) => map.get(item.id) ?? item);
      }
    } catch {
      // giữ list gốc
    }
  }

  return groups.map((group) => ({
    id: group.id,
    name: getZaloGroupDisplayName(group),
    avt: getZaloGroupAvatar(group) ?? undefined,
    avatar: getZaloGroupAvatar(group) ?? undefined,
  }));
}

export const zaloPhoneInviteGroupCampaignService = {
  ...base,
  fetchFailedPhones: base.fetchFailedPhones,

  async fetchGroupsByAccounts(options: {
    accountIds: number[];
    keyword?: string;
  }): Promise<PhoneInviteGroupItem[]> {
    const accountIds = Array.from(new Set(options.accountIds)).filter(
      (id) => Number.isFinite(id) && id > 0,
    );
    if (!accountIds.length) return [];

    const batches = await Promise.all(
      accountIds.map((accountId) =>
        fetchGroupsForAccount(accountId, options.keyword).catch(
          () => [] as PhoneInviteGroupItem[],
        ),
      ),
    );

    // Union theo id / tên — multi nick
    const byKey = new Map<string, PhoneInviteGroupItem>();
    for (const list of batches) {
      for (const group of list) {
        const key =
          group.id != null
            ? `id:${group.id}`
            : `name:${group.name.trim().toLowerCase()}`;
        if (!byKey.has(key)) byKey.set(key, group);
      }
    }
    return Array.from(byKey.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "vi"),
    );
  },
};
