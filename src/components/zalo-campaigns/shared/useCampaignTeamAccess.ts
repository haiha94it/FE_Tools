"use client";

import { getCampaignTeamAccess } from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TeamCategoryFields } from "@/types/team-collaboration";

export function useCampaignTeamAccess<T extends TeamCategoryFields>(campaign: T) {
  const user = useAuthStore((s) => s.user);
  return getCampaignTeamAccess(campaign, user);
}