import SendMessMemberGrCampaignView from "@/components/zalo-campaigns/send-mess-member-gr";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tương tác nhóm đã tham gia | Zalo Admin",
  description: "Chiến dịch nhắn tin và kết bạn với thành viên nhóm Zalo đã tham gia",
};

export default function SendMessMemberGrCampaignPage() {
  return <SendMessMemberGrCampaignView />;
}