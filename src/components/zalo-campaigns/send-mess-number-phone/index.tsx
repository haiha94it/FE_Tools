"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloSendMessPhoneCampaignService } from "@/services/zalo-send-mess-phone-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloSendMessPhoneCampaignStore } from "@/stores/use-zalo-send-mess-phone-campaign-store";
import type { SendMessPhoneCampaign } from "@/types/zalo-send-mess-phone-campaign";
import type { SendMessPhoneCampaignDetail } from "@/types/zalo-send-mess-phone-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import SendMessPhoneCampaignFormModal from "./SendMessPhoneCampaignFormModal";
import SendMessPhoneResultsModal from "./SendMessPhoneResultsModal";
import SendMessPhoneCampaignTable from "./SendMessPhoneCampaignTable";
import SendMessPhoneCampaignToolbar from "./SendMessPhoneCampaignToolbar";

export default function SendMessPhoneCampaignView() {
  const campaigns = useZaloSendMessPhoneCampaignStore((s) => s.campaigns);
  const accounts = useZaloSendMessPhoneCampaignStore((s) => s.accounts);
  const selectedIds = useZaloSendMessPhoneCampaignStore((s) => s.selectedIds);
  const loading = useZaloSendMessPhoneCampaignStore((s) => s.loading);
  const accountsLoading = useZaloSendMessPhoneCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloSendMessPhoneCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloSendMessPhoneCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloSendMessPhoneCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloSendMessPhoneCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloSendMessPhoneCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloSendMessPhoneCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloSendMessPhoneCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloSendMessPhoneCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloSendMessPhoneCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloSendMessPhoneCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloSendMessPhoneCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloSendMessPhoneCampaignStore((s) => s.openResults);
  const closeResults = useZaloSendMessPhoneCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<SendMessPhoneCampaignDetail | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_mess_phone_number") {
        void fetchCampaigns({ silent: true });
        const state = useZaloSendMessPhoneCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: SendMessPhoneCampaign) => {
    try {
      const loaded = await zaloSendMessPhoneCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded);
      setFormOpen(true);
    } catch {
      setEditingCampaign(null);
      setFormOpen(true);
    }
  }, []);

  const handleCopy = async (campaign: SendMessPhoneCampaign) => {
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

  const handleDelete = async (campaign: SendMessPhoneCampaign) => {
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
        pageTitle="Nhắn tin đến SĐT"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/send-mess-number-phone" },
        ]}
      />

      <ComponentCard
        title="Chiến dịch nhắn tin đến số điện thoại"
        desc="Gửi tin tự động tới số điện thoại theo kịch bản"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <SendMessPhoneCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <SendMessPhoneCampaignTable
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

      <SendMessPhoneCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <SendMessPhoneResultsModal
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
            Khuyến nghị thời gian chờ tối thiểu 350 giây và số lượt gửi 50/ngày. Nhắn tin quá
            nhanh dễ bị hạn chế tài khoản. Có thể chọn nhiều tài khoản và chia đều danh sách
            SĐT khi chạy kịch bản.
          </p>
        </div>
      </Modal>
    </div>
  );
}