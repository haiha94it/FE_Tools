"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import Button from "@/components/ui/button/Button";
import TeamCreateEmployeeModal from "@/components/team/TeamCreateEmployeeModal";
import TeamEditEmployeeModal from "@/components/team/TeamEditEmployeeModal";
import TeamEmployeeAccountsModal from "@/components/team/TeamEmployeeAccountsModal";
import TeamEmployeePermissionsModal from "@/components/team/TeamEmployeePermissionsModal";
import TeamEmployeesTable from "@/components/team/TeamEmployeesTable";
import { getApiErrorMessage } from "@/lib/errors";
import { isSameTeamEmployeeList } from "@/lib/team-employee-utils";
import { toast } from "@/lib/toast";
import { teamPermissionsService } from "@/services/team-permissions.service";
import { useAuthStore } from "@/stores/use-auth-store";
import type { TeamEmployee } from "@/types/team-collaboration";
import { useCallback, useEffect, useRef, useState } from "react";

export default function TeamEmployeesView() {
  const employeeLimit = useAuthStore((s) => s.user?.employeeLimit ?? 0);
  const [employees, setEmployees] = useState<TeamEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [accountsEmployee, setAccountsEmployee] = useState<TeamEmployee | null>(null);
  const [permissionsEmployee, setPermissionsEmployee] = useState<TeamEmployee | null>(null);
  const [editEmployee, setEditEmployee] = useState<TeamEmployee | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (options?: { background?: boolean }) => {
    const showBlockingLoader = !options?.background && !hasLoadedRef.current;

    if (showBlockingLoader) {
      setLoading(true);
    }

    try {
      const list = await teamPermissionsService.listEmployees();
      setEmployees((current) =>
        isSameTeamEmployeeList(current, list) ? current : list,
      );
      hasLoadedRef.current = true;
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      if (showBlockingLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const handleEmployeeCreated = useCallback(() => {
    void load({ background: true });
  }, [load]);

  const handleAssignAccounts = useCallback((employee: TeamEmployee) => {
    setAccountsEmployee(employee);
  }, []);

  const handleCloseAccountsModal = useCallback(() => {
    setAccountsEmployee(null);
  }, []);

  const handleAccountsSaved = useCallback(() => {
    void load({ background: true });
  }, [load]);

  const handleEditPermissions = useCallback((employee: TeamEmployee) => {
    setPermissionsEmployee(employee);
  }, []);

  const handleClosePermissionsModal = useCallback(() => {
    setPermissionsEmployee(null);
  }, []);

  const handleEditEmployee = useCallback((employee: TeamEmployee) => {
    setEditEmployee(employee);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditEmployee(null);
  }, []);

  const handleEmployeeUpdated = useCallback(() => {
    void load({ background: true });
  }, [load]);

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb pageTitle="Quản lý nhân viên" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Nhân viên trong team
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gán nick Zalo và bật từng loại chiến dịch cho từng nhân viên.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Số lượng nhân viên được phép tạo: {employeeLimit}
            </p>
          </div>
          <Button size="sm" onClick={handleOpenCreate}>
            Thêm tài khoản nhân viên
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : employees.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            Chưa có nhân viên. Nhấn &quot;Thêm tài khoản nhân viên&quot; để tạo mới.
          </p>
        ) : (
          <TeamEmployeesTable
            employees={employees}
            onAssignAccounts={handleAssignAccounts}
            onEditPermissions={handleEditPermissions}
            onEditEmployee={handleEditEmployee}
          />
        )}
      </div>

      <TeamCreateEmployeeModal
        open={createOpen}
        onClose={handleCloseCreate}
        onCreated={handleEmployeeCreated}
        employeeLimit={employeeLimit}
      />
      <TeamEmployeeAccountsModal
        employee={accountsEmployee}
        open={Boolean(accountsEmployee)}
        onClose={handleCloseAccountsModal}
        onSaved={handleAccountsSaved}
      />
      <TeamEmployeePermissionsModal
        employee={permissionsEmployee}
        open={Boolean(permissionsEmployee)}
        onClose={handleClosePermissionsModal}
      />
      <TeamEditEmployeeModal
        employee={editEmployee}
        open={Boolean(editEmployee)}
        onClose={handleCloseEditModal}
        onSaved={handleEmployeeUpdated}
      />
    </div>
  );
}