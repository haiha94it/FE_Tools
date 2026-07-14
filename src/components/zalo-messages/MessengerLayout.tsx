"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { memo } from "react";
import MessengerAccountColumn from "./MessengerAccountColumn";
import MessengerChatColumn from "./MessengerChatColumn";
import MessengerConversationColumn from "./MessengerConversationColumn";

type Panel = "accounts" | "conversations" | "chat";

function panelClass(panel: Panel, active: Panel, isDesktop: boolean): string {
  const base = "min-h-0 flex-col overflow-hidden";
  if (isDesktop) {
    if (panel === "accounts") {
      return `hidden lg:flex ${base} w-[min(100%,240px)] shrink-0 border-r border-gray-100 dark:border-gray-800`;
    }
    if (panel === "conversations") {
      return `hidden lg:flex ${base} w-[min(100%,300px)] shrink-0 border-r border-gray-100 dark:border-gray-800`;
    }
    return `flex ${base} min-w-0 flex-1`;
  }

  return active === panel
    ? `flex ${base} w-full flex-1`
    : `hidden ${base}`;
}

function MessengerLayout() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const mobilePanel = useZaloMessengerStore((s) => s.mobilePanel);

  const activePanel: Panel = isDesktop
    ? "chat"
    : mobilePanel;

  return (
    <div className="flex h-0 min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02]">
      <aside className={panelClass("accounts", activePanel, isDesktop)}>
        <MessengerAccountColumn />
      </aside>

      <section className={panelClass("conversations", activePanel, isDesktop)}>
        <MessengerConversationColumn showMobileBack={!isDesktop} />
      </section>

      <main className={panelClass("chat", activePanel, isDesktop)}>
        <MessengerChatColumn showMobileBack={!isDesktop} />
      </main>
    </div>
  );
}

export default memo(MessengerLayout);