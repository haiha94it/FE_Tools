"use client";

import MessageConsentGate, {
  MessageConsentBanner,
  MessageConsentToolbar,
} from "@/components/consent/MessageConsentGate";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPageClass } from "@/components/ui/table/ScrollableTableContainer";
import MessengerBootstrap from "./MessengerBootstrap";
import MessengerLayout from "./MessengerLayout";

interface ZaloMessagesViewProps {
  accountId?: number | null;
  conversationId?: number | null;
}

export default function ZaloMessagesView({
  accountId: routeAccountId,
  conversationId: routeConversationId,
}: ZaloMessagesViewProps) {
  return (
    <div className={`${adminDataPageClass} relative`}>
      <MessengerBootstrap
        routeAccountId={routeAccountId}
        routeConversationId={routeConversationId}
      />

      {/* Breadcrumb + nút đồng thuận cùng hàng — không đè lên ô chat */}
      <div className="mb-2 flex shrink-0 flex-col gap-2 max-md:mb-1">
        <div className="flex flex-wrap items-center justify-between gap-2 gap-y-2">
          <PageBreadcrumb
            pageTitle="Tin nhắn Zalo"
            showPageTitle={false}
            className="!mb-0 min-w-0 flex-1"
            parents={[
              { label: "Quản lý tài khoản Zalo", href: "/zalo-accounts" },
            ]}
          />
          <MessageConsentToolbar />
        </div>
        <MessageConsentBanner />
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <MessengerLayout />
        <MessageConsentGate />
      </div>
    </div>
  );
}
