"use client";

import Checkbox from "@/components/form/input/Checkbox";
import { useCampaignTeamAccess } from "@/components/zalo-campaigns/shared/useCampaignTeamAccess";
import type { TeamCategoryFields } from "@/types/team-collaboration";

interface CampaignTeamSelectableCheckboxProps<T extends TeamCategoryFields> {
  campaign: T;
  checked: boolean;
  onChange: () => void;
}

export default function CampaignTeamSelectableCheckbox<
  T extends TeamCategoryFields,
>({ campaign, checked, onChange }: CampaignTeamSelectableCheckboxProps<T>) {
  const access = useCampaignTeamAccess(campaign);
  return (
    <Checkbox
      checked={checked}
      disabled={!access.canSelect}
      onChange={onChange}
    />
  );
}