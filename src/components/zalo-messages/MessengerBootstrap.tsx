"use client";

import { useMessengerWs } from "@/hooks/use-messenger-ws";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useEffect, useRef } from "react";

interface MessengerBootstrapProps {
  routeAccountId?: number | null;
  routeConversationId?: number | null;
}

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

  const accountsBootstrappedRef = useRef(false);
  const routeSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (accountsBootstrappedRef.current) return;
    accountsBootstrappedRef.current = true;
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    const routeKey = `${routeAccountId ?? ""}|${routeConversationId ?? ""}`;
    if (routeSyncKeyRef.current === routeKey) return;
    routeSyncKeyRef.current = routeKey;

    void (async () => {
      if (routeAccountId) {
        const current = useZaloMessengerStore.getState().selectedAccountId;
        if (current !== routeAccountId) {
          await switchAccount(routeAccountId);
        }
        if (routeConversationId) {
          await selectConversation(routeAccountId, routeConversationId);
        } else {
          resetChatState();
        }
        return;
      }

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
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) return;
    if (routeConversationId) setMobilePanel("chat");
    else if (routeAccountId) setMobilePanel("conversations");
    else setMobilePanel("accounts");
  }, [routeConversationId, routeAccountId, setMobilePanel]);

  return null;
}