"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { VIDEO_CREATOR_BASE } from "@/config/api";
import { hasZaloVideoChannel } from "@/lib/zalo-video/channel-utils";
import { getDataFbAccount } from "@/lib/zalo-video/session";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { VideoCreatorTab } from "@/types/zalo-video";
import { HiOutlineUser } from "react-icons/hi2";
import { useParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import AnalyticsPanel from "./AnalyticsPanel";
import CategoryLabelPanel from "./CategoryLabelPanel";
import ChannelPagePanel from "./ChannelPagePanel";
import ChannelSettingsPanel from "./ChannelSettingsPanel";
import CommentManagerPanel from "./CommentManagerPanel";
import PlaylistManagerPanel from "./PlaylistManagerPanel";
import PostVideoPanel from "./PostVideoPanel";
import VideoChannelGuideDialog from "./VideoChannelGuideDialog";
import VideoCreatorChannelBar from "./VideoCreatorChannelBar";
import VideoCreatorHeader from "./VideoCreatorHeader";
import VideoCreatorNav from "./VideoCreatorNav";
import VideoCreatorQrPanel from "./VideoCreatorQrPanel";
import VideoListPanel from "./VideoListPanel";

function parseAccountId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function parseTab(raw: string | string[] | undefined): VideoCreatorTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return "analytics";

  const allowed: VideoCreatorTab[] = [
    "video-post",
    "video-manager",
    "comment-manager",
    "playlist-manager",
    "channel",
    "category",
    "infor",
  ];

  return allowed.includes(value as VideoCreatorTab)
    ? (value as VideoCreatorTab)
    : "analytics";
}

export default function VideoCreatorView() {
  const params = useParams();
  const accountId = parseAccountId(params.account);
  const tab = parseTab(params.infor);

  const fetchAccounts = useZaloVideoStore((s) => s.fetchAccounts);
  const activateAccount = useZaloVideoStore((s) => s.activateAccount);
  const accountsLoading = useZaloVideoStore((s) => s.accountsLoading);
  const loginLoading = useZaloVideoStore((s) => s.loginLoading);
  const channelInfo = useZaloVideoStore((s) => s.channelInfo);
  const channelError = useZaloVideoStore((s) => s.channelError);
  const needsQr = useZaloVideoStore((s) => s.needsQr);
  const noChannel = useZaloVideoStore((s) => s.noChannel);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!accountId) return;
    void activateAccount(accountId);
  }, [accountId, activateAccount]);

  const fbAccount = accountId ? getDataFbAccount(accountId) : undefined;
  const showQr = Boolean(
    accountId && (needsQr || fbAccount?.checkpoint) && !noChannel,
  );
  const hasChannel = hasZaloVideoChannel(channelInfo);
  const showWorkspace = Boolean(
    accountId && hasChannel && !showQr && !noChannel,
  );
  const isBootstrapping = Boolean(
    accountId &&
      (accountsLoading || loginLoading) &&
      !hasChannel &&
      !noChannel &&
      !showQr &&
      !channelError,
  );

  const panel = useMemo(() => {
    if (!accountId || !showWorkspace || !channelInfo) return null;

    switch (tab) {
      case "video-post":
        return <PostVideoPanel accountId={accountId} />;
      case "video-manager":
        return <VideoListPanel accountId={accountId} />;
      case "comment-manager":
        return <CommentManagerPanel accountId={accountId} />;
      case "playlist-manager":
        return (
          <Suspense
            fallback={
              <p className="py-16 text-center text-sm text-gray-500">
                Đang tải playlist…
              </p>
            }
          >
            <PlaylistManagerPanel accountId={accountId} />
          </Suspense>
        );
      case "channel":
        return (
          <ChannelPagePanel accountId={accountId} channelInfo={channelInfo} />
        );
      case "category":
        return <CategoryLabelPanel accountId={accountId} />;
      case "infor":
        return (
          <ChannelSettingsPanel
            accountId={accountId}
            channelInfo={channelInfo}
          />
        );
      case "analytics":
        return (
          <AnalyticsPanel accountId={accountId} channelInfo={channelInfo} />
        );
      default:
        return (
          <AnalyticsPanel accountId={accountId} channelInfo={channelInfo} />
        );
    }
  }, [accountId, showWorkspace, tab, channelInfo]);

  return (
    <div className="flex h-0 min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageBreadcrumb
        pageTitle="Đăng video"
        showPageTitle={false}
        className="!mb-0 shrink-0"
        parents={[{ label: "Chiến dịch", href: VIDEO_CREATOR_BASE }]}
      />

      <VideoCreatorHeader selectedAccountId={accountId} />

      {!accountId && (
        <div
          className={`${adminDataPanelClass} items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center dark:border-gray-700 dark:bg-white/[0.02]`}
        >
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
            <HiOutlineUser size={24} className="shrink-0 text-gray-400" aria-hidden />
          </span>
          <p className="mt-4 text-base font-medium text-gray-800 dark:text-white/90">
            Chọn tài khoản Zalo
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Chọn tài khoản ở thanh trên để đăng nhập kênh video và quản lý nội
            dung.
          </p>
        </div>
      )}

      {accountId && (
        <div
          className={`${adminDataPanelClass} overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]`}
        >
          {isBootstrapping && (
            <div className="flex flex-1 items-center justify-center p-12">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="mt-3 text-sm text-gray-500">
                  {loginLoading ? "Đang chuyển kênh…" : "Đang tải tài khoản…"}
                </p>
              </div>
            </div>
          )}

          {channelError && !noChannel && !loginLoading && !isBootstrapping && (
            <div className="shrink-0 border-b border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300 sm:px-5">
              {channelError}
            </div>
          )}

          {noChannel && !isBootstrapping && (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center sm:p-12">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-500/10">
                <HiOutlineUser size={24} className="shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                Chưa có kênh Zalo Video
              </h3>
              <p className="mt-2 max-w-md text-sm text-gray-600 dark:text-gray-400">
                Tạo kênh trên ứng dụng Zalo để đăng video và quản lý nội dung.
              </p>
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="mt-5 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600"
              >
                Xem hướng dẫn tạo kênh
              </button>
            </div>
          )}

          {showQr && !isBootstrapping && (
            <VideoCreatorQrPanel accountId={accountId} />
          )}

          {showWorkspace && channelInfo && (
            <>
              <VideoCreatorChannelBar
                accountId={accountId}
                channelInfo={channelInfo}
              />
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
                <VideoCreatorNav accountId={accountId} />
                <main className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto bg-gray-50/60 p-4 dark:bg-black/10 sm:p-5">
                  {panel}
                </main>
              </div>
            </>
          )}
        </div>
      )}

      <VideoChannelGuideDialog
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
      />
    </div>
  );
}