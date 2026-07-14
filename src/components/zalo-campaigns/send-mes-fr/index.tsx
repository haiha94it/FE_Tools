"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloSendMesFrCampaignService } from "@/services/zalo-send-mes-fr-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloSendMesFrCampaignStore } from "@/stores/use-zalo-send-mes-fr-campaign-store";
import type { SendMesFrCampaign } from "@/types/zalo-send-mes-fr-campaign";
import type { SendMesFrCampaignDetail } from "@/types/zalo-send-mes-fr-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCampaignTeamHandlers } from "@/components/zalo-campaigns/shared/useCampaignTeamHandlers";
import SendMesFrCampaignFormModal from "./SendMesFrCampaignFormModal";
import SendMesFrResultsModal from "./SendMesFrResultsModal";
import SendMesFrCampaignTable from "./SendMesFrCampaignTable";
import SendMesFrCampaignToolbar from "./SendMesFrCampaignToolbar";

export default function SendMesFrCampaignView() {
  const campaigns = useZaloSendMesFrCampaignStore((s) => s.campaigns);
  const accounts = useZaloSendMesFrCampaignStore((s) => s.accounts);
  const selectedIds = useZaloSendMesFrCampaignStore((s) => s.selectedIds);
  const loading = useZaloSendMesFrCampaignStore((s) => s.loading);
  const accountsLoading = useZaloSendMesFrCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloSendMesFrCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloSendMesFrCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloSendMesFrCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloSendMesFrCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloSendMesFrCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloSendMesFrCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloSendMesFrCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloSendMesFrCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloSendMesFrCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloSendMesFrCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloSendMesFrCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloSendMesFrCampaignStore((s) => s.openResults);
  const closeResults = useZaloSendMesFrCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SendMesFrCampaignDetail | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  const { guardAccess, getFormReadOnly } = useCampaignTeamHandlers<SendMesFrCampaign>();

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_mess_friend") {
        void fetchCampaigns({ silent: true });
        const state = useZaloSendMesFrCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: SendMesFrCampaign) => {
    if (!guardAccess(campaign, "edit")) return;
    try {
      const loaded = await zaloSendMesFrCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded);
      setFormOpen(true);
    } catch {
      setEditingCampaign(null);
      setFormOpen(true);
    }
  }, [guardAccess]);

  const handleCopy = async (campaign: SendMesFrCampaign) => {
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

  const handleDelete = async (campaign: SendMesFrCampaign) => {
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
        pageTitle="Nhắn tin bạn bè"
        parents={[{ label: "Chiến dịch", href: "/zalo-campaigns/send-mes-fr" }]}
      />

      <ComponentCard
        title="Chiến dịch nhắn tin cho bạn bè"
        desc="Gửi tin tự động tới bạn bè Zalo theo kịch bản"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <SendMesFrCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <SendMesFrCampaignTable
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

      <SendMesFrCampaignFormModal
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

      <SendMesFrResultsModal
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
            Mỗi kịch bản gắn với một tài khoản Zalo. Khuyến nghị thời gian chờ 180 giây trở
            lên và số lượt gửi 20/ngày. Hệ thống tự tạm dừng khi tài khoản bị hạn chế.
          </p>
        </div>
      </Modal>
    </div>
  );
}