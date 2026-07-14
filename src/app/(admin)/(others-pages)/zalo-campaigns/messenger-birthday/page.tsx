import MessengerBirthdayView from "@/components/zalo-campaigns/messenger-birthday";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chúc mừng sinh nhật | Zalo Admin",
  description: "Tự động gửi tin chúc mừng sinh nhật cho bạn bè Zalo",
};

export default function MessengerBirthdayPage() {
  return <MessengerBirthdayView />;
}