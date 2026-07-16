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

function normalizePaginatedResults<T>(body: unknown): PaginatedResponse<T> {
  if (body && typeof body === "object" && "results" in body) {
    return body as PaginatedResponse<T>;
  }
  return {
    results: Array.isArray(body) ? (body as T[]) : [],
    count: 0,
    next: null,
    previous: null,
  };
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
      return normalizePaginatedResults<TResult>(response.data);
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
      const response = await api.get<{ phone_numbers_failed?: string[] }>(
        paths.FAILED_PHONES,
        { params: { id_category: categoryId } },
      );
      return response.data?.phone_numbers_failed ?? [];
    },

    async fetchFailedLinks(categoryId: number): Promise<string[]> {
      const response = await api.get<{ link_groups_failed?: string[] }>(
        paths.FAILED_LINKS,
        { params: { id_category: categoryId } },
      );
      return response.data?.link_groups_failed ?? [];
    },
  };
}