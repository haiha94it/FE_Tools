"use client";

import Label from "@/components/form/Label";
import AvatarText from "@/components/ui/avatar/AvatarText";
import { ChevronDownIcon } from "@/icons";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface AccountSelectProps {
  accounts: ZaloAccount[];
  value: number | null;
  disabled?: boolean;
  onChange: (accountId: number) => void;
}

function getAccountLabel(account: ZaloAccount) {
  return account.name || account.phone_number || `TK #${account.id}`;
}

function AccountAvatar({
  account,
  size = "md",
}: {
  account: ZaloAccount;
  size?: "sm" | "md";
}) {
  const displayName = getAccountLabel(account);
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const textSizeClass = size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9";

  if (account.avatar) {
    return (
      <div className={`${sizeClass} shrink-0 overflow-hidden rounded-full`}>
        <Image
          width={size === "sm" ? 32 : 36}
          height={size === "sm" ? 32 : 36}
          src={account.avatar}
          alt={displayName}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return <AvatarText name={displayName} className={textSizeClass} />;
}

const triggerClass =
  "flex h-10 w-full items-center gap-2 rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm shadow-theme-xs transition focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 sm:h-11 sm:gap-3 sm:px-3 sm:py-2.5 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800";

export default function AccountSelect({
  accounts,
  value,
  disabled,
  onChange,
}: AccountSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedAccount = accounts.find((account) => account.id === value);
  const isDisabled = disabled || accounts.length === 0;
  const placeholder =
    accounts.length === 0 ? "Chưa có tài khoản" : "Chọn tài khoản";

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSelect = (accountId: number) => {
    onChange(accountId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef}>
      <Label>Tài khoản Zalo</Label>
      <div className="relative z-20 mt-1.5">
        <button
          type="button"
          disabled={isDisabled}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => !isDisabled && setIsOpen((prev) => !prev)}
          className={`${triggerClass} ${
            isDisabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer hover:border-brand-200 dark:hover:border-gray-600"
          }`}
        >
          {selectedAccount ? (
            <>
              <AccountAvatar account={selectedAccount} />
              <span className="min-w-0 flex-1 truncate text-left font-medium text-gray-800 dark:text-white/90">
                {getAccountLabel(selectedAccount)}
              </span>
              {selectedAccount.phone_number && selectedAccount.name && (
                <span className="hidden truncate text-gray-500 sm:block dark:text-gray-400">
                  {selectedAccount.phone_number}
                </span>
              )}
            </>
          ) : (
            <span className="flex-1 truncate text-left text-gray-400 dark:text-gray-400">
              {placeholder}
            </span>
          )}
          <span
            className={`shrink-0 text-gray-500 transition-transform duration-200 dark:text-gray-400 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDownIcon />
          </span>
        </button>

        {isOpen && accounts.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 top-full z-40 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            {accounts.map((account) => {
              const isSelected = account.id === value;
              const label = getAccountLabel(account);

              return (
                <li key={account.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(account.id)}
                    className={`flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5 ${
                      isSelected
                        ? "bg-brand-50 dark:bg-brand-500/10"
                        : ""
                    }`}
                  >
                    <AccountAvatar account={account} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                        {label}
                      </span>
                      {account.phone_number && (
                        <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">
                          {account.phone_number}
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <svg
                        className="shrink-0 text-brand-500"
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M13.3337 4L6.00033 11.3333L2.66699 8"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}