import { API_CAMPAIGN_ALL_GROUP } from "@/config/api";
import api from "@/lib/axios";
import { dedupeInflight } from "@/lib/inflight";
import type { CampaignCommonGroupItem } from "@/types/zalo-campaign-common-group";

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
 * Map GroupDetail từ all-group chung:
 * id, uid, name, avt, link_group, total_member, is_joined, is_blocked_chat, globalId
 */
function mapCommonGroup(raw: unknown): CampaignCommonGroupItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const profile =
    record.global_profile &&
    typeof record.global_profile === "object" &&
    !Array.isArray(record.global_profile)
      ? (record.global_profile as Record<string, unknown>)
      : null;

  const name =
    asOptionalString(record.name) ||
    asOptionalString(profile?.name);

  if (!name) return null;

  const avt =
    asOptionalString(record.avt) ||
    asOptionalString(record.avatar) ||
    asOptionalString(profile?.avt) ||
    asOptionalString(profile?.avatar);

  const globalId =
    asOptionalString(record.globalId) ||
    asOptionalString(record.global_id) ||
    asOptionalString(record.group_global_id);

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
    globalId,
  };
}

/**
 * Picker nhóm chung multi-nick — POST /api/campaign/all-group/
 * - 1 nick: mọi nhóm đã join (có global)
 * - ≥ 2 nick: chỉ nhóm mọi nick cùng globalId
 * - Không chung / chưa sync global: data []
 */
export async function fetchCampaignCommonGroups(options: {
  accountIds: number[];
  keyword?: string;
}): Promise<CampaignCommonGroupItem[]> {
  const accountIds = Array.from(new Set(options.accountIds))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
  if (!accountIds.length) return [];

  const keyword = options.keyword?.trim() ?? "";
  // Strict Mode / multi-effect: 1 HTTP cho cùng nick+keyword
  return dedupeInflight(
    `campaign:all-group:${accountIds.join(",")}:${keyword}`,
    async () => {
      const response = await api.post(API_CAMPAIGN_ALL_GROUP, {
        id_accounts: accountIds,
        keyword,
      });

      const rawList = Array.isArray(response.data) ? response.data : [];
      const items = rawList
        .map(mapCommonGroup)
        .filter((item): item is CampaignCommonGroupItem => item != null);

      return items.sort((a, b) => a.name.localeCompare(b.name, "vi"));
    },
  );
}
