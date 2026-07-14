"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloSendMessMemberGrCampaignService } from "@/services/zalo-send-mess-member-gr-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloSendMessMemberGrCampaignStore } from "@/stores/use-zalo-send-mess-member-gr-campaign-store";
import type {
  SendMessMemberGrCampaign,
  SendMessMemberGrCampaignDetail,
} from "@/types/zalo-send-mess-member-gr-campaign";
import { useCallback, useEffect, useMemo, useState } from "react";
import SendMessMemberGrCampaignFormModal from "./SendMessMemberGrCampaignFormModal";
import SendMessMemberGrResultsModal from "./SendMessMemberGrResultsModal";
import SendMessMemberGrCampaignTable from "./SendMessMemberGrCampaignTable";
import SendMessMemberGrCampaignToolbar from "./SendMessMemberGrCampaignToolbar";

export default function SendMessMemberGrCampaignView() {
  const campaigns = useZaloSendMessMemberGrCampaignStore((s) => s.campaigns);
  const accounts = useZaloSendMessMemberGrCampaignStore((s) => s.accounts);
  const selectedIds = useZaloSendMessMemberGrCampaignStore((s) => s.selectedIds);
  const loading = useZaloSendMessMemberGrCampaignStore((s) => s.loading);
  const accountsLoading = useZaloSendMessMemberGrCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloSendMessMemberGrCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloSendMessMemberGrCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloSendMessMemberGrCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloSendMessMemberGrCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloSendMessMemberGrCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloSendMessMemberGrCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloSendMessMemberGrCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloSendMessMemberGrCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloSendMessMemberGrCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloSendMessMemberGrCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloSendMessMemberGrCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloSendMessMemberGrCampaignStore((s) => s.openResults);
  const closeResults = useZaloSendMessMemberGrCampaignStore((s) => s.closeResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<SendMessMemberGrCampaignDetail | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_mess_mem_group") {
        void fetchCampaigns({ silent: true });
        const state = useZaloSendMessMemberGrCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: SendMessMemberGrCampaign) => {
    try {
      const loaded = await zaloSendMessMemberGrCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded);
      setFormOpen(true);
    } catch {
      setEditingCampaign(null);
      setFormOpen(true);
    }
  }, []);

  const handleCopy = async (campaign: SendMessMemberGrCampaign) => {
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

  const handleDelete = async (campaign: SendMessMemberGrCampaign) => {
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
        pageTitle="Tương tác nhóm đã tham gia"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/send-mess-member-gr" },
        ]}
      />

      <ComponentCard
        title="Chiến dịch tương tác nhóm đã tham gia"
        desc="Nhắn tin hoặc kết bạn với thành viên trong nhóm Zalo đã tham gia"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <SendMessMemberGrCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <SendMessMemberGrCampaignTable
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

      <SendMessMemberGrCampaignFormModal
        open={formOpen}
        editingCampaign={editingCampaign}
        accounts={accounts}
        accountsLoading={accountsLoading}
        onClose={() => {
          setFormOpen(false);
          setEditingCampaign(null);
        }}
      />

      <SendMessMemberGrResultsModal
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
            Hệ thống sẽ tự động tạm dừng chiến dịch khi tài khoản Zalo trong chiến dịch bị
            hạn chế. Khuyến nghị thời gian chờ 350 giây trở lên và số lượt 50/ngày. Mỗi
            kịch bản gắn với một tài khoản, một nhóm và danh sách thành viên được chọn.
          </p>
        </div>
      </Modal>
    </div>
  );
}