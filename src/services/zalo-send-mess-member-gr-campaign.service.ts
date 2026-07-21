import {
  API_UPLOAD,
  API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN,
} from "@/config/api";
import {
  createCampaignService,
  unwrapPaginatedPayload,
} from "@/lib/campaign-service";
import { parseUploadedFileLink } from "@/lib/zalo-messenger-send-utils";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";
import type {
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics,
  SendMessMemberGrGroupMember,
  SendMessMemberGrResultsFilter,
  SendMessMemberGrSavePayload,
} from "@/types/zalo-send-mess-member-gr-campaign";

const base = createCampaignService<
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
  SendMessMemberGrCampaignFormPayload,
  SendMessMemberGrCampaignResult,
  SendMessMemberGrCampaignStatistics
>(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN);

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "number" && Number.isFinite(item)) return item;
      if (typeof item === "string" && item.trim()) {
        const n = Number(item);
        return Number.isFinite(n) ? n : null;
      }
      return null;
    })
    .filter((n): n is number => n != null);
}

function mapGroupMember(raw: unknown): SendMessMemberGrGroupMember | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const memberGlobalId =
    asOptionalString(record.member_global_id) ||
    asOptionalString(record.memberGlobalId) ||
    asOptionalString(record.globalId) ||
    asOptionalString(record.global_id);
  if (!memberGlobalId) return null;
  return {
    member_global_id: memberGlobalId,
    name: asOptionalString(record.name) || memberGlobalId,
    avatar:
      asOptionalString(record.avatar) || asOptionalString(record.avt),
    is_admin:
      typeof record.is_admin === "boolean" ? record.is_admin : undefined,
    is_creator:
      typeof record.is_creator === "boolean" ? record.is_creator : undefined,
    accounts_ready: asNumberArray(record.accounts_ready),
    accounts_missing_friend: asNumberArray(record.accounts_missing_friend),
  };
}

function buildResultsParams(options: {
  page?: number;
  perPage?: number;
  filters?: SendMessMemberGrResultsFilter;
}): Record<string, string | number> {
  const params: Record<string, string | number> = {
    page: options.page ?? 1,
    number_per_page: options.perPage ?? 100,
  };
  const filters = options.filters;
  if (filters?.id_account != null && filters.id_account > 0) {
    params.id_account = filters.id_account;
  }
  if (filters?.start_time?.trim()) {
    params.start_time = filters.start_time.trim();
  }
  if (filters?.end_time?.trim()) {
    params.end_time = filters.end_time.trim();
  }
  return params;
}

export const zaloSendMessMemberGrCampaignService = {
  ...base,

  /**
   * Hỗ trợ cả body full và body content-only khi kịch bản đang chạy.
   */
  async createOrEditCampaign(payload: SendMessMemberGrSavePayload): Promise<void> {
    const { id_category, ...rest } = payload;
    if (id_category) {
      await api.patch(
        API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.detail(id_category),
        rest,
      );
    } else {
      await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.LIST, rest);
    }
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<unknown>(API_UPLOAD.FILE, formData, {
      timeout: 120_000,
    });
    const link = parseUploadedFileLink(response.data);
    if (!link) {
      throw new Error("Không nhận được link ảnh sau khi upload.");
    }
    return link;
  },

  /**
   * List TV theo global group — POST .../mess-member-group/category/members/
   */
  async fetchGroupMembers(options: {
    accountIds: number[];
    groupGlobalId: string;
  }): Promise<SendMessMemberGrGroupMember[]> {
    const accountIds = Array.from(new Set(options.accountIds)).filter(
      (id) => Number.isFinite(id) && id > 0,
    );
    const groupGlobalId = options.groupGlobalId.trim();
    if (!accountIds.length || !groupGlobalId) return [];

    const response = await api.post(API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.MEMBERS, {
      id_accounts: accountIds,
      group_global_id: groupGlobalId,
    });

    const rawList = Array.isArray(response.data) ? response.data : [];
    return rawList
      .map(mapGroupMember)
      .filter((item): item is SendMessMemberGrGroupMember => item != null);
  },

  async fetchResults(options: {
    categoryId: number;
    page?: number;
    perPage?: number;
    filters?: SendMessMemberGrResultsFilter;
  }): Promise<PaginatedResponse<SendMessMemberGrCampaignResult>> {
    const response = await api.get(
      API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.results(options.categoryId),
      { params: buildResultsParams(options) },
    );
    return unwrapPaginatedPayload<SendMessMemberGrCampaignResult>(
      response.data,
    );
  },

  /**
   * Fetch all result pages for client-side Excel/CSV export.
   */
  async fetchAllResults(options: {
    categoryId: number;
    filters?: SendMessMemberGrResultsFilter;
    perPage?: number;
    maxPages?: number;
  }): Promise<SendMessMemberGrCampaignResult[]> {
    const perPage = options.perPage ?? 200;
    const maxPages = options.maxPages ?? 50;
    const rows: SendMessMemberGrCampaignResult[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      const chunk = await this.fetchResults({
        categoryId: options.categoryId,
        page,
        perPage,
        filters: options.filters,
      });
      const items = chunk.results ?? [];
      rows.push(...items);
      hasMore = Boolean(chunk.next) || items.length >= perPage;
      if (!items.length) hasMore = false;
      page += 1;
    }

    return rows;
  },

  async fetchStatistics(
    categoryId: number,
    options?: { start_time?: string | null; end_time?: string | null },
  ): Promise<SendMessMemberGrCampaignStatistics> {
    const params: Record<string, string | number> = {
      id_category: categoryId,
    };
    if (options?.start_time?.trim()) {
      params.start_time = options.start_time.trim();
    }
    if (options?.end_time?.trim()) {
      params.end_time = options.end_time.trim();
    }
    const response = await api.get(
      API_ZALO_SEND_MESS_MEMBER_GR_CAMPAIGN.STATISTICS,
      { params },
    );
    return (response.data ?? {}) as SendMessMemberGrCampaignStatistics;
  },
};
