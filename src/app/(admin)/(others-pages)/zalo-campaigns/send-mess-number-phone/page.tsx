import SendMessPhoneCampaignView from "@/components/zalo-campaigns/send-mess-number-phone";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nhắn tin / Kết bạn SĐT | Zalo Admin",
  description: "Chiến dịch nhắn tin tự động đến số điện thoại Zalo",
};

export default function SendMessPhoneCampaignPage() {
  return <SendMessPhoneCampaignView />;
}