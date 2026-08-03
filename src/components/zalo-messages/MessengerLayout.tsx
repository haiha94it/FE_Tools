"use client";

import { useMessengerLayoutMode } from "@/hooks/use-messenger-layout-mode";
import { useResizablePanelWidth } from "@/hooks/use-resizable-panel-width";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { memo } from "react";
import MessengerAccountColumn from "./MessengerAccountColumn";
import MessengerChatColumn from "./MessengerChatColumn";
import MessengerConversationColumn from "./MessengerConversationColumn";

type Panel = "accounts" | "conversations" | "chat";

const panelBase = "min-h-0 flex-col overflow-hidden";

/** localStorage — độ rộng cột hội thoại (desktop/tablet) */
const CONV_WIDTH_KEY = "messenger.conversationPanelWidth";

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

  // Kéo rộng/hẹp list hội thoại — thấy hết nhãn thẻ filter
  const canResizeConversations =
    showConversations && (isDesktop || (isTablet && showSplit));
  const {
    width: conversationWidth,
    dragging,
    startResize,
    nudgeWidth,
    minWidth: convMin,
    maxWidth: convMax,
  } = useResizablePanelWidth({
    storageKey: CONV_WIDTH_KEY,
    defaultWidth: isTablet ? 240 : 280,
    minWidth: 200,
    maxWidth: 560,
  });

  const accountsClass = showAccounts
    ? isDesktop
      ? `flex ${panelBase} w-[min(100%,220px)] shrink-0 border-r border-gray-100 dark:border-gray-800`
      : `flex ${panelBase} w-full flex-1`
    : `hidden ${panelBase}`;

  const conversationsClass = showConversations
    ? canResizeConversations
      ? `flex ${panelBase} shrink-0`
      : isPhone
        ? `flex ${panelBase} w-full flex-1`
        : `flex ${panelBase} w-[min(38%,260px)] min-w-[200px] shrink-0 border-r border-gray-100 dark:border-gray-800`
    : `hidden ${panelBase}`;

  const chatClass = showChat
    ? `flex ${panelBase} min-w-0 flex-1`
    : `hidden ${panelBase}`;

  return (
    <div
      className={`flex h-0 min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.02] ${
        dragging ? "select-none" : ""
      }`}
    >
      <aside className={accountsClass}>
        <MessengerAccountColumn />
      </aside>

      <section
        className={conversationsClass}
        style={
          canResizeConversations
            ? { width: conversationWidth, minWidth: conversationWidth }
            : undefined
        }
      >
        <MessengerConversationColumn showMobileBack={!isDesktop} />
      </section>

      {canResizeConversations ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Kéo để đổi độ rộng danh sách hội thoại"
          aria-valuenow={Math.round(conversationWidth)}
          aria-valuemin={convMin}
          aria-valuemax={convMax}
          tabIndex={0}
          onPointerDown={startResize}
          onKeyDown={(e) => {
            if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
            e.preventDefault();
            nudgeWidth(e.key === "ArrowRight" ? 16 : -16);
          }}
          className={`group relative z-10 w-1 shrink-0 cursor-col-resize touch-none border-r border-gray-100 bg-transparent transition-colors hover:bg-brand-500/20 dark:border-gray-800 ${
            dragging ? "bg-brand-500/30" : ""
          }`}
        >
          {/* Hit area rộng hơn vạch 1px */}
          <span
            className="absolute inset-y-0 -left-1.5 -right-1.5"
            aria-hidden
          />
          <span
            className={`absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-300 opacity-0 transition group-hover:opacity-100 dark:bg-gray-600 ${
              dragging ? "bg-brand-500 opacity-100 dark:bg-brand-400" : ""
            }`}
            aria-hidden
          />
        </div>
      ) : null}

      <main className={chatClass}>
        <MessengerChatColumn showMobileBack={isPhone} />
      </main>
    </div>
  );
}

export default memo(MessengerLayout);
