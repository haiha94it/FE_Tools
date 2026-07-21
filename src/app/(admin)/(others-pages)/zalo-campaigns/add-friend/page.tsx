import { redirect } from "next/navigation";

/** Campaign kết bạn SĐT đã gộp vào mess-phone-number */
export default function AddFriendCampaignRedirectPage() {
  redirect("/zalo-campaigns/send-mess-number-phone");
}
