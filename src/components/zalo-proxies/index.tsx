"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import ScrollableTableContainer, {
  adminDataPageClass,
} from "@/components/ui/table/ScrollableTableContainer";
import { confirm } from "@/lib/confirm";
import { toast } from "@/lib/toast";
import {
  useFilteredZaloProxies,
  useZaloProxyStore,
} from "@/stores/use-zalo-proxy-store";
import { useAuthStore } from "@/stores/use-auth-store";
import { useCallback, useEffect, useMemo } from "react";
import ZaloProxiesTable from "./ZaloProxiesTable";
import ZaloProxiesToolbar from "./ZaloProxiesToolbar";
import ZaloProxyDeleteModal from "./ZaloProxyDeleteModal";
import ZaloProxyFormModal from "./ZaloProxyFormModal";
import type { ZaloProxyItem } from "@/types/zalo-proxy";

export default function ZaloProxiesView() {
  const user = useAuthStore((s) => s.user);
  const filteredProxies = useFilteredZaloProxies();
  const selectedIds = useZaloProxyStore((s) => s.selectedIds);
  const search = useZaloProxyStore((s) => s.search);
  const isLoading = useZaloProxyStore((s) => s.isLoading);
  const error = useZaloProxyStore((s) => s.error);
  const checkingIds = useZaloProxyStore((s) => s.checkingIds);
  const checkTaskId = useZaloProxyStore((s) => s.checkTaskId);

  const isFormOpen = useZaloProxyStore((s) => s.isFormOpen);
  const editingProxy = useZaloProxyStore((s) => s.editingProxy);
  const proxyInput = useZaloProxyStore((s) => s.proxyInput);
  const noteInput = useZaloProxyStore((s) => s.noteInput);
  const expirationInput = useZaloProxyStore((s) => s.expirationInput);
  const isSaving = useZaloProxyStore((s) => s.isSaving);
  const deletingId = useZaloProxyStore((s) => s.deletingId);
  const deleteConfirm = useZaloProxyStore((s) => s.deleteConfirm);

  const fetchProxies = useZaloProxyStore((s) => s.fetchProxies);
  const createProxies = useZaloProxyStore((s) => s.createProxies);
  const updateProxy = useZaloProxyStore((s) => s.updateProxy);
  const deleteProxies = useZaloProxyStore((s) => s.deleteProxies);
  const checkProxies = useZaloProxyStore((s) => s.checkProxies);
  const pollCheckResult = useZaloProxyStore((s) => s.pollCheckResult);

  const setSearch = useZaloProxyStore((s) => s.setSearch);
  const toggleSelect = useZaloProxyStore((s) => s.toggleSelect);
  const toggleSelectAll = useZaloProxyStore((s) => s.toggleSelectAll);
  const openCreateForm = useZaloProxyStore((s) => s.openCreateForm);
  const openEditForm = useZaloProxyStore((s) => s.openEditForm);
  const closeForm = useZaloProxyStore((s) => s.closeForm);
  const setProxyInput = useZaloProxyStore((s) => s.setProxyInput);
  const setNoteInput = useZaloProxyStore((s) => s.setNoteInput);
  const setExpirationInput = useZaloProxyStore((s) => s.setExpirationInput);
  const openDeleteConfirm = useZaloProxyStore((s) => s.openDeleteConfirm);
  const closeDeleteConfirm = useZaloProxyStore((s) => s.closeDeleteConfirm);

  useEffect(() => {
    void fetchProxies();
  }, [fetchProxies]);

  useEffect(() => {
    if (!checkTaskId) return;
    const interval = window.setInterval(() => {
      void pollCheckResult();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [checkTaskId, pollCheckResult]);

  const filteredIds = useMemo(
    () => filteredProxies.map((proxy) => proxy.id),
    [filteredProxies],
  );

  const handleToggleAll = useCallback(() => {
    toggleSelectAll(filteredIds);
  }, [toggleSelectAll, filteredIds]);

  const handleDeleteProxy = useCallback(
    (proxy: ZaloProxyItem) => {
      openDeleteConfirm([proxy.id]);
    },
    [openDeleteConfirm],
  );

  const handleBuyProxy = useCallback(() => {
    if (!user) {
      toast.error("Không tìm thấy thông tin người dùng.");
      return;
    }

    const params = new URLSearchParams({ username: user.username });
    if (user.email) params.set("email", user.email);
    if (user.phone) params.set("phone_number", user.phone);
    if (user.name) params.set("fullname", user.name);

    window.open(
      `https://v4.tongkhoproxy.com/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [user]);

  const handleSaveForm = async () => {
    if (editingProxy) {
      if (
        !(await confirm({
          title: "Cập nhật proxy",
          message:
            "Sau khi lưu có thể ảnh hưởng các tài khoản đang dùng proxy này.",
          description: "Bạn chắc chắn muốn sửa proxy này?",
          confirmText: "Lưu thay đổi",
          variant: "warning",
        }))
      ) {
        return;
      }
      const success = await updateProxy();
      if (success) closeForm();
      return;
    }

    const success = await createProxies();
    if (success) closeForm();
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProxies(deleteConfirm.ids);
  };

  return (
    <div className={adminDataPageClass}>
      <PageBreadcrumb
        pageTitle="Quản lý Proxy"
        showPageTitle={false}
        className="!mb-0"
        parents={[
          { label: "Quản lý tài khoản Zalo", href: "/zalo-accounts" },
        ]}
      />

      <ComponentCard fill>
        <div className="shrink-0 space-y-4">
          <div>
            <h2 className="text-base font-medium text-gray-800 dark:text-white/90">
              Quản lý Proxy
            </h2>
            <p className="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">
              Thêm, kiểm tra, cập nhật hạn dùng và ghi chú proxy Zalo.
            </p>
          </div>

          <ZaloProxiesToolbar
            search={search}
            selectedCount={selectedIds.length}
            isChecking={Boolean(checkTaskId)}
            onSearchChange={setSearch}
            onAdd={openCreateForm}
            onCheck={() => void checkProxies(selectedIds)}
            onDelete={() => {
              if (!selectedIds.length) {
                toast.error("Chọn ít nhất 1 proxy để xóa.");
                return;
              }
              openDeleteConfirm(selectedIds);
            }}
            onBuy={handleBuyProxy}
          />

          {error && <Alert variant="error" title="Lỗi" message={error} />}
        </div>

        <div className="mt-4 flex h-0 min-h-0 flex-1 flex-col overflow-hidden border-t border-gray-100 pt-4 dark:border-gray-800">
          <ScrollableTableContainer fill>
            <div className="min-w-[900px]">
              <ZaloProxiesTable
                proxies={filteredProxies}
                selectedIds={selectedIds}
                checkingIds={checkingIds}
                isLoading={isLoading}
                onToggleAll={handleToggleAll}
                onToggleOne={toggleSelect}
                onEdit={openEditForm}
                onDelete={handleDeleteProxy}
              />
            </div>
          </ScrollableTableContainer>
        </div>
      </ComponentCard>

      <ZaloProxyFormModal
        isOpen={isFormOpen}
        editingProxy={editingProxy}
        proxyInput={proxyInput}
        noteInput={noteInput}
        expirationInput={expirationInput}
        isSaving={isSaving}
        onProxyInputChange={setProxyInput}
        onNoteInputChange={setNoteInput}
        onExpirationInputChange={setExpirationInput}
        onClose={closeForm}
        onSave={() => void handleSaveForm()}
      />

      <ZaloProxyDeleteModal
        isOpen={Boolean(deleteConfirm)}
        count={deleteConfirm?.ids.length ?? 0}
        isDeleting={deletingId !== null}
        onClose={closeDeleteConfirm}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}