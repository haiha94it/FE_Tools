import { formatTeamCreator } from "@/lib/team-collaboration-utils";
import type { TeamCategoryFields } from "@/types/team-collaboration";

export default function CampaignTeamCreatedByCell({
  campaign,
}: {
  campaign: TeamCategoryFields;
}) {
  if (campaign.is_mine === false && campaign.created_by) {
    return (
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
        Tạo bởi {formatTeamCreator(campaign.created_by)}
      </p>
    );
  }
  return null;
}