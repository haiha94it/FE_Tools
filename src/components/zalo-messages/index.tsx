"use client";

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
    <div className={adminDataPageClass}>
      <MessengerBootstrap
        routeAccountId={routeAccountId}
        routeConversationId={routeConversationId}
      />

      <PageBreadcrumb
        pageTitle="Tin nhắn Zalo"
        showPageTitle={false}
        className="!mb-0 max-md:hidden shrink-0"
        parents={[{ label: "Quản lý tài khoản Zalo", href: "/zalo-accounts" }]}
      />

      <MessengerLayout />
    </div>
  );
}