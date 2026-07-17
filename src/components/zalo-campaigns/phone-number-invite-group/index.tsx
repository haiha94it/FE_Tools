"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { Modal } from "@/components/ui/modal";
import { confirm, prompt } from "@/lib/confirm";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/errors";
import {
  GROUP_NOT_ON_ALL_ACCOUNTS,
  GROUP_NOT_ON_ALL_ACCOUNTS_MESSAGE,
} from "@/lib/zalo-phone-invite-group-campaign-utils";
import { toast } from "@/lib/toast";
import { zaloPhoneInviteGroupCampaignService } from "@/services/zalo-phone-invite-group-campaign.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useZaloPhoneInviteGroupCampaignStore } from "@/stores/use-zalo-phone-invite-group-campaign-store";
import type { PhoneInviteGroupCampaign } from "@/types/zalo-phone-invite-group-campaign";
import { useCampaignResultsAutoRefresh } from "@/hooks/use-campaign-results-auto-refresh";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCampaignTeamHandlers } from "@/components/zalo-campaigns/shared/useCampaignTeamHandlers";
import PhoneInviteGroupCampaignFormModal from "./PhoneInviteGroupCampaignFormModal";
import PhoneInviteGroupCampaignResultsModal from "./PhoneInviteGroupCampaignResultsModal";
import PhoneInviteGroupCampaignTable from "./PhoneInviteGroupCampaignTable";
import PhoneInviteGroupCampaignToolbar from "./PhoneInviteGroupCampaignToolbar";

export default function PhoneInviteGroupCampaignView() {
  const campaigns = useZaloPhoneInviteGroupCampaignStore((s) => s.campaigns);
  const accounts = useZaloPhoneInviteGroupCampaignStore((s) => s.accounts);
  const selectedIds = useZaloPhoneInviteGroupCampaignStore((s) => s.selectedIds);
  const loading = useZaloPhoneInviteGroupCampaignStore((s) => s.loading);
  const accountsLoading = useZaloPhoneInviteGroupCampaignStore((s) => s.accountsLoading);
  const actionLoading = useZaloPhoneInviteGroupCampaignStore((s) => s.actionLoading);
  const resultsOpen = useZaloPhoneInviteGroupCampaignStore((s) => s.resultsOpen);
  const resultsCampaignId = useZaloPhoneInviteGroupCampaignStore((s) => s.resultsCampaignId);

  const fetchCampaigns = useZaloPhoneInviteGroupCampaignStore((s) => s.fetchCampaigns);
  const fetchAccounts = useZaloPhoneInviteGroupCampaignStore((s) => s.fetchAccounts);
  const toggleSelected = useZaloPhoneInviteGroupCampaignStore((s) => s.toggleSelected);
  const toggleSelectAll = useZaloPhoneInviteGroupCampaignStore((s) => s.toggleSelectAll);
  const deleteCampaign = useZaloPhoneInviteGroupCampaignStore((s) => s.deleteCampaign);
  const copyCampaign = useZaloPhoneInviteGroupCampaignStore((s) => s.copyCampaign);
  const startCampaigns = useZaloPhoneInviteGroupCampaignStore((s) => s.startCampaigns);
  const stopCampaigns = useZaloPhoneInviteGroupCampaignStore((s) => s.stopCampaigns);
  const openResults = useZaloPhoneInviteGroupCampaignStore((s) => s.openResults);
  const closeResults = useZaloPhoneInviteGroupCampaignStore((s) => s.closeResults);
  const refreshResults = useZaloPhoneInviteGroupCampaignStore((s) => s.refreshResults);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<PhoneInviteGroupCampaign | null>(
    null,
  );
  const [noteOpen, setNoteOpen] = useState(false);

  const { guardAccess, getFormReadOnly } =
    useCampaignTeamHandlers<PhoneInviteGroupCampaign>();

  useEffect(() => {
    void fetchCampaigns();
    void fetchAccounts();
  }, [fetchCampaigns, fetchAccounts]);

  useEffect(() => {
    const unsubscribe = useWebSocketStore.getState().subscribe((message) => {
      if (message.type === "status_category_invite_phone_join_group") {
        void fetchCampaigns({ silent: true });
        const state = useZaloPhoneInviteGroupCampaignStore.getState();
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

  const openEdit = useCallback(async (campaign: PhoneInviteGroupCampaign) => {
    if (!guardAccess(campaign, "edit")) return;
    try {
      const loaded = await zaloPhoneInviteGroupCampaignService.getCampaignById(campaign.id);
      setEditingCampaign(loaded ?? campaign);
      setFormOpen(true);
    } catch {
      setEditingCampaign(campaign);
      setFormOpen(true);
    }
  }, [guardAccess]);

  const handleCopy = async (campaign: PhoneInviteGroupCampaign) => {
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

  const handleDelete = async (campaign: PhoneInviteGroupCampaign) => {
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
      if (getApiErrorCode(error) === GROUP_NOT_ON_ALL_ACCOUNTS) {
        toast.error(GROUP_NOT_ON_ALL_ACCOUNTS_MESSAGE);
        return;
      }
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
        pageTitle="Mời SĐT tham gia nhóm"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/phone-number-invite-group" },
        ]}
      />

      <ComponentCard
        title="Chiến dịch mời số điện thoại tham gia nhóm"
        desc="Chọn nick + nhóm chung; SĐT là queue chung, các nick thay phiên mời vào cùng nhóm"
        fill
      >
        <div className="mb-4 flex min-h-0 flex-1 flex-col gap-4">
          <PhoneInviteGroupCampaignToolbar
            selectedCount={selectedIds.length}
            actionLoading={actionLoading}
            onCreate={openCreate}
            onRunNew={() => void handleRun("new")}
            onRunContinue={() => void handleRun("continue")}
            onStop={() => void handleStop()}
            onShowNote={() => setNoteOpen(true)}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <PhoneInviteGroupCampaignTable
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

      <PhoneInviteGroupCampaignFormModal
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

      <PhoneInviteGroupCampaignResultsModal
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
          <div className="mt-3 space-y-2 text-sm leading-6 text-gray-600 dark:text-gray-300">
            <p>
              SĐT là <strong>1 queue chung</strong>; các nick <strong>thay phiên</strong> mời
              vào <strong>cùng nhóm chung</strong>. Nick mất group / proxy / limit sẽ không
              nhận SĐT (số không bị nuốt).
            </p>
            <p>
              Hệ thống tạm dừng khi nick bị hạn chế. Khuyến nghị chờ ≥ 180 giây và ≤ 20
              lượt mời/ngày. Zalo chỉ cho mời vào nhóm cộng đồng khi đã là bạn bè.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}