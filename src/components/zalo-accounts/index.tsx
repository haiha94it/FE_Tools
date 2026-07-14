"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import { toast } from "@/lib/toast";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import {
  getLoginQrResultToast,
  isTotalMessagesOn,
  isZaloAccountActive,
} from "@/lib/zalo-account-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  useFilteredZaloAccounts,
  useZaloAccountStore,
} from "@/stores/use-zalo-account-store";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import type { WsMessagePayload } from "@/types/websocket";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import AddAccountDialog from "./AddAccountDialog";
import DeleteConfirmModal from "./DeleteConfirmModal";
import EditAccountModal from "./EditAccountModal";
import ZaloAccountsMetrics from "./ZaloAccountsMetrics";
import ZaloAccountsTable from "./ZaloAccountsTable";
import ZaloAccountsToolbar from "./ZaloAccountsToolbar";

function handleLoginQrMessage(
  message: WsMessagePayload,
  actions: {
    setQrImage: (v: string | null) => void;
    setQrCountdown: (v: number) => void;
    closeQr: () => void;
    fetchAccounts: () => Promise<void>;
    isRelogin: boolean;
  },
) {
  if (message.type !== "login_qr") return;

  if (typeof message.qr === "string" && message.qr) {
    actions.setQrImage(message.qr);
    actions.setQrCountdown(60);
    return;
  }

  if (message.error) {
    toast.error(String(message.error));
    actions.closeQr();
    return;
  }

  if (message.result !== undefined) {
    const { type, message: toastMessage } = getLoginQrResultToast(
      message.result,
      actions.isRelogin,
    );
    actions.closeQr();
    if (type === "success") {
      toast.success(toastMessage);
    } else {
      toast.warning(toastMessage);
    }
    void actions.fetchAccounts();
  }
}

