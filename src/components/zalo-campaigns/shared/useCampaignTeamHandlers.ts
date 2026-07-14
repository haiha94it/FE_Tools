"use client";

import { getCampaignTeamAccess } from "@/lib/team-collaboration-utils";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TeamCategoryFields } from "@/types/team-collaboration";
import { useCallback } from "react";

export function useCampaignTeamHandlers<T extends TeamCategoryFields>() {
  const user = useAuthStore((s) => s.user);

  const guardAccess = useCallback(
    (campaign: T, action: "edit" | "results") => {
      const access = getCampaignTeamAccess(campaign, user);
      if (action === "edit" && !access.canEdit && !access.isReadOnlyDetail) {
        toast.error("Bạn không có quyền xem kịch bản này.");
        return false;
      }
      if (action === "results" && !access.canViewResults) {
        toast.error("Bạn không có quyền xem kết quả kịch bản này.");
        return false;
      }
      return true;
    },
    [user],
  );

  const getFormReadOnly = useCallback(
    (campaign: T | null) => {
      if (!campaign) return false;
      return getCampaignTeamAccess(campaign, user).isReadOnlyDetail;
    },
    [user],
  );

  return { guardAccess, getFormReadOnly };
}