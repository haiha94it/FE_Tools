"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { getTeamEmployeePassword } from "@/lib/team-employee-utils";
import { toast } from "@/lib/toast";
import type { TeamEmployee } from "@/types/team-collaboration";
import { memo, useState } from "react";
import { HiOutlineClipboard, HiOutlineEye, HiOutlineEyeOff } from "react-icons/hi";

interface TeamEmployeeTableRowProps {
  employee: TeamEmployee;
  deleting?: boolean;
  onOpenSetup: (employee: TeamEmployee) => void;
  onEditEmployee: (employee: TeamEmployee) => void;
  onDeleteEmployee: (employee: TeamEmployee) => void;
}

function TeamEmployeeTableRow({
  employee,
  deleting = false,
  onOpenSetup,
  onEditEmployee,
  onDeleteEmployee,
}: TeamEmployeeTableRowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const password = getTeamEmployeePassword(employee);
  const masked =
    password.length > 0 ? "•".repeat(Math.min(password.length, 12)) : "—";

  const handleCopyPassword = async () => {
    if (!password) {
      toast.error("Không có mật khẩu để sao chép.");
      return;
    }
    try {
      await navigator.clipboard.writeText(password);
      toast.success("Đã sao chép mật khẩu.");
    } catch {
      toast.error("Không sao chép được mật khẩu.");
    }
  };

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-gray-800 dark:text-white/90">
            {employee.fullname || employee.username}
          </p>
          {employee.is_socialmedia_employee ? (
            <Tooltip
              content="Được gán quyền nhân viên socialmedia (Chúc mừng sinh nhật + Channel Zalo)"
              side="top"
            >
              <span className="inline-flex shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/30">
                Socialmedia
              </span>
            </Tooltip>
          ) : null}
        </div>
        <p className="text-xs text-gray-500">{employee.username}</p>
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-[140px] items-center gap-1.5">
          <span className="font-mono text-theme-xs text-gray-700 dark:text-gray-300">
            {showPassword ? password || "—" : masked}
          </span>
          {password ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Tooltip
                content={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                side="top"
                avoidCollisions={false}
              >
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-white/90"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <HiOutlineEyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <HiOutlineEye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </Tooltip>
              <Tooltip content="Sao chép mật khẩu" side="top" avoidCollisions={false}>
                <button
                  type="button"
                  onClick={() => void handleCopyPassword()}
                  className="cursor-pointer rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/[0.06] dark:hover:text-white/90"
                  aria-label="Sao chép mật khẩu"
                >
                  <HiOutlineClipboard className="h-4 w-4" aria-hidden />
                </button>
              </Tooltip>
            </div>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
        <span
          className="tabular-nums"
          title="Đã gán nick / gói quản lý (không phải quota riêng NV)"
        >
          {employee.account_count ?? employee.logged_account_count ?? 0}/
          {employee.account_limit ?? 0}
        </span>
        <span className="ml-1 text-xs text-gray-500">nick gói</span>
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onEditEmployee(employee)}
            disabled={deleting}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300"
          >
            Sửa
          </button>
          <button
            type="button"
            onClick={() => onOpenSetup(employee)}
            disabled={deleting}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            Gán chức năng
          </button>
          <button
            type="button"
            onClick={() => onDeleteEmployee(employee)}
            disabled={deleting}
            className="rounded-lg border border-error-200 px-3 py-1.5 text-xs font-medium text-error-600 hover:bg-error-50 disabled:opacity-50 dark:border-error-500/30 dark:text-error-400 dark:hover:bg-error-500/10"
          >
            {deleting ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(TeamEmployeeTableRow);
