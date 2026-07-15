"use client";

import type { TeamEmployee } from "@/types/team-collaboration";
import { memo } from "react";
import TeamEmployeeTableRow from "./TeamEmployeeTableRow";

interface TeamEmployeesTableProps {
  employees: TeamEmployee[];
  onAssignAccounts: (employee: TeamEmployee) => void;
  onEditPermissions: (employee: TeamEmployee) => void;
  onEditEmployee: (employee: TeamEmployee) => void;
}

function TeamEmployeesTable({
  employees,
  onAssignAccounts,
  onEditPermissions,
  onEditEmployee,
}: TeamEmployeesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase text-gray-500 dark:border-gray-800">
            <th className="px-3 py-3 font-medium">Nhân viên</th>
            <th className="px-3 py-3 font-medium">Tài khoản</th>
            <th className="px-3 py-3 font-medium text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <TeamEmployeeTableRow
              key={employee.id}
              employee={employee}
              onAssignAccounts={onAssignAccounts}
              onEditPermissions={onEditPermissions}
              onEditEmployee={onEditEmployee}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(TeamEmployeesTable);