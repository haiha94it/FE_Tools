"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuthStore } from "@/stores/use-auth-store";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    closeDropdown();
    void logout();
    router.replace("/login");
  };

  const displayName = user?.name ?? user?.username ?? "Tài khoản";
  const subtitle = user?.email || user?.username || "";

  return (
    <div className="relative">
      <Tooltip content="Menu tài khoản" side="bottom">
        <button
          onClick={toggleDropdown}
          className="dropdown-toggle flex cursor-pointer items-center text-gray-700 dark:text-gray-400"
          aria-label="Menu tài khoản"
          type="button"
        >
          <span className="mr-3 shrink-0">
            <AvatarText
              name={displayName}
              size="md"
              className="!h-11 !w-11 !text-sm"
            />
          </span>
          <span className="mr-1 block max-w-[120px] truncate font-medium text-theme-sm">
            {displayName}
          </span>
        </button>
      </Tooltip>

      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="min-w-[200px]">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        </div>
        <ul className="flex flex-col py-2">
          <li>
            <Link
              href="/dashboard"
              onClick={closeDropdown}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Tổng quan
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10"
            >
              Đăng xuất
            </button>
          </li>
        </ul>
      </Dropdown>
    </div>
  );
}
