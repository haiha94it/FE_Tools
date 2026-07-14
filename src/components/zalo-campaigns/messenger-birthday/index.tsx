"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloBirthdayCampaignStore } from "@/stores/use-zalo-birthday-campaign-store";
import { useEffect, useState } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";
import BirthdayCampaignFormPanel from "./BirthdayCampaignFormPanel";
import BirthdayResultsPanel from "./BirthdayResultsPanel";

export default function MessengerBirthdayView() {
  const campaign = useZaloBirthdayCampaignStore((s) => s.campaign);
  const accounts = useZaloBirthdayCampaignStore((s) => s.accounts);
  const videos = useZaloBirthdayCampaignStore((s) => s.videos);
  const albums = useZaloBirthdayCampaignStore((s) => s.albums);
  const loading = useZaloBirthdayCampaignStore((s) => s.loading);
  const accountsLoading = useZaloBirthdayCampaignStore((s) => s.accountsLoading);
  const saving = useZaloBirthdayCampaignStore((s) => s.saving);
  const actionLoading = useZaloBirthdayCampaignStore((s) => s.actionLoading);
  const mediaLoading = useZaloBirthdayCampaignStore((s) => s.mediaLoading);

  const fetchCampaign = useZaloBirthdayCampaignStore((s) => s.fetchCampaign);
  const fetchAccounts = useZaloBirthdayCampaignStore((s) => s.fetchAccounts);
  const fetchMediaLibraries = useZaloBirthdayCampaignStore((s) => s.fetchMediaLibraries);
  const startCampaign = useZaloBirthdayCampaignStore((s) => s.startCampaign);
  const stopCampaign = useZaloBirthdayCampaignStore((s) => s.stopCampaign);
  const refreshResults = useZaloBirthdayCampaignStore((s) => s.refreshResults);

  const [noteOpen, setNoteOpen] = useState(false);

  useEffect(() => {
    void fetchCampaign();
    void fetchAccounts();
    void fetchMediaLibraries();
    void refreshResults();
  }, [fetchCampaign, fetchAccounts, fetchMediaLibraries, refreshResults]);

  const handleStart = async () => {
    try {
      await startCampaign();
      toast.success("Chiến dịch bắt đầu chạy.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleStop = async () => {
    try {
      await stopCampaign();
      toast.success("Dừng chiến dịch thành công.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const isRunning = Boolean(campaign?.active);

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle="Chúc mừng sinh nhật"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/messenger-birthday" },
        ]}
      />

      <ComponentCard
        title="Chúc mừng sinh nhật tự động"
        desc="Gửi tin chúc mừng sinh nhật cho bạn bè qua các tài khoản Zalo đã chọn"
        fill
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            Quy trình: Chỉ được sửa chiến dịch trước 9h sáng. Kịch bản sửa sau 9h sẽ có
            hiệu lực vào ngày hôm sau.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {isRunning ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-theme-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                Đang chạy
              </span>
            ) : null}
            <Tooltip content="Ghi chú quan trọng" side="top">
              <button
                type="button"
                onClick={() => setNoteOpen(true)}
                aria-label="Ghi chú quan trọng"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-error-200 text-error-500 transition hover:bg-error-50 dark:border-error-500/30 dark:hover:bg-error-500/10"
              >
                <HiOutlineBellAlert size={20} aria-hidden />
              </button>
            </Tooltip>
            <Button
              size="sm"
              disabled={actionLoading || isRunning || !campaign?.id}
              onClick={() => void handleStart()}
            >
              Chạy
            </Button>
            <Button
              size="sm"
              className="bg-error-500 hover:bg-error-600"
              disabled={actionLoading || !campaign?.id}
              onClick={() => void handleStop()}
            >
              Dừng
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Đang tải kịch bản...</p>
        ) : (
          <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50/40 p-4 dark:border-gray-800 dark:bg-white/[0.02]">
              <BirthdayCampaignFormPanel
                campaign={campaign}
                accounts={accounts}
                accountsLoading={accountsLoading}
                videos={videos}
                albums={albums}
                mediaLoading={mediaLoading}
                saving={saving}
              />
            </div>
            <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 p-4 dark:border-gray-800">
              <p className="mb-3 shrink-0 text-sm font-semibold text-gray-800 dark:text-white/90">
                Kết quả gửi tin
              </p>
              <BirthdayResultsPanel accounts={accounts} />
            </div>
          </div>
        )}
      </ComponentCard>

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
            Bấm chạy trước 9h thì hệ thống chạy lúc 9h cùng ngày. Bấm chạy sau 9h thì
            hệ thống chạy lúc 9h ngày hôm sau. Nên thêm nhiều mẫu nội dung để hệ thống
            chọn ngẫu nhiên, giảm nguy cơ bị Zalo hạn chế.
          </p>
        </div>
      </Modal>
    </div>
  );
}