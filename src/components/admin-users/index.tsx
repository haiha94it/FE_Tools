"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { canAccessUserAdmin } from "@/lib/map-auth-user";
import { toast } from "@/lib/toast";
import { zaloUserAdminService } from "@/services/zalo-user-admin.service";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloUserAdminStore } from "@/stores/use-zalo-user-admin-store";
import type { ManagedUser } from "@/types/zalo-user-admin";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AdminUsersTable from "./AdminUsersTable";
import AdminUsersToolbar from "./AdminUsersToolbar";
import CreateUserModal from "./CreateUserModal";
import EditUserModal from "./EditUserModal";
import ExportExcelModal from "./ExportExcelModal";
import FilterUsersModal from "./FilterUsersModal";
import UserConsentDetailDrawer from "./UserConsentDetailDrawer";

export default function AdminUsersView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canAccess = canAccessUserAdmin(user);
  const isAdmin = Boolean(user?.isAdmin);
  const isSalerOnly = Boolean(user?.isSaler && !user?.isAdmin);
  const isSaleManager = Boolean(user?.isSaleManager && !user?.isAdmin);

  const users = useZaloUserAdminStore((s) => s.users);
  const total = useZaloUserAdminStore((s) => s.total);
  const page = useZaloUserAdminStore((s) => s.page);
  const pageSize = useZaloUserAdminStore((s) => s.pageSize);
  const keyword = useZaloUserAdminStore((s) => s.keyword);
  const permissionFilter = useZaloUserAdminStore((s) => s.permissionFilter);
  const startDate = useZaloUserAdminStore((s) => s.startDate);
  const endDate = useZaloUserAdminStore((s) => s.endDate);
  const dateFilterEnabled = useZaloUserAdminStore((s) => s.dateFilterEnabled);
  const loading = useZaloUserAdminStore((s) => s.loading);
  const error = useZaloUserAdminStore((s) => s.error);
  const activeTab = useZaloUserAdminStore((s) => s.activeTab);
  const activityLogs = useZaloUserAdminStore((s) => s.activityLogs);
  const activityTotal = useZaloUserAdminStore((s) => s.activityTotal);
  const activityPage = useZaloUserAdminStore((s) => s.activityPage);
  const activityPageSize = useZaloUserAdminStore((s) => s.activityPageSize);
  const logsLoading = useZaloUserAdminStore((s) => s.logsLoading);

  const fetchUsers = useZaloUserAdminStore((s) => s.fetchUsers);
  const fetchActivityLogs = useZaloUserAdminStore((s) => s.fetchActivityLogs);
  const setPage = useZaloUserAdminStore((s) => s.setPage);
  const setPageSize = useZaloUserAdminStore((s) => s.setPageSize);
  const setKeyword = useZaloUserAdminStore((s) => s.setKeyword);
  const applyFilters = useZaloUserAdminStore((s) => s.applyFilters);
  const setActiveTab = useZaloUserAdminStore((s) => s.setActiveTab);
  const setActivityPage = useZaloUserAdminStore((s) => s.setActivityPage);
  const setActivityPageSize = useZaloUserAdminStore((s) => s.setActivityPageSize);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [consentUser, setConsentUser] = useState<ManagedUser | null>(null);
  const [consentOpen, setConsentOpen] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);
  /** Cột mật khẩu ẩn mặc định; bật bằng nút trên toolbar */
  const [showPasswordColumn, setShowPasswordColumn] = useState(false);

  useEffect(() => {
    if (!canAccess) {
      router.replace("/me");
      return;
    }
    void fetchUsers();
  }, [canAccess, fetchUsers, router]);

  const showExport = !isSalerOnly;
  const canViewPassword =
    permissionFilter === "no_active" || !isSalerOnly || isSaleManager;
  const showPassword = canViewPassword && showPasswordColumn;

  const isLogsTab = activeTab === "logs";

  const tableProps = useMemo(() => {
    if (isLogsTab) {
      return {
        mode: "logs" as const,
        users: [],
        logs: activityLogs,
        loading: logsLoading,
        page: activityPage,
        pageSize: activityPageSize,
        total: activityTotal,
      };
    }
    return {
      mode: "users" as const,
      users,
      logs: [],
      loading,
      page,
      pageSize,
      total,
    };
  }, [
    isLogsTab,
    activityLogs,
    logsLoading,
    activityPage,
    activityPageSize,
    activityTotal,
    users,
    loading,
    page,
    pageSize,
    total,
  ]);

  const handleDelete = async (row: ManagedUser) => {
    if (
      !(await confirm({
        title: "Xóa tài khoản",
        message: "Bạn có chắc chắn muốn xóa tài khoản này không?",
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await zaloUserAdminService.deleteUser(row.id);
      toast.success("Đã xóa tài khoản.");
      void fetchUsers({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleToggleLock = async (row: ManagedUser) => {
    const isLocked = Boolean(row.is_locked);
    if (
      !(await confirm({
        title: isLocked ? "Mở khóa tài khoản" : "Khóa tài khoản",
        message: `Bạn có chắc chắn muốn ${isLocked ? "mở khóa" : "khóa"} tài khoản "${row.username}"?`,
        confirmText: isLocked ? "Mở khóa" : "Khóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      if (isLocked) {
        await zaloUserAdminService.unblockUser(row.id);
        toast.success(`Mở khóa tài khoản "${row.username}" thành công.`);
      } else {
        await zaloUserAdminService.lockUser(row.id);
        toast.success(`Khóa tài khoản "${row.username}" thành công.`);
      }
      void fetchUsers({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleActivate = async (row: ManagedUser) => {
    if (!row.token) return;
    setActivatingId(row.id);
    try {
      await zaloUserAdminService.activateUser(row.token);
      toast.success(
        `Kích hoạt tài khoản "${row.username || row.fullname || ""}" thành công.`,
      );
      void fetchUsers({ silent: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setActivatingId(null);
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle="Quản lý người dùng"
        parents={[{ label: "Admin", href: "/admin/users" }]}
      />

      {error ? (
        <Alert variant="error" title="Không tải được dữ liệu" message={error} />
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <AdminUsersToolbar
          keyword={keyword}
          loading={loading || logsLoading}
          total={isLogsTab ? activityTotal : total}
          activeTab={activeTab}
          permissionFilter={permissionFilter}
          dateFilterEnabled={dateFilterEnabled}
          startDate={startDate}
          endDate={endDate}
          showExport={showExport}
          showCreateUser
          canTogglePassword={!isLogsTab && canViewPassword}
          showPasswordColumn={showPasswordColumn}
          onTogglePasswordColumn={() => setShowPasswordColumn((v) => !v)}
          onKeywordChange={setKeyword}
          onSearch={() => void fetchUsers()}
          onRefresh={() => {
            if (isLogsTab) void fetchActivityLogs();
            else void fetchUsers();
          }}
          onTabChange={setActiveTab}
          onCreateUser={() => setCreateOpen(true)}
          onExport={() => setExportOpen(true)}
          onFilter={() => setFilterOpen(true)}
          onClearFilters={() =>
            applyFilters({
              permission: "all",
              enabled: false,
              startDate: null,
              endDate: null,
            })
          }
        />

        <AdminUsersTable
          {...tableProps}
          permissionFilter={permissionFilter}
          showPassword={showPassword}
          activatingId={activatingId}
          onPageChange={isLogsTab ? setActivityPage : setPage}
          onPageSizeChange={isLogsTab ? setActivityPageSize : setPageSize}
          onEdit={(row) => {
            setEditingUser(row);
            setEditOpen(true);
          }}
          onDelete={(row) => void handleDelete(row)}
          onActivate={(row) => void handleActivate(row)}
          onToggleLock={(row) => void handleToggleLock(row)}
          onViewConsent={(row) => {
            setConsentUser(row);
            setConsentOpen(true);
          }}
        />
      </div>

      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => void fetchUsers({ silent: true })}
      />
      <EditUserModal
        open={editOpen}
        user={editingUser}
        isAdmin={isAdmin}
        showCurrentPassword={isAdmin || isSaleManager}
        onClose={() => setEditOpen(false)}
        onSuccess={() => void fetchUsers({ silent: true })}
      />
      <FilterUsersModal
        open={filterOpen}
        permission={permissionFilter}
        dateEnabled={dateFilterEnabled}
        startDate={startDate}
        endDate={endDate}
        hideAdminOptions={isSalerOnly || isSaleManager}
        onClose={() => setFilterOpen(false)}
        onApply={(payload) => applyFilters(payload)}
      />
      <ExportExcelModal open={exportOpen} onClose={() => setExportOpen(false)} />
      <UserConsentDetailDrawer
        open={consentOpen}
        user={consentUser}
        onClose={() => {
          setConsentOpen(false);
          setConsentUser(null);
        }}
        onRevoked={() => void fetchUsers({ silent: true })}
      />
    </div>
  );
}
