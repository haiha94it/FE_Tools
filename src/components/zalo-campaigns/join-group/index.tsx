"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloJoinGroupCampaignService } from "@/services/zalo-join-group-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloJoinGroupCampaignStore } from "@/stores/use-zalo-join-group-campaign-store";
import type { JoinGroupCampaign } from "@/types/zalo-join-group-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import JoinGroupCampaignFormModal from "./JoinGroupCampaignFormModal";
import JoinGroupCampaignResultsModal from "./JoinGroupCampaignResultsModal";
import JoinGroupCampaignTable from "./JoinGroupCampaignTable";
import JoinGroupCampaignToolbar from "./JoinGroupCampaignToolbar";

export default function JoinGroupCampaignView() {
  const campaigns = useZaloJoinGroupCampaignStore((s) => s.campaigns);
  const accounts = useZaloJoinGroupCampaignStore((s) => s.accounts);
  const selectedIds = useZaloJoinGroupCampaignStore((s) => s.selectedIds);
  const loading = useZaloJoinGroupCampaignStore((s) => s.loading);
  const accountsLoading = useZaloJoinGroupCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloJoinGroupCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloJoinGroupCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloJoinGroupCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloJoinGroupCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloJoinGroupCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloJoinGroupCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloJoinGroupCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloJoinGroupCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloJoinGroupCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloJoinGroupCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloJoinGroupCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloJoinGroupCampaignStore((s) => s.openResults);
  const closeResults = useZaloJoinGroupCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<JoinGroupCampaign | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_join_group") {
        void fetchCampaigns({ silent: true });
        const state = useZaloJoinGroupCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: JoinGroupCampaign) => {
    try {
      const loaded = await zaloJoinGroupCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded ?? campaign);
      setFormOpen(true);
    } catch {
      setEditingCampaign(campaign);
      setFormOpen(true);
    }
  }, []);

  const handleCopy = async (campaign: JoinGroupCampaign) => {
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

  const handleDelete = async (campaign: JoinGroupCampaign) => {
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
        pageTitle="Tham gia nhóm"
        parents={[{ label: "Chiến dịch", href: "/zalo-campaigns/join-group" }]}
      />

      <ComponentCard
        title="Chiến dịch tham gia nhóm"
        desc="Tạo kịch bản, chọn tài khoản Zalo và tham gia nhóm theo danh sách link"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <JoinGroupCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <JoinGroupCampaignTable
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

      <JoinGroupCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <JoinGroupCampaignResultsModal
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
            Nên để thời gian chờ tối thiểu 60 giây, khuyến khích 180 giây trở lên
            để tránh bị Zalo hạn chế. Số lượt tham gia trong ngày khuyến nghị là
            10. Chiến dịch tự tạm dừng khi tài khoản bị hạn chế.
          </p>
        </div>
      </Modal>
    </div>
  );
}