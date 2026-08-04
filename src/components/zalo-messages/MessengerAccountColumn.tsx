"use client";

import { useZaloMessengerStore } from "@/stores/use-zalo-messenger-store";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import AccountPanel from "./AccountPanel";

function MessengerAccountColumn() {
  const router = useRouter();
  const accounts = useZaloMessengerStore((s) => s.accounts);
  const accountsLoading = useZaloMessengerStore((s) => s.accountsLoading);
  const selectedAccountId = useZaloMessengerStore((s) => s.selectedAccountId);
  const pinAccount = useZaloMessengerStore((s) => s.pinAccount);

  const handleSelect = useCallback(
    (accountId: number) => {
      router.push(`/zalo-messages/${accountId}`);
    },
    [router],
  );

  const handlePin = useCallback(
    (accountId: number, pinning: boolean) => {
      void pinAccount(accountId, pinning);
    },
    [pinAccount],
  );

  return (
    <>
      <div className="shrink-0 border-b border-gray-100 px-3 py-3 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Chọn tài khoản Zalo
        </h3>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Chọn nick để xem hội thoại và nhắn tin
        </p>
      </div>
      <AccountPanel
        accounts={accounts}
        selectedId={selectedAccountId}
        loading={accountsLoading}
        onSelect={handleSelect}
        onPin={(account) => handlePin(account.id, !account.pinning)}
      />
    </>
  );
}

export default memo(MessengerAccountColumn);