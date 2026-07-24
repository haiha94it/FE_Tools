"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  consentStatusLabel,
  formatConsentDateTime,
  normalizeConsentStatus,
} from "@/lib/consent-utils";
import {
  formatManagedUserDate,
  getManagedUserPermissionBadgeColor,
  getManagedUserPermissionLabel,
} from "@/lib/zalo-user-admin-utils";
import type { ManagedUser } from "@/types/zalo-user-admin";
import {
  HiOutlineCheck,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineMinusCircle,
} from "react-icons/hi";
import AdminIconButton from "./AdminIconButton";

const cellClass =
  "px-4 py-3 text-start text-theme-sm text-gray-500 dark:text-gray-400";

const iconBtnClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-theme-xs transition hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-400";

const iconBtnDangerClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-error-200 bg-white text-error-600 shadow-theme-xs transition hover:bg-error-50 dark:border-error-500/30 dark:bg-gray-900 dark:hover:bg-error-500/10";

const iconBtnSuccessClass =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-success-200 bg-white text-success-600 shadow-theme-xs transition hover:bg-success-50 dark:border-success-500/30 dark:bg-gray-900 dark:hover:bg-success-500/10";

interface AdminUserTableRowProps {
  user: ManagedUser;
  index: number;
  permissionFilter: string;
  showPassword: boolean;
  isActivating: boolean;
  consentActing?: boolean;
  onEdit: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
  onActivate: (user: ManagedUser) => void;
  onToggleLock: (user: ManagedUser) => void;
  onViewConsent: (user: ManagedUser) => void;
  /** §5.3b — chỉ pending_approval */
  onApproveConsent?: (user: ManagedUser) => void;
  onRejectConsent?: (user: ManagedUser) => void;
  onRevokeConsent?: (user: ManagedUser) => void;
}

export default function AdminUserTableRow({
  user,
  index,
  permissionFilter,
  showPassword,
  isActivating,
  consentActing = false,
  onEdit,
  onDelete,
  onActivate,
  onToggleLock,
  onViewConsent,
  onApproveConsent,
  onRejectConsent,
  onRevokeConsent,
}: AdminUserTableRowProps) {
  const displayName = user.fullname || user.username;
  const passwordValue =
    permissionFilter === "no_active" ? user.password : user.raw_password;
  const lockLabel = user.is_locked ? "Mở khóa tài khoản" : "Khóa tài khoản";
  const consentStatus = normalizeConsentStatus(
    user.message_processing_status ??
      (user.message_processing_signed ? "approved" : "none"),
  );
  const consentBadgeColor =
    consentStatus === "approved"
      ? "success"
      : consentStatus === "pending_approval"
        ? "warning"
        : consentStatus === "rejected"
          ? "error"
          : "light";
  const isPendingConsent = consentStatus === "pending_approval";
  const rejectReason = user.message_processing_reject_reason?.trim() || null;

  return (
    <TableRow className="group transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
      <TableCell className={`${cellClass} w-14 tabular-nums`}>{index}</TableCell>
      <TableCell className="px-4 py-3 text-start">
        <div className="flex min-w-[180px] items-center gap-3">
          <AvatarText name={displayName} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {user.username}
            </p>
            <p className="truncate text-theme-xs text-gray-500 dark:text-gray-400">
              {user.fullname || "—"}
            </p>
          </div>
        </div>
      </TableCell>
      {showPassword ? (
        <TableCell className={`${cellClass} font-mono text-theme-xs`}>
          {passwordValue ?? "—"}
        </TableCell>
      ) : null}
      <TableCell className={`${cellClass} max-w-[200px]`}>
        <span className="block truncate">{user.mail ?? "—"}</span>
      </TableCell>
      <TableCell className={cellClass}>
        <Badge
          size="sm"
          color={getManagedUserPermissionBadgeColor(user)}
        >
          {getManagedUserPermissionLabel(user)}
        </Badge>
      </TableCell>
      {permissionFilter !== "no_active" ? (
        <TableCell className={`${cellClass} min-w-[4.5rem] whitespace-nowrap text-center tabular-nums`}>
          {user.employee_count ?? 0} / {user.employee_limit ?? 0}
        </TableCell>
      ) : null}
      <TableCell className={`${cellClass} min-w-[4.5rem] whitespace-nowrap text-center tabular-nums`}>
        {user.account_count ?? 0} / {user.account_limit ?? 0}
      </TableCell>
      <TableCell className={cellClass}>
        <div className="flex min-w-[7rem] flex-col gap-0.5">
          <Badge size="sm" color={consentBadgeColor}>
            {consentStatusLabel(consentStatus)}
          </Badge>
          {consentStatus === "rejected" && rejectReason ? (
            <span
              className="line-clamp-2 max-w-[12rem] text-theme-xs text-error-600 dark:text-error-400"
              title={rejectReason}
            >
              {rejectReason}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell className={`${cellClass} whitespace-nowrap`}>
        {formatConsentDateTime(
          user.message_processing_submitted_at ||
            user.message_processing_signed_at,
        )}
      </TableCell>
      <TableCell className={`${cellClass} whitespace-nowrap`}>
        {formatManagedUserDate(user.created_at)}
      </TableCell>
      <TableCell className={`${cellClass} whitespace-nowrap`}>
        {formatManagedUserDate(user.expiration_date)}
      </TableCell>
      <TableCell className={cellClass}>
        {user.is_locked ? (
          <Badge size="sm" color="error">
            Đã khóa
          </Badge>
        ) : (
          <Badge size="sm" color="success">
            Hoạt động
          </Badge>
        )}
      </TableCell>
      <TableCell className="sticky right-0 z-[1] bg-white px-4 py-3 shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.06)] group-hover:bg-gray-50/80 dark:bg-gray-900 dark:shadow-[-6px_0_12px_-6px_rgba(0,0,0,0.3)] dark:group-hover:bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <AdminIconButton
            label="Chi tiết đồng thuận"
            side="left"
            className={iconBtnClass}
            onClick={() => onViewConsent(user)}
          >
            <HiOutlineDocumentText size={15} />
          </AdminIconButton>

          <AdminIconButton
            label="Sửa thông tin"
            side="left"
            className={iconBtnClass}
            onClick={() => onEdit(user)}
          >
            <HiOutlinePencil size={15} />
          </AdminIconButton>
          <AdminIconButton
            label={lockLabel}
            side="left"
            className={user.is_locked ? iconBtnSuccessClass : iconBtnDangerClass}
            onClick={() => onToggleLock(user)}
          >
            {user.is_locked ? (
              <HiOutlineLockOpen size={15} />
            ) : (
              <HiOutlineLockClosed size={15} />
            )}
          </AdminIconButton>
          {user.token ? (
            <AdminIconButton
              label={isActivating ? "Đang kích hoạt..." : "Kích hoạt email"}
              side="left"
              className={iconBtnSuccessClass}
              disabled={isActivating}
              onClick={() => onActivate(user)}
            >
              <HiOutlineCheckCircle size={15} />
            </AdminIconButton>
          ) : null}
          <AdminIconButton
            label="Xóa tài khoản"
            side="left"
            className={iconBtnDangerClass}
            onClick={() => onDelete(user)}
          >
            <HiOutlineTrash size={15} />
          </AdminIconButton>
        </div>
      </TableCell>
    </TableRow>
  );
}