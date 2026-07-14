import PhoneInviteGroupCampaignView from "@/components/zalo-campaigns/phone-number-invite-group";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mời SĐT tham gia nhóm | Zalo Admin",
  description: "Chiến dịch mời số điện thoại tham gia nhóm Zalo",
};

export default function PhoneInviteGroupCampaignPage() {
  return <PhoneInviteGroupCampaignView />;
}