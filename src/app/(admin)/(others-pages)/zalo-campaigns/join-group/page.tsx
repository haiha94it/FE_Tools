import JoinGroupCampaignView from "@/components/zalo-campaigns/join-group";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tham gia nhóm | Chiến dịch Zalo",
  description: "Quản lý chiến dịch tham gia nhóm Zalo theo danh sách link",
};

export default function JoinGroupCampaignPage() {
  return <JoinGroupCampaignView />;
}