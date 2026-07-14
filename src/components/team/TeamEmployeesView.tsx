"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import TeamEmployeeAccountsModal from "@/components/team/TeamEmployeeAccountsModal";
import TeamEmployeePermissionsModal from "@/components/team/TeamEmployeePermissionsModal";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import type { TeamEmployee } from "@/types/team-collaboration";
import { useEffect, useState } from "react";

export default function TeamEmployeesView() {
  const [employees, setEmployees] = useState<TeamEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsEmployee, setAccountsEmployee] = useState<TeamEmployee | null>(null);
  const [permissionsEmployee, setPermissionsEmployee] = useState<TeamEmployee | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await teamPermissionsService.listEmployees();
      setEmployees(list);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb pageTitle="Quản lý nhân viên" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Nhân viên trong team
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Gán nick Zalo và bật từng loại chiến dịch cho từng nhân viên.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : employees.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Chưa có nhân viên. Tạo tài khoản NV từ menu quản lý hoặc liên hệ admin.
          </p>
        ) : (
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
                  <tr
                    key={employee.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
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
                          onClick={() => setAccountsEmployee(employee)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                        >
                          Gán nick
                        </button>
                        <button
                          type="button"
                          onClick={() => setPermissionsEmployee(employee)}
                          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-600"
                        >
                          Quyền chiến dịch
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <TeamEmployeeAccountsModal
        employee={accountsEmployee}
        open={Boolean(accountsEmployee)}
        onClose={() => {
          setAccountsEmployee(null);
          void load();
        }}
      />
      <TeamEmployeePermissionsModal
        employee={permissionsEmployee}
        open={Boolean(permissionsEmployee)}
        onClose={() => setPermissionsEmployee(null)}
      />
    </div>
  );
}