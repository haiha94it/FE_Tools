import {
  filterSelectableCampaignIds,
  filterStartStopCampaignIds,
  toggleAllSelectableIds,
} from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TeamCategoryFields } from "@/types/team-collaboration";

export function resolveCampaignToggleSelectAll<T extends TeamCategoryFields & { id: number }>(
  campaigns: T[],
  selectedIds: number[],
): number[] {
  const user = useAuthStore.getState().user;
  const selectableIds = filterSelectableCampaignIds(campaigns, user);
  return toggleAllSelectableIds(selectableIds, selectedIds);
}

export function resolveCampaignStartStopIds<T extends TeamCategoryFields & { id: number }>(
  campaigns: T[],
  selectedIds: number[],
): number[] {
  const user = useAuthStore.getState().user;
  return filterStartStopCampaignIds(campaigns, selectedIds, user);
}