"use client";

import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";
import AdminIconButton from "./AdminIconButton";
import {
  getPermissionFilterLabel,
  toIsoDate,
} from "@/lib/zalo-user-admin-utils";
import type { UserPermissionFilter } from "@/types/zalo-user-admin";
import {
  HiOutlineClock,
  HiOutlineDocumentDownload,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineUsers,
} from "react-icons/hi";

interface AdminUsersToolbarProps {
  keyword: string;
  loading: boolean;
  total: number;
  activeTab: "users" | "logs";
  permissionFilter: UserPermissionFilter;
  dateFilterEnabled: boolean;
  startDate: Date | null;
  endDate: Date | null;
  showExport: boolean;
  showCreateUser: boolean;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onTabChange: (tab: "users" | "logs") => void;
  onCreateUser: () => void;
  onExport: () => void;
  onFilter: () => void;
  onClearFilters: () => void;
}

function ViewTabs({
  activeTab,
  onChange,
}: {
  activeTab: "users" | "logs";
  onChange: (tab: "users" | "logs") => void;
}) {
  const tabClass = (tab: "users" | "logs") =>
    activeTab === tab
      ? "shadow-theme-xs bg-white text-gray-900 dark:bg-gray-800 dark:text-white"
      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white/90";

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        type="button"
        onClick={() => onChange("users")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-theme-sm font-medium transition ${tabClass("users")}`}
      >
        <HiOutlineUsers size={16} aria-hidden />
        Danh sách
      </button>
      <button
        type="button"
        onClick={() => onChange("logs")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-theme-sm font-medium transition ${tabClass("logs")}`}
      >
        <HiOutlineClock size={16} aria-hidden />
        Lịch sử
      </button>
    </div>
  );
}

export default function AdminUsersToolbar({
  keyword,
  loading,
  total,
  activeTab,
  permissionFilter,
  dateFilterEnabled,
  startDate,
  endDate,
  showExport,
  showCreateUser,
  onKeywordChange,
  onSearch,
  onRefresh,
  onTabChange,
  onCreateUser,
  onExport,
  onFilter,
  onClearFilters,
}: AdminUsersToolbarProps) {
  const hasActiveFilters =
    permissionFilter !== "all" || (dateFilterEnabled && (startDate || endDate));

  return (
    <div className="relative z-10 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 dark:border-white/[0.05]">
        <ViewTabs activeTab={activeTab} onChange={onTabChange} />
        <div className="flex items-center gap-2">
          <Badge size="sm" color="light">
            {loading ? "Đang tải..." : `${total.toLocaleString("vi-VN")} bản ghi`}
          </Badge>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
        <form
          className="w-full sm:max-w-sm sm:flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch();
          }}
        >
          <div className="relative">
            <HiOutlineSearch
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              aria-hidden
            />
            <Input
              placeholder="Tìm theo tên đăng nhập, họ tên, SĐT..."
              value={keyword}
              className="pl-10"
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </div>
        </form>

        <MobileToolbarStrip className="sm:ml-auto">
          {showCreateUser ? (
            <button
              type="button"
              className={`${mobileToolbarButtonClass} inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600`}
              onClick={onCreateUser}
            >
              <HiOutlinePlus size={16} aria-hidden />
              <span className="hidden md:inline">Tạo người dùng</span>
              <span className="md:hidden">Tạo</span>
            </button>
          ) : null}

          <AdminIconButton
            label="Làm mới danh sách"
            side="top"
            disabled={loading}
            className={`${mobileToolbarButtonClass} inline-flex size-[42px] items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
            onClick={onRefresh}
          >
            <HiOutlineRefresh
              size={18}
              className={loading ? "animate-spin" : undefined}
            />
          </AdminIconButton>

          {showExport ? (
            <AdminIconButton
              label="Xuất file Excel"
              side="top"
              className={`${mobileToolbarButtonClass} inline-flex size-[42px] items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
              onClick={onExport}
            >
              <HiOutlineDocumentDownload size={18} />
            </AdminIconButton>
          ) : null}

          <AdminIconButton
            label="Bộ lọc nâng cao"
            side="top"
            className={`${mobileToolbarButtonClass} inline-flex size-[42px] items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
            onClick={onFilter}
          >
            <HiOutlineFilter size={18} />
          </AdminIconButton>
        </MobileToolbarStrip>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-2.5 dark:border-white/[0.05]">
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            Đang lọc:
          </span>
          {permissionFilter !== "all" ? (
            <Badge size="sm" color="primary">
              {getPermissionFilterLabel(permissionFilter)}
            </Badge>
          ) : null}
          {dateFilterEnabled && startDate && endDate ? (
            <Badge size="sm" color="info">
              {toIsoDate(startDate)} → {toIsoDate(endDate)}
            </Badge>
          ) : null}
          <button
            type="button"
            onClick={onClearFilters}
            className="text-theme-xs font-medium text-brand-500 transition hover:text-brand-600"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : null}
    </div>
  );
}
