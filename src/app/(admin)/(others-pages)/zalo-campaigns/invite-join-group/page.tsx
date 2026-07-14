import InviteJoinGroupCampaignView from "@/components/zalo-campaigns/invite-join-group";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mời bạn vào nhóm | Chiến dịch Zalo",
  description: "Quản lý chiến dịch mời bạn bè tham gia nhóm Zalo",
};

export default function InviteJoinGroupCampaignPage() {
  return <InviteJoinGroupCampaignView />;
}