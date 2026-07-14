import SendMesGroupCampaignView from "@/components/zalo-campaigns/send-mes-group";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhắn tin vào nhóm | Zalo Admin",
  description: "Chiến dịch nhắn tin tự động vào nhóm Zalo",
};

export default function SendMesGroupCampaignPage() {
  return <SendMesGroupCampaignView />;
}