"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloAddFriendCampaignService } from "@/services/zalo-add-friend-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloAddFriendCampaignStore } from "@/stores/use-zalo-add-friend-campaign-store";
import type { AddFriendCampaign } from "@/types/zalo-add-friend-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddFriendCampaignFormModal from "./AddFriendCampaignFormModal";
import AddFriendCampaignResultsModal from "./AddFriendCampaignResultsModal";
import AddFriendCampaignTable from "./AddFriendCampaignTable";
import AddFriendCampaignToolbar from "./AddFriendCampaignToolbar";

export default function AddFriendCampaignView() {
  const campaigns = useZaloAddFriendCampaignStore((s) => s.campaigns);
  const accounts = useZaloAddFriendCampaignStore((s) => s.accounts);
  const selectedIds = useZaloAddFriendCampaignStore((s) => s.selectedIds);
  const loading = useZaloAddFriendCampaignStore((s) => s.loading);
  const accountsLoading = useZaloAddFriendCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloAddFriendCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloAddFriendCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloAddFriendCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloAddFriendCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloAddFriendCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloAddFriendCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloAddFriendCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloAddFriendCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloAddFriendCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloAddFriendCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloAddFriendCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloAddFriendCampaignStore((s) => s.openResults);
  const closeResults = useZaloAddFriendCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AddFriendCampaign | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_add_friend") {
        void fetchCampaigns({ silent: true });
        const state = useZaloAddFriendCampaignStore.getState();
        if (state.resultsOpen) {
          void state.refreshResults({ silent: true });
        }
      }
    });
    return unsubscribe;
  }, [fetchCampaigns]);

  const resultsCampaignName = useMemo(() => {
    if (!resultsCampaignId) return "";
    return campaigns.find((item) => item.id === resultsCampaignId)?.name ?? "";
  }, [campaigns, resultsCampaignId]);

  const openCreate = () => {
    setEditingCampaign(null);
    setFormOpen(true);
  };

  const openEdit = useCallback(async (campaign: AddFriendCampaign) => {
    try {
      const loaded = await zaloAddFriendCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded ?? campaign);
      setFormOpen(true);
    } catch {
      setEditingCampaign(campaign);
      setFormOpen(true);
    }
  }, []);

  const handleCopy = async (campaign: AddFriendCampaign) => {
    const name = await prompt({
      title: "Sao chép kịch bản",
      message: "Nhập tên kịch bản mới",
      defaultValue: `${campaign.name} (copy)`,
      placeholder: "Tên kịch bản",
      confirmText: "Sao chép",
    });
    if (name === null) return;
    if (!name.trim()) {
      toast.error("Tên kịch bản không được để trống.");
      return;
    }
    try {
      await copyCampaign(campaign.id, name.trim());
      toast.success("Đã sao chép kịch bản.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (campaign: AddFriendCampaign) => {
    if (
      !(await confirm({
        title: "Xóa kịch bản",
        message: `Xóa kịch bản "${campaign.name}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteCampaign(campaign.id);
      toast.success("Đã xóa kịch bản.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRun = async (type: "new" | "continue") => {
    try {
      await startCampaigns(type);
      toast.success(type === "new" ? "Chiến dịch bắt đầu chạy." : "Chiến dịch tiếp tục chạy.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaigns();
      toast.success("Dừng chiến dịch thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle="Kết bạn"
        parents={[{ label: "Chiến dịch", href: "/zalo-campaigns/add-friend" }]}
      />

      <ComponentCard
        title="Chiến dịch kết bạn"
        desc="Tạo kịch bản, chọn tài khoản Zalo và gửi lời mời kết bạn theo danh sách số điện thoại"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <AddFriendCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
          <AddFriendCampaignTable
            campaigns={campaigns}
            selectedIds={selectedIds}
            loading={loading}
            actionLoading={actionLoading}
            onToggleAll={toggleSelectAll}
            onToggleOne={toggleSelected}
            onEdit={(campaign) => void openEdit(campaign)}
            onCopy={(campaign) => void handleCopy(campaign)}
            onResults={(campaign) => void openResults(campaign.id)}
            onDelete={(campaign) => void handleDelete(campaign)}
          />
          </div>
        </div>
      </ComponentCard>

      <AddFriendCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <AddFriendCampaignResultsModal
        open={resultsOpen}
        accounts={accounts}
        campaignName={resultsCampaignName}
        onClose={closeResults}
      />

      <Modal
        isOpen={noteOpen}
        onClose={() => setNoteOpen(false)}
        className="max-w-lg"
        showCloseButton
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ghi chú quan trọng
          </h3>
          <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            Chiến dịch sẽ tự động tạm dừng khi tài khoản Zalo bị hạn chế. Trạng thái
            &quot;Dừng do bị hạn chế&quot; nghĩa là nick đã bị Zalo giới hạn — cần
            kiểm tra tài khoản trước khi chạy tiếp.
          </p>
        </div>
      </Modal>
    </div>
  );
}