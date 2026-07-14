import ZaloMessagesPageClient from "@/components/zalo-messages/ZaloMessagesPageClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tin nhắn Zalo | Zalo Admin",
  description: "Quản lý hội thoại Zalo realtime — đa tài khoản, WebSocket",
};

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function ZaloMessagesPage({ params }: PageProps) {
  const { slug } = await params;
  const accountId = slug?.[0] ? Number(slug[0]) : null;
  const conversationId = slug?.[1] ? Number(slug[1]) : null;

  return (
    <ZaloMessagesPageClient
      accountId={Number.isFinite(accountId) ? accountId : null}
      conversationId={
        Number.isFinite(conversationId) ? conversationId : null
      }
    />
  );
}