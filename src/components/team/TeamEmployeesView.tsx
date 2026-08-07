"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import TeamCreateEmployeeModal from "@/components/team/TeamCreateEmployeeModal";
import TeamCampaignNotificationCard from "@/components/team/TeamCampaignNotificationCard";
import TeamEditEmployeeModal from "@/components/team/TeamEditEmployeeModal";
import TeamEmployeeSetupModal from "@/components/team/TeamEmployeeSetupModal";
import TeamEmployeesTable from "@/components/team/TeamEmployeesTable";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { dedupeInflight } from "@/lib/inflight";
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
  const [setupEmployee, setSetupEmployee] = useState<TeamEmployee | null>(null);
  const [editEmployee, setEditEmployee] = useState<TeamEmployee | null>(null);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);

  const load = useCallback(async (options?: { background?: boolean }) => {
    const showBlockingLoader = !options?.background && !hasLoadedRef.current;

    if (showBlockingLoader) {
      setLoading(true);
    }

    try {
      const list = await dedupeInflight(
        options?.background
          ? `team:listEmployees:refresh:${Date.now()}`
          : "team:listEmployees",
        () => teamPermissionsService.listEmployees(),
      );
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
    let mounted = true;
    void (async () => {
      try {
        const list = await dedupeInflight(
          "team:listEmployees",
          () => teamPermissionsService.listEmployees(),
        );
        if (mounted) {
          setEmployees((current) =>
            isSameTeamEmployeeList(current, list) ? current : list,
          );
          hasLoadedRef.current = true;
        }
      } catch (error) {
        if (mounted) toast.error(getApiErrorMessage(error));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleCloseCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  const handleEmployeeCreated = useCallback(() => {
    void load({ background: true });
  }, [load]);

  const handleOpenSetup = useCallback((employee: TeamEmployee) => {
    setSetupEmployee(employee);
  }, []);

  const handleCloseSetup = useCallback(() => {
    setSetupEmployee(null);
  }, []);

  const handleSetupSaved = useCallback(() => {
    void load({ background: true });
  }, [load]);

  const handleEditEmployee = useCallback((employee: TeamEmployee) => {
    setEditEmployee(employee);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditEmployee(null);
  }, []);

  const handleEmployeeUpdated = useCallback(() => {
    void load({ background: true });
  }, [load]);

  const handleDeleteEmployee = useCallback(async (employee: TeamEmployee) => {
    const label = employee.fullname?.trim() || employee.username;
    const ok = await confirm({
      title: "Xóa nhân viên",
      message: `Xóa nhân viên "${label}" (@${employee.username})? Nick gán và quyền chiến dịch sẽ bị gỡ. Hành động không thể hoàn tác.`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;

    setDeletingEmployeeId(employee.id);
    try {
      await teamPermissionsService.deleteEmployee(employee.id);
      // Patch local list — không full-screen loading
      setEmployees((current) => current.filter((item) => item.id !== employee.id));
      if (editEmployee?.id === employee.id) setEditEmployee(null);
      if (setupEmployee?.id === employee.id) setSetupEmployee(null);
      toast.success("Đã xóa nhân viên.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDeletingEmployeeId(null);
    }
  }, [editEmployee, setupEmployee]);

  return (
    <div className="space-y-6 pb-12 w-full min-w-0 max-w-full">
      <PageBreadcrumb pageTitle="Quản lý nhân viên" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Nhân viên trong team
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Gán nick Zalo và bật từng loại chiến dịch cho từng nhân viên. Nick
              gán không giới hạn theo “slot NV” — hạn mức theo gói quản lý.
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
            deletingEmployeeId={deletingEmployeeId}
            onOpenSetup={handleOpenSetup}
            onEditEmployee={handleEditEmployee}
            onDeleteEmployee={(employee) => void handleDeleteEmployee(employee)}
          />
        )}
      </div>

      <TeamCampaignNotificationCard />

      <TeamCreateEmployeeModal
        open={createOpen}
        onClose={handleCloseCreate}
        onCreated={handleEmployeeCreated}
        employeeLimit={employeeLimit}
      />
      <TeamEmployeeSetupModal
        employee={setupEmployee}
        open={Boolean(setupEmployee)}
        onClose={handleCloseSetup}
        onSaved={handleSetupSaved}
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
