"use client";

import { useMessengerWs } from "@/hooks/use-messenger-ws";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useRouter } from "next/navigation";
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

/** Route sync + WS — không render UI, không subscribe state chat */
export default function MessengerBootstrap({
  routeAccountId,
  routeConversationId,
}: MessengerBootstrapProps) {
  useMessengerWs();
  const router = useRouter();

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const fetchAccounts = useZaloMessengerStore((s) => s.fetchAccounts);
  const switchAccount = useZaloMessengerStore((s) => s.switchAccount);
  const selectConversation = useZaloMessengerStore((s) => s.selectConversation);
  const resetChatState = useZaloMessengerStore((s) => s.resetChatState);
  const setMobilePanel = useZaloMessengerStore((s) => s.setMobilePanel);

  const routeSyncKeyRef = useRef<string | null>(null);
  /** User đã bootstrap accounts — đổi user thì fetch lại (không dùng flag module một lần). */
  const accountsBootstrappedForUserRef = useRef<string | number | null>(null);

  useEffect(() => {
    if (userId == null) return;
    if (accountsBootstrappedForUserRef.current === userId) return;
    accountsBootstrappedForUserRef.current = userId;
    // URL/route sync phụ thuộc list nick mới — force re-sync sau fetch
    routeSyncKeyRef.current = null;
    void fetchAccounts();
  }, [userId, fetchAccounts]);

  useEffect(() => {
    if (userId == null) return;

    const routeKey = `${userId}|${routeAccountId ?? ""}|${routeConversationId ?? ""}`;

    // Strict Mode re-run cùng key trên cùng instance
    if (routeSyncKeyRef.current === routeKey) {
      return;
    }
    routeSyncKeyRef.current = routeKey;

    const gen = ++routeSyncGeneration;

    void (async () => {
      if (gen !== routeSyncGeneration) return;

      // Đảm bảo list nick đúng user hiện tại trước khi switch theo URL
      if (accountsBootstrappedForUserRef.current !== userId) {
        accountsBootstrappedForUserRef.current = userId;
        await fetchAccounts();
      } else if (
        useZaloMessengerStore.getState().accountsLoading ||
        useZaloMessengerStore.getState().accounts.length === 0
      ) {
        // Vừa logout/login hoặc fetch đang chạy — đợi list
        await fetchAccounts();
      }
      if (gen !== routeSyncGeneration) return;

      const accounts = useZaloMessengerStore.getState().accounts;

      if (routeAccountId) {
        const allowed = accounts.some((account) => account.id === routeAccountId);
        if (!allowed) {
          // URL còn id nick user cũ (vd /zalo-messages/26) → về list nick user mới
          useZaloMessengerStore.getState().setSelectedAccountId(null);
          resetChatState();
          router.replace("/zalo-messages");
          return;
        }

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
    userId,
    routeAccountId,
    routeConversationId,
    fetchAccounts,
    switchAccount,
    selectConversation,
    resetChatState,
    router,
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