export default function ZaloAccountsView() {
  const router = useRouter();
  const accounts = useZaloAccountStore((s) => s.accounts);
  const filteredAccounts = useFilteredZaloAccounts();
  const selectedIds = useZaloAccountStore((s) => s.selectedIds);
  const search = useZaloAccountStore((s) => s.search);
  const showSensitiveInfo = useZaloAccountStore((s) => s.showSensitiveInfo);
  const isLoading = useZaloAccountStore((s) => s.isLoading);
  const error = useZaloAccountStore((s) => s.error);
  const checkingIds = useZaloAccountStore((s) => s.checkingIds);
  const checkTaskId = useZaloAccountStore((s) => s.checkTaskId);
  const editingAccountId = useZaloAccountStore((s) => s.editingAccountId);
  const deletingAccountId = useZaloAccountStore((s) => s.deletingAccountId);

  const isEditOpen = useZaloAccountStore((s) => s.isEditOpen);
  const editAccount = useZaloAccountStore((s) => s.editAccount);
  const editNote = useZaloAccountStore((s) => s.editNote);
  const editPassword = useZaloAccountStore((s) => s.editPassword);
  const editProxyId = useZaloAccountStore((s) => s.editProxyId);
  const proxies = useZaloAccountStore((s) => s.proxies);
  const isLoadingProxies = useZaloAccountStore((s) => s.isLoadingProxies);

  const isQrOpen = useZaloAccountStore((s) => s.isQrOpen);
  const qrImage = useZaloAccountStore((s) => s.qrImage);
  const qrCountdown = useZaloAccountStore((s) => s.qrCountdown);
  const qrProxy = useZaloAccountStore((s) => s.qrProxy);
  const qrAccountId = useZaloAccountStore((s) => s.qrAccountId);
  const cookieTaskId = useZaloAccountStore((s) => s.cookieTaskId);
  const cookieLoading = useZaloAccountStore((s) => s.cookieLoading);
  const loadingToggleAllMessage = useZaloAccountStore(
    (s) => s.loadingToggleAllMessage,
  );
  const loadingToggleMessageId = useZaloAccountStore(
    (s) => s.loadingToggleMessageId,
  );
  const deleteConfirm = useZaloAccountStore((s) => s.deleteConfirm);

  const fetchAccounts = useZaloAccountStore((s) => s.fetchAccounts);
  const editAccountAction = useZaloAccountStore((s) => s.editAccountAction);
  const deleteAccounts = useZaloAccountStore((s) => s.deleteAccounts);
  const checkAccounts = useZaloAccountStore((s) => s.checkAccounts);
  const pollCheckResult = useZaloAccountStore((s) => s.pollCheckResult);
  const createByCookie = useZaloAccountStore((s) => s.createByCookie);
  const pollCookieResult = useZaloAccountStore((s) => s.pollCookieResult);
  const toggleAllMessageListener = useZaloAccountStore(
    (s) => s.toggleAllMessageListener,
  );
  const toggleAccountMessageListener = useZaloAccountStore(
    (s) => s.toggleAccountMessageListener,
  );
  const setSearch = useZaloAccountStore((s) => s.setSearch);
  const setShowSensitiveInfo = useZaloAccountStore(
    (s) => s.setShowSensitiveInfo,
  );
  const toggleSelect = useZaloAccountStore((s) => s.toggleSelect);
  const toggleSelectAll = useZaloAccountStore((s) => s.toggleSelectAll);

  const openEdit = useZaloAccountStore((s) => s.openEdit);
  const closeEdit = useZaloAccountStore((s) => s.closeEdit);
  const setEditNote = useZaloAccountStore((s) => s.setEditNote);
  const setEditPassword = useZaloAccountStore((s) => s.setEditPassword);
  const setEditProxyId = useZaloAccountStore((s) => s.setEditProxyId);

  const openCreateQr = useZaloAccountStore((s) => s.openCreateQr);
  const openReloginQr = useZaloAccountStore((s) => s.openReloginQr);
  const closeQr = useZaloAccountStore((s) => s.closeQr);
  const setQrImage = useZaloAccountStore((s) => s.setQrImage);
  const setQrCountdown = useZaloAccountStore((s) => s.setQrCountdown);
  const setQrProxy = useZaloAccountStore((s) => s.setQrProxy);

  const openDeleteConfirm = useZaloAccountStore((s) => s.openDeleteConfirm);
  const closeDeleteConfirm = useZaloAccountStore((s) => s.closeDeleteConfirm);

  const wsSend = useWebSocketStore((s) => s.send);
  const wsSubscribe = useWebSocketStore((s) => s.subscribe);
  const wsStatus = useWebSocketStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const canSkipProxy = canSkipZaloProxyRequirement(user);

  const activeCount = accounts.filter(isZaloAccountActive).length;

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!checkTaskId) return;
    const interval = window.setInterval(() => {
      void pollCheckResult();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [checkTaskId, pollCheckResult]);

  useEffect(() => {
    if (!cookieTaskId) return;

    const poll = async () => {
      const result = await pollCookieResult();
      if (result === "success") {
        toast.success("Đã thêm tài khoản Zalo bằng cookie.");
        closeQr();
      } else if (result === "failure") {
        toast.error("Thêm tài khoản bằng cookie thất bại.");
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [cookieTaskId, closeQr, pollCookieResult]);

  useEffect(() => {
    const wsActions = {
      setQrImage,
      setQrCountdown,
      closeQr,
      fetchAccounts,
    };

    return wsSubscribe((payload) => {
      handleLoginQrMessage(payload, {
        ...wsActions,
        isRelogin: Boolean(useZaloAccountStore.getState().qrAccountId),
      });
    });
  }, [wsSubscribe, setQrImage, setQrCountdown, closeQr, fetchAccounts]);

  useEffect(() => {
    if (!isQrOpen || !qrImage || qrCountdown <= 0) return;

    const timer = window.setInterval(() => {
      const current = useZaloAccountStore.getState().qrCountdown;
      useZaloAccountStore.getState().setQrCountdown(Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isQrOpen, qrImage, qrCountdown]);

  const handleSendQr = useCallback(() => {
    if (wsStatus !== "connected") {
      toast.error("WebSocket chưa kết nối. Vui lòng tải lại trang.");
      return;
    }

    const proxy = qrProxy.trim();
    if (!canSkipProxy && !proxy) {
      toast.error("Vui lòng nhập proxy trước khi lấy mã QR.");
      return;
    }

    const payload = qrAccountId
      ? {
          command: "login_qr",
          id_account: qrAccountId,
          ...(proxy ? { proxy } : {}),
        }
      : proxy
        ? { command: "login_qr", proxy }
        : { command: "login_qr" };

    setQrImage(null);
    setQrCountdown(60);

    const sent = wsSend(payload);
    if (!sent) {
      toast.error("Không gửi được lệnh QR. Vui lòng thử lại.");
    }
  }, [
    canSkipProxy,
    wsStatus,
    qrProxy,
    qrAccountId,
    setQrImage,
    setQrCountdown,
    wsSend,
  ]);

  const handleSaveEdit = async () => {
    if (!editAccount) return;
    if (!canSkipProxy && !editProxyId) {
      toast.error("Vui lòng chọn proxy trước khi lưu.");
      return;
    }

    const success = await editAccountAction({
      id: editAccount.id,
      ...(editProxyId != null ? { id_proxy: editProxyId } : {}),
      note: editNote,
      password: editPassword,
    });
    if (success) closeEdit();
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteAccounts(deleteConfirm.ids);
  };

  const filteredIds = useMemo(
    () => filteredAccounts.map((a) => a.id),
    [filteredAccounts],
  );

  const handleToggleAll = useCallback(() => {
    toggleSelectAll(filteredIds);
  }, [toggleSelectAll, filteredIds]);

  const handleToggleMessage = useCallback(
    (accountId: number, checked: boolean) => {
      void toggleAccountMessageListener(accountId, checked);
    },
    [toggleAccountMessageListener],
  );

  const handleDeleteAccount = useCallback(
    (account: { id: number }) => {
      openDeleteConfirm([account.id]);
    },
    [openDeleteConfirm],
  );

  return (
    <div>
      <PageBreadcrumb pageTitle="Quản lý tài khoản Zalo" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <ComponentCard
            title="Danh sách tài khoản"
            desc="Quản lý tài khoản Zalo đã kết nối — thêm, kiểm tra, sửa, xóa."
            hideDescOnMobile
          >
            <div className="mb-3 border-b border-gray-100 pb-3 sm:mb-4 sm:pb-4 dark:border-gray-800">
              <ZaloAccountsMetrics
                total={accounts.length}
                active={activeCount}
                inactive={accounts.length - activeCount}
                selected={selectedIds.length}
              />
            </div>

            <ZaloAccountsToolbar
              search={search}
              showSensitiveInfo={showSensitiveInfo}
              isTotalMessagesOn={isTotalMessagesOn(accounts)}
              isLoadingToggleAllMessage={loadingToggleAllMessage}
              isChecking={Boolean(checkTaskId)}
              selectedCount={selectedIds.length}
              onSearchChange={setSearch}
              onToggleSensitive={setShowSensitiveInfo}
              onToggleAllMessages={(checked) =>
                void toggleAllMessageListener(checked)
              }
              onAdd={openCreateQr}
              onCheck={() => void checkAccounts(selectedIds)}
              onManageContacts={() => {
                const query =
                  selectedIds.length === 1
                    ? `?accountId=${selectedIds[0]}`
                    : "";
                router.push(`/zalo-accounts/contacts${query}`);
              }}
              onManageProxy={() => router.push("/zalo-accounts/proxy")}
              onDelete={() => {
                if (!selectedIds.length) {
                  toast.error("Chọn ít nhất 1 tài khoản để xóa.");
                  return;
                }
                openDeleteConfirm(selectedIds);
              }}
            />

            {error && (
              <div className="mt-4">
                <Alert variant="error" title="Lỗi" message={error} />
              </div>
            )}

            <div className="mt-6">
              <ZaloAccountsTable
                accounts={filteredAccounts}
                selectedIds={selectedIds}
                checkingIds={checkingIds}
                loadingToggleMessageId={loadingToggleMessageId}
                showSensitiveInfo={showSensitiveInfo}
                isLoading={isLoading}
                onToggleAll={handleToggleAll}
                onToggleOne={toggleSelect}
                onToggleMessage={handleToggleMessage}
                onEdit={openEdit}
                onRelogin={openReloginQr}
                onDelete={handleDeleteAccount}
              />
            </div>
          </ComponentCard>
        </div>
      </div>

      <EditAccountModal
        isOpen={isEditOpen}
        account={editAccount}
        note={editNote}
        password={editPassword}
        proxyId={editProxyId}
        proxies={proxies}
        isLoadingProxies={isLoadingProxies}
        isSaving={editingAccountId !== null}
        canSkipProxy={canSkipProxy}
        onNoteChange={setEditNote}
        onPasswordChange={setEditPassword}
        onProxyChange={setEditProxyId}
        onClose={closeEdit}
        onSave={() => void handleSaveEdit()}
      />

      <AddAccountDialog
        isOpen={isQrOpen}
        isRelogin={Boolean(qrAccountId)}
        qrProxy={qrProxy}
        qrImage={qrImage}
        qrCountdown={qrCountdown}
        cookieLoading={cookieLoading}
        cookieTaskId={cookieTaskId}
        canSkipProxy={canSkipProxy}
        onClose={closeQr}
        onQrProxyChange={setQrProxy}
        onSendQr={handleSendQr}
        onSubmitCookie={(payload) => void createByCookie(payload)}
      />

      <DeleteConfirmModal
        isOpen={Boolean(deleteConfirm)}
        count={deleteConfirm?.ids.length ?? 0}
        isDeleting={deletingAccountId !== null}
        onClose={closeDeleteConfirm}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}