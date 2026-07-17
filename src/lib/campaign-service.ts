import type { CampaignApiPaths } from "@/lib/campaign-api-paths";
import api from "@/lib/axios";
import type { PaginatedResponse } from "@/types/api";

export interface CampaignFormWithId {
  id_category: number | null;
}

function normalizeCampaignList<T>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as { results?: unknown }).results)
  ) {
    return (body as { results: T[] }).results;
  }
  return [];
}

function normalizeCampaignDetail<T>(body: unknown): T | null {
  if (!body) return null;
  if (Array.isArray(body)) {
    return (body[0] as T) ?? null;
  }
  return body as T;
}

function stripCategoryId<T extends CampaignFormWithId>(
  payload: T,
): Omit<T, "id_category"> {
  const { id_category: _id, ...rest } = payload;
  return rest;
}

/**
 * Unwrap paginated payload sau axios interceptor (envelope → data).
 * Living doc: `unwrapPaginatedPayload(res.data)`.
 */
export function unwrapPaginatedPayload<T>(body: unknown): PaginatedResponse<T> {
  if (body && typeof body === "object" && "results" in body) {
    const page = body as PaginatedResponse<T>;
    return {
      results: Array.isArray(page.results) ? page.results : [],
      count: typeof page.count === "number" ? page.count : page.results?.length ?? 0,
      next: page.next ?? null,
      previous: page.previous ?? null,
    };
  }
  return {
    results: Array.isArray(body) ? (body as T[]) : [],
    count: Array.isArray(body) ? body.length : 0,
    next: null,
    previous: null,
  };
}

function normalizeStringList(body: unknown, keys: string[]): string[] {
  if (Array.isArray(body)) {
    return body.filter((item): item is string => typeof item === "string");
  }
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
  }
  return [];
}

/** Nick bị limit — GET .../account-limit/?id_category= */
export interface CampaignAccountLimitItem {
  id?: number;
  account?: number;
  name?: string;
  phone_number?: string;
  avt?: string;
  message?: string;
  status_message?: string;
  label: string;
}

function accountLimitItemLabel(raw: unknown): CampaignAccountLimitItem | null {
  if (raw == null) return null;
  if (typeof raw === "string" || typeof raw === "number") {
    const label = String(raw).trim();
    return label ? { label } : null;
  }
  if (typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const id =
    typeof record.id === "number"
      ? record.id
      : typeof record.account === "number"
        ? record.account
        : undefined;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.account_name === "string"
        ? record.account_name
        : undefined;
  const phone =
    typeof record.phone_number === "string"
      ? record.phone_number
      : typeof record.phone === "string"
        ? record.phone
        : undefined;
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.status_message === "string"
        ? record.status_message
        : undefined;
  const label =
    [name, phone, id != null ? `TK #${id}` : null, message]
      .filter(Boolean)
      .join(" · ") || "Nick bị hạn chế";
  return {
    id: typeof record.id === "number" ? record.id : undefined,
    account: typeof record.account === "number" ? record.account : id,
    name,
    phone_number: phone,
    avt: typeof record.avt === "string" ? record.avt : undefined,
    message,
    status_message:
      typeof record.status_message === "string"
        ? record.status_message
        : undefined,
    label,
  };
}

export function normalizeAccountLimitPayload(
  body: unknown,
): CampaignAccountLimitItem[] {
  if (Array.isArray(body)) {
    return body
      .map(accountLimitItemLabel)
      .filter((item): item is CampaignAccountLimitItem => item != null);
  }
  if (!body || typeof body !== "object") return [];
  const record = body as Record<string, unknown>;
  for (const key of [
    "accounts",
    "account_limits",
    "accounts_limit",
    "account_limit",
    "results",
    "data",
  ]) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value
        .map(accountLimitItemLabel)
        .filter((item): item is CampaignAccountLimitItem => item != null);
    }
  }
  return [];
}

export function createCampaignService<
  TList extends { id: number },
  TDetail extends TList,
  TForm extends CampaignFormWithId,
  TResult,
  TStats extends Record<string, unknown>,
>(paths: CampaignApiPaths) {
  return {
    async listCampaigns(): Promise<TList[]> {
      const response = await api.get(paths.LIST);
      return normalizeCampaignList<TList>(response.data);
    },

    async getCampaignById(id: number): Promise<TDetail | null> {
      const response = await api.get(paths.detail(id));
      return normalizeCampaignDetail<TDetail>(response.data);
    },

    async createOrEditCampaign(payload: TForm): Promise<void> {
      if (payload.id_category) {
        await api.patch(
          paths.detail(payload.id_category),
          stripCategoryId(payload),
        );
      } else {
        await api.post(paths.LIST, stripCategoryId(payload));
      }
    },

    async deleteCampaign(id: number): Promise<void> {
      await api.delete(paths.detail(id));
    },

    async copyCampaign(id: number, name: string): Promise<void> {
      await api.post(paths.copy(id), { name });
    },

    async startCampaigns(
      ids: number[],
      type: "new" | "continue" = "new",
    ): Promise<void> {
      const body: { id_categories: number[]; type?: "new" } = {
        id_categories: ids,
      };
      if (type === "new") {
        body.type = "new";
      }
      await api.post(paths.START, body);
    },

    async stopCampaigns(ids: number[]): Promise<void> {
      await api.post(paths.STOP, { id_categories: ids });
    },

    async fetchResults(options: {
      categoryId: number;
      page?: number;
      perPage?: number;
    }): Promise<PaginatedResponse<TResult>> {
      const response = await api.get(paths.results(options.categoryId), {
        params: {
          page: options.page ?? 1,
          number_per_page: options.perPage ?? 100,
        },
      });
      return unwrapPaginatedPayload<TResult>(response.data);
    },

    async deleteResults(categoryId: number, ids: number[]): Promise<void> {
      await api.delete(paths.results(categoryId), {
        data: { id_results: ids },
      });
    },

    async fetchStatistics(categoryId: number): Promise<TStats> {
      const response = await api.get(paths.STATISTICS, {
        params: { id_category: categoryId },
      });
      return (response.data ?? {}) as TStats;
    },

    async fetchFailedPhones(categoryId: number): Promise<string[]> {
      const response = await api.get(paths.FAILED_PHONES, {
        params: { id_category: categoryId },
      });
      return normalizeStringList(response.data, [
        "phone_numbers_failed",
        "phone_numbers",
        "results",
      ]);
    },

    async fetchFailedLinks(categoryId: number): Promise<string[]> {
      const response = await api.get(paths.FAILED_LINKS, {
        params: { id_category: categoryId },
      });
      return normalizeStringList(response.data, [
        "link_groups_failed",
        "link_group_failed",
        "results",
      ]);
    },

    async fetchAccountLimit(
      categoryId: number,
    ): Promise<CampaignAccountLimitItem[]> {
      const response = await api.get(paths.ACCOUNT_LIMIT, {
        params: { id_category: categoryId },
      });
      return normalizeAccountLimitPayload(response.data);
    },

    async fetchPhoneNumbersError(categoryId: number): Promise<string[]> {
      const response = await api.get(paths.PHONE_NUMBERS_ERROR, {
        params: { id_category: categoryId },
      });
      return normalizeStringList(response.data, [
        "phone_numbers_error",
        "phone_numbers",
        "results",
      ]);
    },
  };
}
