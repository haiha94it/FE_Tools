"use client";

import Badge from "@/components/ui/badge/Badge";
import ScrollableTableContainer from "@/components/ui/table/ScrollableTableContainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Pagination from "@/components/tables/Pagination";
import { formatActivityLogDateTime } from "@/lib/zalo-user-admin-utils";
import type { ManagedUser, UserActivityLog } from "@/types/zalo-user-admin";
import { HiOutlineClock, HiOutlineUsers } from "react-icons/hi";
import AdminUserTableRow from "./AdminUserTableRow";

interface AdminUsersTableProps {
  mode: "users" | "logs";
  users: ManagedUser[];
  logs: UserActivityLog[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  permissionFilter: string;
  showPassword: boolean;
  activatingId: number | null;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onActivate: (user: ManagedUser) => void;
  onToggleLock: (user: ManagedUser) => void;
  onViewConsent: (user: ManagedUser) => void;
}

const PAGE_SIZE_OPTIONS = [50, 100, 200];

const headerClass =
  "px-4 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400";

const logCellClass =
  "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400";

function TableLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
        {icon}
      </div>
      <p className="text-base font-medium text-gray-800 dark:text-white/90">{title}</p>
      <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}

export default function AdminUsersTable({
  mode,
  users,
  logs,
  loading,
  page,
  pageSize,
  total,
  permissionFilter,
  showPassword,
  activatingId,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  onActivate,
  onToggleLock,
  onViewConsent,
}: AdminUsersTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const isEmpty = mode === "users" ? users.length === 0 : logs.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <ScrollableTableContainer fill className="!rounded-none !border-0">
        {loading && isEmpty ? (
          <TableLoading />
        ) : mode === "logs" ? (
          isEmpty ? (
            <EmptyState
              icon={<HiOutlineClock size={28} />}
              title="Chưa có lịch sử"
              description="Các thao tác quản trị sẽ hiển thị tại đây."
            />
          ) : (
            <div className="min-w-[900px]">
              {loading ? (
                <div className="flex justify-center py-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                </div>
              ) : null}
              <Table>
                <TableHeader className="sticky top-0 z-20 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                  <TableRow>
                    <TableCell isHeader className={`${headerClass} w-14`}>
                      STT
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Người thực hiện
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Hành động
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Đối tượng
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Chi tiết
                    </TableCell>
                    <TableCell isHeader className={headerClass}>
                      Thời gian
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {logs.map((log, index) => (
                    <TableRow
                      key={log.id}
                      className="transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]"
                    >
                      <TableCell className={`${logCellClass} tabular-nums`}>
                        {(page - 1) * pageSize + index + 1}
                      </TableCell>
                      <TableCell className={logCellClass}>
                        {log.performer_username ?? "—"}
                      </TableCell>
                      <TableCell className={logCellClass}>
                        <Badge size="sm" color="primary">
                          {log.action_display ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className={logCellClass}>
                        {log.target_username ?? "—"}
                      </TableCell>
                      <TableCell className={`${logCellClass} max-w-[280px]`}>
                        <span className="line-clamp-2">{log.detail ?? "—"}</span>
                      </TableCell>
                      <TableCell className={`${logCellClass} whitespace-nowrap`}>
                        {formatActivityLogDateTime(log.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )
        ) : isEmpty ? (
          <EmptyState
            icon={<HiOutlineUsers size={28} />}
            title="Không có người dùng"
            description="Thử đổi bộ lọc hoặc tạo người dùng mới để bắt đầu."
          />
        ) : (
          <div className="min-w-[1000px]">
            {loading ? (
              <div className="flex justify-center py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              </div>
            ) : null}
            <Table>
              <TableHeader className="sticky top-0 z-20 border-b border-gray-100 bg-gray-50 dark:border-white/[0.05] dark:bg-gray-900">
                <TableRow>
                  <TableCell isHeader className={`${headerClass} w-14`}>
                    STT
                  </TableCell>
                  <TableCell isHeader className={`${headerClass} min-w-[200px]`}>
                    Người dùng
                  </TableCell>
                  {showPassword ? (
                    <TableCell isHeader className={headerClass}>
                      Mật khẩu
                    </TableCell>
                  ) : null}
                  <TableCell isHeader className={headerClass}>
                    Email
                  </TableCell>
                  <TableCell isHeader className={headerClass}>
                    Quyền
                  </TableCell>
                  {permissionFilter !== "no_active" ? (
                    <TableCell
                      isHeader
                      className={`${headerClass} min-w-[4.5rem] whitespace-nowrap text-center`}
                    >
                      NV
                    </TableCell>
                  ) : null}
                  <TableCell
                    isHeader
                    className={`${headerClass} min-w-[4.5rem] whitespace-nowrap text-center`}
                  >
                    TK
                  </TableCell>
                  <TableCell isHeader className={`${headerClass} min-w-[7rem]`}>
                    Đồng ý xử lý tin nhắn
                  </TableCell>
                  <TableCell isHeader className={`${headerClass} min-w-[8rem]`}>
                    Thời điểm ký
                  </TableCell>
                  <TableCell isHeader className={headerClass}>
                    Ngày tạo
                  </TableCell>
                  <TableCell isHeader className={headerClass}>
                    HSD
                  </TableCell>
                  <TableCell isHeader className={headerClass}>
                    Trạng thái
                  </TableCell>
                  <TableCell
                    isHeader
                    className={`${headerClass} sticky top-0 right-0 z-30 min-w-[180px] bg-gray-50 shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.08)] dark:bg-gray-900 dark:shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.35)]`}
                  >
                    Thao tác
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {users.map((user, index) => (
                  <AdminUserTableRow
                    key={user.id}
                    user={user}
                    index={(page - 1) * pageSize + index + 1}
                    permissionFilter={permissionFilter}
                    showPassword={showPassword}
                    isActivating={activatingId === user.id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onActivate={onActivate}
                    onToggleLock={onToggleLock}
                    onViewConsent={onViewConsent}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </ScrollableTableContainer>

      {!isEmpty || total > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-white/[0.05]">
          <div className="flex items-center gap-2 text-theme-sm text-gray-500 dark:text-gray-400">
            <span>
              Trang {page}/{totalPages}
            </span>
            <span className="text-gray-300 dark:text-gray-600">·</span>
            <label className="flex items-center gap-2">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-theme-sm text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}