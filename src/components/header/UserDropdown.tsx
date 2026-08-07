"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { useAuthStore } from "@/stores/use-auth-store";

export default function UserDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleNewMessageNotification = useAuthStore((s) => s.toggleNewMessageNotification);
  const isLoading = useAuthStore((s) => s.isLoading);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    closeDropdown();
    void logout();
    router.replace("/signin");
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

        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        </button>
      </Tooltip>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {displayName}
          </span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </span>
          )}
        </div>

        <Link
          href="/me"
          onClick={closeDropdown}
          className="group mt-3 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 3.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zM8.75 12a3.25 3.25 0 116.5 0 3.25 3.25 0 01-6.5 0z"
              fill=""
            />
          </svg>
          Trang thông tin
        </Link>

        {/* Action bật/tắt thông báo tin nhắn từ WS — Đồng bộ 100% UI menu */}
        <div className="group mt-1 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300">
          <div className="flex items-center gap-3">
            <svg
              className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 005 14h14a1 1 0 00.707-1.707L19 11.586V8a6 6 0 00-6-6zM8 8a4 4 0 118 0v4H8V8zm2 10a2 2 0 104 0h-4z"
                fill="currentColor"
              />
            </svg>
            <span>Thông báo tin nhắn</span>
          </div>
          <label className="relative inline-flex cursor-pointer items-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={user?.newMessageNotification !== false}
              onChange={(e) => {
                const val = e.target.checked;
                void toggleNewMessageNotification(val);
              }}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-300 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-brand-500 peer-checked:after:translate-x-full dark:bg-gray-700" />
          </label>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoading}
          className="group mt-1 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 font-medium text-gray-700 text-theme-sm hover:bg-gray-100 hover:text-gray-700 disabled:opacity-60 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
        >
          <svg
            className="fill-gray-500 group-hover:fill-gray-700 dark:group-hover:fill-gray-300"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.1007 19.247C14.6865 19.247 14.3507 18.9112 14.3507 18.497L14.3507 14.245H12.8507V18.497C12.8507 19.7396 13.8581 20.747 15.1007 20.747H18.5007C19.7434 20.747 20.7507 19.7396 20.7507 18.497L20.7507 5.49609C20.7507 4.25345 19.7433 3.24609 18.5007 3.24609H15.1007C13.8581 3.24609 12.8507 4.25345 12.8507 5.49609V9.74501L14.3507 9.74501V5.49609C14.3507 5.08188 14.6865 4.74609 15.1007 4.74609L18.5007 4.74609C18.9149 4.74609 19.2507 5.08188 19.2507 5.49609L19.2507 18.497C19.2507 18.9112 18.9149 19.247 18.5007 19.247H15.1007ZM3.25073 11.9984C3.25073 12.2144 3.34204 12.4091 3.48817 12.546L8.09483 17.1556C8.38763 17.4485 8.86251 17.4487 9.15549 17.1559C9.44848 16.8631 9.44863 16.3882 9.15583 16.0952L5.81116 12.7484L16.0007 12.7484C16.4149 12.7484 16.7507 12.4127 16.7507 11.9984C16.7507 11.5842 16.4149 11.2484 16.0007 11.2484L5.81528 11.2484L9.15585 7.90554C9.44864 7.61255 9.44847 7.13767 9.15547 6.84488C8.86248 6.55209 8.3876 6.55226 8.09481 6.84525L3.52309 11.4202C3.35673 11.5577 3.25073 11.7657 3.25073 11.9984Z"
              fill=""
            />
          </svg>
          {isLoading ? "Đang đăng xuất..." : "Đăng xuất"}
        </button>
      </Dropdown>
    </div>
  );
}