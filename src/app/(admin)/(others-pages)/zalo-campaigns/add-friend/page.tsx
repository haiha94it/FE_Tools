import AddFriendCampaignView from "@/components/zalo-campaigns/add-friend";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kết bạn | Chiến dịch Zalo",
  description: "Quản lý chiến dịch kết bạn Zalo theo danh sách số điện thoại",
};

export default function AddFriendCampaignPage() {
  return <AddFriendCampaignView />;
}