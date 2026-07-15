import CampaignNotificationView from "@/components/zalo-campaigns/campaign-notification";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Thông báo chiến dịch | Zalo Admin",
  description:
    "Thiết lập nhận thông báo Zalo khi có sự kiện chiến dịch — đồng bộ ZaloCN phone-noti",
};

export default function CampaignNotificationPage() {
  return <CampaignNotificationView />;
}