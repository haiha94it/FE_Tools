"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import {
  canAccessAdminSettings,
  canAccessAdminSettingsPage,
  canAccessSupportBotSetup,
} from "@/lib/map-auth-user";
import { useAuthStore } from "@/stores/use-auth-store";
import type { AdminSettingsTabKey } from "@/types/admin-settings";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import AlertSettingsPanel from "./panels/AlertSettingsPanel";
import CommunitySettingsPanel from "./panels/CommunitySettingsPanel";
import DecreeSettingsPanel from "./panels/DecreeSettingsPanel";
import ExpirationSettingsPanel from "./panels/ExpirationSettingsPanel";
import FirstLoginSettingsPanel from "./panels/FirstLoginSettingsPanel";
import LogoSettingsPanel from "./panels/LogoSettingsPanel";
import RegisterNotificationPanel from "./panels/RegisterNotificationPanel";
import SupportBotSettingsPanel from "./panels/SupportBotSettingsPanel";

const ALL_TABS: { key: AdminSettingsTabKey; label: string; adminOnly?: boolean }[] = [
  { key: "alert", label: "Thông báo", adminOnly: true },
  { key: "community", label: "Nút cộng đồng", adminOnly: true },
  { key: "expiration", label: "Hết hạn", adminOnly: true },
  { key: "logo", label: "Logo", adminOnly: true },
  { key: "register", label: "Thông báo đăng ký", adminOnly: true },
  { key: "first-login", label: "Đăng nhập lần đầu", adminOnly: true },
  { key: "decree", label: "Thông tư nghị định", adminOnly: true },
  { key: "support-bot", label: "Setup bot hỏi đáp CSKH" },
];

function renderPanel(tab: AdminSettingsTabKey) {
  switch (tab) {
    case "alert":
      return <AlertSettingsPanel />;
    case "community":
      return <CommunitySettingsPanel />;
    case "expiration":
      return <ExpirationSettingsPanel />;
    case "logo":
      return <LogoSettingsPanel />;
    case "register":
      return <RegisterNotificationPanel />;
    case "first-login":
      return <FirstLoginSettingsPanel />;
    case "decree":
      return <DecreeSettingsPanel />;
    case "support-bot":
      return <SupportBotSettingsPanel />;
    default:
      return null;
  }
}

export default function AdminSettingsView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isFullAdmin = canAccessAdminSettings(user);
  const canSupportBot = canAccessSupportBotSetup(user);
  const canAccess = canAccessAdminSettingsPage(user);

  const tabs = useMemo(() => {
    if (isFullAdmin) return ALL_TABS;
    // Supporter: chỉ tab bot
    return ALL_TABS.filter((t) => t.key === "support-bot");
  }, [isFullAdmin]);

  const defaultTab: AdminSettingsTabKey = isFullAdmin ? "alert" : "support-bot";
  const [activeTab, setActiveTab] = useState<AdminSettingsTabKey>(defaultTab);

  useEffect(() => {
    if (!canAccess) {
      router.replace("/me");
      return;
    }
    // Đảm bảo tab active hợp lệ với quyền
    if (!tabs.some((t) => t.key === activeTab)) {
      setActiveTab(tabs[0]?.key ?? "support-bot");
    }
  }, [canAccess, router, tabs, activeTab]);

  useEffect(() => {
    // Query ?tab=support-bot
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "support-bot" && tabs.some((t) => t.key === "support-bot")) {
      setActiveTab("support-bot");
    }
  }, [tabs]);

  if (!canAccess) {
    return (
      <div className={adminDataPanelClass}>
        <Alert
          variant="warning"
          title="Không có quyền truy cập"
          message="Chỉ admin hoặc user đã được gán editor bot CSKH mới vào được."
        />
      </div>
    );
  }

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle={
          isFullAdmin ? "Cài đặt hệ thống" : "Setup bot hỏi đáp CSKH"
        }
        parents={
          isFullAdmin
            ? [
                { label: "Admin", href: "/admin/users" },
                { label: "Cài đặt hệ thống" },
              ]
            : [{ label: "Setup bot CSKH" }]
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {tabs.length > 1 ? (
          <div className="custom-scrollbar shrink-0 overflow-x-auto border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:px-4">
            <div className="flex min-w-max gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    activeTab === tab.key
                      ? "bg-brand-500 text-white shadow-theme-xs"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {canSupportBot || isFullAdmin ? renderPanel(activeTab) : null}
        </div>
      </div>
    </div>
  );
}
