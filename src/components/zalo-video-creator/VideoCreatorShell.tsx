"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { syncDataFbAccounts } from "@/lib/zalo-video/sync-data-fb";
import { zaloAccountService } from "@/services/zalo-account.service";
import { useWebSocketStore } from "@/stores/use-websocket-store";
import { useEffect } from "react";
import "./ZaloVideoContainer.css";
import { ZaloVideoContainer } from "./ZaloVideoContainer";
import VideoCreatorStyles from "./VideoCreatorStyles";

export default function VideoCreatorShell() {
  const connect = useWebSocketStore((s) => s.connect);
  const disconnect = useWebSocketStore((s) => s.disconnect);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  useEffect(() => {
    void zaloAccountService.list().then(syncDataFbAccounts).catch(() => {});
  }, []);

  return (
    <div className="zalo-video-creator-root flex min-h-0 flex-1 flex-col">
      <VideoCreatorStyles />
      <PageBreadcrumb
        pageTitle="Đăng video"
        showPageTitle={false}
        className="!mb-3 shrink-0"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/post-video" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <ZaloVideoContainer />
      </div>
    </div>
  );
}