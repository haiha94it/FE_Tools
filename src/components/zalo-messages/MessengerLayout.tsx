"use client";

import { useMessengerLayoutMode } from "@/hooks/use-messenger-layout-mode";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { memo } from "react";
import MessengerAccountColumn from "./MessengerAccountColumn";
import MessengerChatColumn from "./MessengerChatColumn";
import MessengerConversationColumn from "./MessengerConversationColumn";

type Panel = "accounts" | "conversations" | "chat";

const panelBase = "min-h-0 flex-col overflow-hidden";

function MessengerLayout() {
  const layoutMode = useMessengerLayoutMode();
  const mobilePanel = useZaloMessengerStore((s) => s.mobilePanel);
  const selectedAccountId = useZaloMessengerStore((s) => s.selectedAccountId);

  const isDesktop = layoutMode === "desktop";
  const isTablet = layoutMode === "tablet";
  const isPhone = layoutMode === "phone";

  const activePanel: Panel = isDesktop ? "chat" : mobilePanel;
  const showSplit = (isTablet || isDesktop) && selectedAccountId != null;

  const showAccounts =
    isDesktop ||
    (isPhone && activePanel === "accounts") ||
    (isTablet && !selectedAccountId);

  const showConversations =
    isDesktop ||
    showSplit ||
    (isPhone && activePanel === "conversations");

  const showChat =
    isDesktop || showSplit || (isPhone && activePanel === "chat");

  const accountsClass = showAccounts
    ? isDesktop
      ? `flex ${panelBase} w-[min(100%,220px)] shrink-0 border-r border-gray-100 dark:border-gray-800`
      : `flex ${panelBase} w-full flex-1`
    : `hidden ${panelBase}`;

  const conversationsClass = showConversations
    ? isDesktop
      ? `flex ${panelBase} w-[min(100%,280px)] shrink-0 border-r border-gray-100 dark:border-gray-800`
      : isTablet
        ? `flex ${panelBase} w-[min(38%,260px)] min-w-[200px] shrink-0 border-r border-gray-100 dark:border-gray-800`
        : `flex ${panelBase} w-full flex-1`
    : `hidden ${panelBase}`;

  const chatClass = showChat
    ? `flex ${panelBase} min-w-0 flex-1`
    : `hidden ${panelBase}`;

  return (
    <div className="flex h-0 min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <aside className={accountsClass}>
        <MessengerAccountColumn />
      </aside>

      <section className={conversationsClass}>
        <MessengerConversationColumn showMobileBack={!isDesktop} />
      </section>

      <main className={chatClass}>
        <MessengerChatColumn showMobileBack={isPhone} />
      </main>
    </div>
  );
}

export default memo(MessengerLayout);