import SendMesFrCampaignView from "@/components/zalo-campaigns/send-mes-fr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhắn tin bạn bè | Zalo Admin",
  description: "Chiến dịch nhắn tin tự động cho bạn bè Zalo",
};

export default function SendMesFrCampaignPage() {
  return <SendMesFrCampaignView />;
}