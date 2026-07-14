"use client";

import dynamic from "next/dynamic";

const ZaloMessagesView = dynamic(() => import("./index"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
    </div>
  ),
});

interface ZaloMessagesPageClientProps {
  accountId?: number | null;
  conversationId?: number | null;
}

export default function ZaloMessagesPageClient({
  accountId,
  conversationId,
}: ZaloMessagesPageClientProps) {
  return (
    <ZaloMessagesView
      accountId={accountId}
      conversationId={conversationId}
    />
  );
}