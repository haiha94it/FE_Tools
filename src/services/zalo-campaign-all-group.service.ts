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
 * Map item all-group: id, name, avt, globalId.
 * Không drop item khi name rỗng — vẫn giữ id/globalId để chọn/match.
 */
function mapCommonGroup(raw: unknown): CampaignCommonGroupItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;

  const id = asOptionalNumber(record.id);
  const globalId =
    asOptionalString(record.globalId) ||
    asOptionalString(record.global_id) ||
    asOptionalString(record.group_global_id);

  const profile =
    record.global_profile &&
    typeof record.global_profile === "object" &&
    !Array.isArray(record.global_profile)
      ? (record.global_profile as Record<string, unknown>)
      : null;

  const nameRaw =
    asOptionalString(record.name) ||
    asOptionalString(profile?.name) ||
    (id != null ? `Nhóm #${id}` : globalId ? `Nhóm ${globalId}` : null);

  if (!nameRaw && id == null && !globalId) return null;

  const avt =
    asOptionalString(record.avt) ||
    asOptionalString(record.avatar) ||
    asOptionalString(profile?.avt) ||
    asOptionalString(profile?.avatar);

  return {
    id,
    uid: asOptionalString(record.uid),
    name: nameRaw || `Nhóm #${id ?? "?"}`,
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

export type CampaignCommonGroupsPage = {
  results: CampaignCommonGroupItem[];
  count: number;
  page: number;
  number_per_page: number;
  total_pages: number;
};

function mapList(
  rawList: unknown[],
  options?: { keepOrder?: boolean },
): CampaignCommonGroupItem[] {
  const items = rawList
    .map(mapCommonGroup)
    .filter((item): item is CampaignCommonGroupItem => item != null);
  // Paginated: giữ order BE (-id). Full list resolve: sort tên cho UX.
  if (options?.keepOrder) return items;
  return items.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function normalizeAccountIds(accountIds: number[]): number[] {
  return Array.from(new Set(accountIds))
    .filter((id) => Number.isFinite(id) && id > 0)
    .sort((a, b) => a - b);
}

/**
 * Full list (paginate=false) — resolve id_group / match globalId khi edit.
 */
export async function fetchCampaignCommonGroups(options: {
  accountIds: number[];
  keyword?: string;
}): Promise<CampaignCommonGroupItem[]> {
  const accountIds = normalizeAccountIds(options.accountIds);
  if (!accountIds.length) return [];

  const keyword = options.keyword?.trim() ?? "";
  return dedupeInflight(
    `campaign:all-group:full:${accountIds.join(",")}:${keyword}`,
    async () => {
      const response = await api.post(API_CAMPAIGN_ALL_GROUP, {
        id_accounts: accountIds,
        keyword: keyword || undefined,
        paginate: false,
      });

      const body = response.data;
      if (Array.isArray(body)) return mapList(body);
      if (
        body &&
        typeof body === "object" &&
        Array.isArray((body as { results?: unknown }).results)
      ) {
        return mapList((body as { results: unknown[] }).results);
      }
      return [];
    },
  );
}

/**
 * Phân trang picker — POST all-group + page/number_per_page/paginate=true.
 * Dùng: send-mess-member-gr, phone-number-invite-group.
 */
export async function fetchCampaignCommonGroupsPage(options: {
  accountIds: number[];
  keyword?: string;
  page?: number;
  pageSize?: number;
}): Promise<CampaignCommonGroupsPage> {
  const accountIds = normalizeAccountIds(options.accountIds);
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.max(1, Math.min(options.pageSize ?? 50, 200));
  if (!accountIds.length) {
    return {
      results: [],
      count: 0,
      page: 1,
      number_per_page: pageSize,
      total_pages: 0,
    };
  }

  const keyword = options.keyword?.trim() ?? "";

  return dedupeInflight(
    `campaign:all-group:page:${accountIds.join(",")}:${keyword}:${page}:${pageSize}`,
    async () => {
      const response = await api.post(API_CAMPAIGN_ALL_GROUP, {
        id_accounts: accountIds,
        keyword: keyword || undefined,
        page,
        number_per_page: pageSize,
        paginate: true,
      });

      const body = response.data;

      // Chuẩn: { results, count, page, number_per_page, total_pages }
      if (body && typeof body === "object" && !Array.isArray(body)) {
        const record = body as Record<string, unknown>;
        if (Array.isArray(record.results)) {
          const results = mapList(record.results, { keepOrder: true });
          const count =
            typeof record.count === "number" ? record.count : results.length;
          const curPage =
            typeof record.page === "number" && record.page > 0
              ? record.page
              : page;
          const perPage =
            typeof record.number_per_page === "number" &&
            record.number_per_page > 0
              ? record.number_per_page
              : pageSize;
          const totalPages =
            typeof record.total_pages === "number"
              ? record.total_pages
              : count > 0
                ? Math.ceil(count / perPage)
                : 0;
          return {
            results,
            count,
            page: curPage,
            number_per_page: perPage,
            total_pages: totalPages,
          };
        }
      }

      // Legacy array → coi như 1 trang
      const rawList = Array.isArray(body) ? body : [];
      const results = mapList(rawList, { keepOrder: true });
      return {
        results,
        count: results.length,
        page: 1,
        number_per_page: results.length || pageSize,
        total_pages: results.length ? 1 : 0,
      };
    },
  );
}
