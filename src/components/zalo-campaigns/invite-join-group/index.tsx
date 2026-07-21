"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloInviteJoinGroupCampaignService } from "@/services/zalo-invite-join-group-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloInviteJoinGroupCampaignStore } from "@/stores/use-zalo-invite-join-group-campaign-store";
import type { InviteJoinGroupCampaign } from "@/types/zalo-invite-join-group-campaign";
import { useCampaignResultsAutoRefresh } from "@/hooks/use-campaign-results-auto-refresh";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCampaignTeamHandlers } from "@/components/zalo-campaigns/shared/useCampaignTeamHandlers";
import InviteJoinGroupCampaignFormModal from "./InviteJoinGroupCampaignFormModal";
import InviteJoinGroupCampaignResultsModal from "./InviteJoinGroupCampaignResultsModal";
import InviteJoinGroupCampaignTable from "./InviteJoinGroupCampaignTable";
import InviteJoinGroupCampaignToolbar from "./InviteJoinGroupCampaignToolbar";

export default function InviteJoinGroupCampaignView() {
  const campaigns = useZaloInviteJoinGroupCampaignStore((s) => s.campaigns);
  const accounts = useZaloInviteJoinGroupCampaignStore((s) => s.accounts);
  const selectedIds = useZaloInviteJoinGroupCampaignStore((s) => s.selectedIds);
  const loading = useZaloInviteJoinGroupCampaignStore((s) => s.loading);
  const accountsLoading = useZaloInviteJoinGroupCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloInviteJoinGroupCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloInviteJoinGroupCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloInviteJoinGroupCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloInviteJoinGroupCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloInviteJoinGroupCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloInviteJoinGroupCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloInviteJoinGroupCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloInviteJoinGroupCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloInviteJoinGroupCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloInviteJoinGroupCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloInviteJoinGroupCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloInviteJoinGroupCampaignStore((s) => s.openResults);
  const closeResults = useZaloInviteJoinGroupCampaignStore((s) => s.closeResults);
  const refreshResults = useZaloInviteJoinGroupCampaignStore((s) => s.refreshResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<InviteJoinGroupCampaign | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  const { guardAccess, getFormReadOnly } =
    useCampaignTeamHandlers<InviteJoinGroupCampaign>();

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_invite_join_group") {
        void fetchCampaigns({ silent: true });
        const state = useZaloInviteJoinGroupCampaignStore.getState();
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

  const resultsCampaignStatus = useMemo(() => {
    if (!resultsCampaignId) return null;
    return campaigns.find((item) => item.id === resultsCampaignId)?.status ?? null;
  }, [campaigns, resultsCampaignId]);

  useCampaignResultsAutoRefresh({
    enabled: resultsOpen,
    isRunning: resultsCampaignStatus === 1,
    refreshResults,
  });

  const openCreate = () => {
    setEditingCampaign(null);
    setFormOpen(true);
  };

  const openEdit = useCallback(async (campaign: InviteJoinGroupCampaign) => {
    if (!guardAccess(campaign, "edit")) return;
    try {
      const loaded = await zaloInviteJoinGroupCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded ?? campaign);
      setFormOpen(true);
    } catch {
      setEditingCampaign(campaign);
      setFormOpen(true);
    }
  }, [guardAccess]);

  const handleCopy = async (campaign: InviteJoinGroupCampaign) => {
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

  const handleDelete = async (campaign: InviteJoinGroupCampaign) => {
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
        pageTitle="Mời bạn vào nhóm"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/invite-join-group" },
        ]}
      />

      <ComponentCard
        title="Chiến dịch mời bạn bè tham gia nhóm"
        desc="Chọn tài khoản, nhóm Zalo và mời bạn bè vào nhóm"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <InviteJoinGroupCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <InviteJoinGroupCampaignTable
              campaigns={campaigns}
              selectedIds={selectedIds}
              loading={loading}
              actionLoading={actionLoading}
              onToggleAll={toggleSelectAll}
              onToggleOne={toggleSelected}
              onEdit={(campaign) => void openEdit(campaign)}
              onCopy={(campaign) => void handleCopy(campaign)}
              onResults={(campaign) => {
                if (!guardAccess(campaign, "results")) return;
                void openResults(campaign.id);
              }}
              onDelete={(campaign) => void handleDelete(campaign)}
            />
          </div>
        </div>
      </ComponentCard>

      <InviteJoinGroupCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        readOnly={getFormReadOnly(editingCampaign)}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <InviteJoinGroupCampaignResultsModal
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
            Mỗi kịch bản gắn với một tài khoản Zalo. Khuyến nghị thời gian chờ
            180 giây trở lên và số lượt mời 10/ngày. Chiến dịch tự tạm dừng khi
            tài khoản bị hạn chế.
          </p>
        </div>
      </Modal>
    </div>
  );
}