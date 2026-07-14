"use client";

import type { TeamEmployee } from "@/types/team-collaboration";
import { memo } from "react";

interface TeamEmployeeTableRowProps {
  employee: TeamEmployee;
  onAssignAccounts: (employee: TeamEmployee) => void;
  onEditPermissions: (employee: TeamEmployee) => void;
}

function TeamEmployeeTableRow({
  employee,
  onAssignAccounts,
  onEditPermissions,
}: TeamEmployeeTableRowProps) {
  return (
    <tr className="border-b border-gray-100 dark:border-gray-800">
      <td className="px-3 py-3">
        <p className="font-medium text-gray-800 dark:text-white/90">
          {employee.fullname || employee.username}
        </p>
        <p className="text-xs text-gray-500">@{employee.username}</p>
      </td>
      <td className="px-3 py-3 text-gray-600 dark:text-gray-400">
        {employee.account_count ?? 0} / {employee.account_limit ?? 0} nick
      </td>
      <td className="px-3 py-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onAssignAccounts(employee)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
          >
            Gán nick
          </button>
          <button
            type="button"
            onClick={() => onEditPermissions(employee)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
          >
            Quyền chiến dịch
          </button>
        </div>
      </td>
    </tr>
  );
}

export default memo(TeamEmployeeTableRow);