"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloSendMesGroupCampaignService } from "@/services/zalo-send-mes-group-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloSendMesGroupCampaignStore } from "@/stores/use-zalo-send-mes-group-campaign-store";
import type { SendMesGroupCampaign } from "@/types/zalo-send-mes-group-campaign";
import type { SendMesGroupCampaignDetail } from "@/types/zalo-send-mes-group-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import SendMesGroupCampaignFormModal from "./SendMesGroupCampaignFormModal";
import SendMesGroupResultsModal from "./SendMesGroupResultsModal";
import SendMesGroupCampaignTable from "./SendMesGroupCampaignTable";
import SendMesGroupCampaignToolbar from "./SendMesGroupCampaignToolbar";

export default function SendMesGroupCampaignView() {
  const campaigns = useZaloSendMesGroupCampaignStore((s) => s.campaigns);
  const accounts = useZaloSendMesGroupCampaignStore((s) => s.accounts);
  const selectedIds = useZaloSendMesGroupCampaignStore((s) => s.selectedIds);
  const loading = useZaloSendMesGroupCampaignStore((s) => s.loading);
  const accountsLoading = useZaloSendMesGroupCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloSendMesGroupCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloSendMesGroupCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloSendMesGroupCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloSendMesGroupCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloSendMesGroupCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloSendMesGroupCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloSendMesGroupCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloSendMesGroupCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloSendMesGroupCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloSendMesGroupCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloSendMesGroupCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloSendMesGroupCampaignStore((s) => s.openResults);
  const closeResults = useZaloSendMesGroupCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SendMesGroupCampaignDetail | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_mess_group") {
        void fetchCampaigns({ silent: true });
        const state = useZaloSendMesGroupCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: SendMesGroupCampaign) => {
    try {
      const loaded = await zaloSendMesGroupCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded);
      setFormOpen(true);
    } catch {
      setEditingCampaign(null);
      setFormOpen(true);
    }
  }, []);

  const handleCopy = async (campaign: SendMesGroupCampaign) => {
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

  const handleDelete = async (campaign: SendMesGroupCampaign) => {
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
        pageTitle="Nhắn tin vào nhóm"
        parents={[{ label: "Chiến dịch", href: "/zalo-campaigns/send-mes-group" }]}
      />

      <ComponentCard
        title="Chiến dịch nhắn tin vào nhóm Zalo"
        desc="Gửi tin tự động vào các nhóm theo kịch bản"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <SendMesGroupCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <SendMesGroupCampaignTable
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

      <SendMesGroupCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <SendMesGroupResultsModal
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
            Mỗi kịch bản gắn với một tài khoản Zalo. Khuyến nghị thời gian chờ 180 giây trở lên
            và số lượt gửi 20/ngày. Bật &quot;Tag @All&quot; để tag toàn bộ thành viên nhóm.
            &quot;Vòng lặp&quot; cho phép chạy lại danh sách nhóm sau khi hoàn thành.
          </p>
        </div>
      </Modal>
    </div>
  );
}