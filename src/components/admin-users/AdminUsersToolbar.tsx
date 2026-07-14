"use client";

import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";
import AdminIconButton from "./AdminIconButton";
import {
  getPermissionFilterLabel,
  toIsoDate,
} from "@/lib/zalo-user-admin-utils";
import type { UserPermissionFilter } from "@/types/zalo-user-admin";
import { useState } from "react";
import {
  HiChevronDown,
  HiOutlineClock,
  HiOutlineDocumentDownload,
  HiOutlineFilter,
  HiOutlineKey,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineUserAdd,
  HiOutlineUserGroup,
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
  showCreateMenu: boolean;
  showChangePassword: boolean;
  onKeywordChange: (value: string) => void;
  onSearch: () => void;
  onRefresh: () => void;
  onTabChange: (tab: "users" | "logs") => void;
  onCreateUser: () => void;
  onAddAccountLimit: () => void;
  onAddEmployeeLimit: () => void;
  onResetPassword: () => void;
  onCheckAccount: () => void;
  onExport: () => void;
  onFilter: () => void;
  onChangePassword: () => void;
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
  showCreateMenu,
  showChangePassword,
  onKeywordChange,
  onSearch,
  onRefresh,
  onTabChange,
  onCreateUser,
  onAddAccountLimit,
  onAddEmployeeLimit,
  onResetPassword,
  onCheckAccount,
  onExport,
  onFilter,
  onChangePassword,
  onClearFilters,
}: AdminUsersToolbarProps) {
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const hasActiveFilters =
    permissionFilter !== "all" || (dateFilterEnabled && (startDate || endDate));

  return (
    <div className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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
          {showCreateMenu ? (
            <div className="relative shrink-0">
              <div className="inline-flex items-stretch overflow-hidden rounded-lg shadow-theme-xs">
                <button
                  type="button"
                  className={`${mobileToolbarButtonClass} inline-flex items-center gap-2 bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600`}
                  onClick={onCreateUser}
                >
                  <HiOutlinePlus size={16} aria-hidden />
                  <span className="hidden md:inline">Tạo người dùng</span>
                  <span className="md:hidden">Tạo</span>
                </button>
                <AdminIconButton
                  label="Thêm giới hạn nick / nhân viên"
                  side="top"
                  className="dropdown-toggle inline-flex items-center border-l border-white/20 bg-brand-500 px-2.5 py-2 text-white transition hover:bg-brand-600"
                  onClick={() => setCreateMenuOpen((open) => !open)}
                >
                  <HiChevronDown size={16} />
                </AdminIconButton>
              </div>
              <Dropdown
                isOpen={createMenuOpen}
                onClose={() => setCreateMenuOpen(false)}
                className="min-w-[220px] py-1"
              >
                <DropdownItem
                  onClick={() => {
                    onAddAccountLimit();
                    setCreateMenuOpen(false);
                  }}
                  baseClassName="flex w-full items-center gap-2 px-4 py-2.5 text-left text-theme-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <HiOutlineUserAdd size={16} />
                  Thêm giới hạn nick
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    onAddEmployeeLimit();
                    setCreateMenuOpen(false);
                  }}
                  baseClassName="flex w-full items-center gap-2 px-4 py-2.5 text-left text-theme-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <HiOutlineUserGroup size={16} />
                  Thêm giới hạn nhân viên
                </DropdownItem>
              </Dropdown>
            </div>
          ) : null}

          <AdminIconButton
            label="Reset mật khẩu theo yêu cầu"
            side="top"
            className={`${mobileToolbarButtonClass} inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
            onClick={onResetPassword}
          >
            <HiOutlineKey size={16} />
            <span className="hidden lg:inline">Reset mật khẩu</span>
            <span className="lg:hidden">Reset</span>
          </AdminIconButton>

          <AdminIconButton
            label="Kiểm tra tài khoản Zalo trong hệ thống"
            side="top"
            className={`${mobileToolbarButtonClass} inline-flex items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
            onClick={onCheckAccount}
          >
            Kiểm tra TK
          </AdminIconButton>

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

          {showChangePassword ? (
            <AdminIconButton
              label="Đổi mật khẩu đăng nhập"
              side="top"
              className={`${mobileToolbarButtonClass} inline-flex size-[42px] items-center justify-center rounded-lg bg-white text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03]`}
              onClick={onChangePassword}
            >
              <HiOutlineShieldCheck size={18} />
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