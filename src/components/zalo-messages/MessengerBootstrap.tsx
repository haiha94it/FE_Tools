"use client";

import { useMessengerWs } from "@/hooks/use-messenger-ws";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useEffect, useRef } from "react";

interface MessengerBootstrapProps {
  routeAccountId?: number | null;
  routeConversationId?: number | null;
}

/**
 * Generation: mỗi lần URL đổi tăng 1. Route sync cũ (25) sau await
 * thấy gen lệch → dừng, không gọi API / switchAccount đè lên nick mới (21).
 */
let routeSyncGeneration = 0;
let accountsBootstrapped = false;

/** Route sync + WS — không render UI, không subscribe state chat */
export default function MessengerBootstrap({
  routeAccountId,
  routeConversationId,
}: MessengerBootstrapProps) {
  useMessengerWs();

  const fetchAccounts = useZaloMessengerStore((s) => s.fetchAccounts);
  const switchAccount = useZaloMessengerStore((s) => s.switchAccount);
  const selectConversation = useZaloMessengerStore((s) => s.selectConversation);
  const resetChatState = useZaloMessengerStore((s) => s.resetChatState);
  const setMobilePanel = useZaloMessengerStore((s) => s.setMobilePanel);

  const routeSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (accountsBootstrapped) return;
    accountsBootstrapped = true;
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const routeKey = `${routeAccountId ?? ""}|${routeConversationId ?? ""}`;

    // Strict Mode re-run cùng key trên cùng instance
    if (routeSyncKeyRef.current === routeKey) {
      return;
    }
    routeSyncKeyRef.current = routeKey;

    const gen = ++routeSyncGeneration;

    void (async () => {
      if (gen !== routeSyncGeneration) return;

      if (routeAccountId) {
        const current = useZaloMessengerStore.getState().selectedAccountId;
        if (current !== routeAccountId) {
          await switchAccount(routeAccountId);
        }
        if (gen !== routeSyncGeneration) return;

        if (routeConversationId) {
          await selectConversation(routeAccountId, routeConversationId);
        } else {
          resetChatState();
        }
        return;
      }

      if (gen !== routeSyncGeneration) return;
      useZaloMessengerStore.getState().setSelectedAccountId(null);
      resetChatState();
    })();
  }, [
    routeAccountId,
    routeConversationId,
    switchAccount,
    selectConversation,
    resetChatState,
  ]);

  useEffect(() => {
    const isWideLayout =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 768px)").matches;
    if (isWideLayout) return;
    if (routeConversationId) setMobilePanel("chat");
    else if (routeAccountId) setMobilePanel("conversations");
    else setMobilePanel("accounts");
  }, [routeConversationId, routeAccountId, setMobilePanel]);

  return null;
}
