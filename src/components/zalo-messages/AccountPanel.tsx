"use client";

import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getAccountLabel } from "@/lib/zalo-messenger-utils";
import type { MessengerAccount } from "@/types/zalo-messenger";
import { memo } from "react";

interface AccountPanelProps {
  accounts: MessengerAccount[];
  selectedId: number | null;
  loading?: boolean;
  onSelect: (id: number) => void;
  onPin?: (account: MessengerAccount) => void;
}

function AccountPanel({
  accounts,
  selectedId,
  loading = false,
  onSelect,
  onPin,
}: AccountPanelProps) {
  if (loading && accounts.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!accounts.length) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-white/80">
          Chưa có tài khoản chat
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Kết nối tài khoản Zalo và bật lắng nghe tin nhắn.
        </p>
      </div>
    );
  }

  return (
    <ul className="custom-scrollbar flex-1 overflow-y-auto overscroll-contain">
      {accounts.map((account) => {
        const active = selectedId === account.id;
        const label = getAccountLabel(account);
        const pinLabel = account.pinning ? "Bỏ ghim" : "Ghim tài khoản";

        return (
          <li
            key={account.id}
            className={`group flex w-full items-center border-b border-gray-100 dark:border-gray-800 ${
              active
                ? "bg-brand-50/80 dark:bg-brand-500/[0.08]"
                : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelect(account.id)}
              className="flex min-h-[56px] min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors active:bg-brand-50/50 dark:active:bg-brand-500/10"
            >
              <div className="relative shrink-0">
                <ContactAvatar name={label} avatar={account.avatar} size="md" />
                {account.new_message ? (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-error-500 ring-2 ring-white dark:ring-gray-900" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`truncate text-sm font-medium ${
                      active
                        ? "text-brand-600 dark:text-brand-400"
                        : "text-gray-800 dark:text-white/90"
                    }`}
                  >
                    {label}
                  </span>
                  {account.pinning ? (
                    <span className="text-[10px] text-brand-500" aria-hidden>
                      📌
                    </span>
                  ) : null}
                </div>
                {account.user_name ? (
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {account.user_name}
                  </p>
                ) : null}
              </div>
            </button>

            {onPin ? (
              <Tooltip content={pinLabel} side="left">
                <button
                  type="button"
                  aria-label={pinLabel}
                  onClick={() => onPin(account)}
                  className="mr-2 shrink-0 cursor-pointer rounded-lg p-1.5 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-gray-100 hover:text-brand-500 focus-visible:opacity-100 dark:hover:bg-white/5"
                >
                  📌
                </button>
              </Tooltip>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export default memo(AccountPanel);
