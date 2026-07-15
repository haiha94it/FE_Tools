"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Alert from "@/components/ui/alert/Alert";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import { canAccessAdminSettings } from "@/lib/map-auth-user";
import { useAuthStore } from "@/stores/use-auth-store";
import type { AdminSettingsTabKey } from "@/types/admin-settings";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AlertSettingsPanel from "./panels/AlertSettingsPanel";
import CommunitySettingsPanel from "./panels/CommunitySettingsPanel";
import DecreeSettingsPanel from "./panels/DecreeSettingsPanel";
import ExpirationSettingsPanel from "./panels/ExpirationSettingsPanel";
import FirstLoginSettingsPanel from "./panels/FirstLoginSettingsPanel";
import LogoSettingsPanel from "./panels/LogoSettingsPanel";
import RegisterNotificationPanel from "./panels/RegisterNotificationPanel";

const TABS: { key: AdminSettingsTabKey; label: string }[] = [
  { key: "alert", label: "Thông báo" },
  { key: "community", label: "Nút cộng đồng" },
  { key: "expiration", label: "Hết hạn" },
  { key: "logo", label: "Logo" },
  { key: "register", label: "Thông báo đăng ký" },
  { key: "first-login", label: "Đăng nhập lần đầu" },
  { key: "decree", label: "Thông tư nghị định" },
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
    default:
      return null;
  }
}

export default function AdminSettingsView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const canAccess = canAccessAdminSettings(user);
  const [activeTab, setActiveTab] = useState<AdminSettingsTabKey>("alert");

  useEffect(() => {
    if (!canAccess) {
      router.replace("/me");
    }
  }, [canAccess, router]);

  if (!canAccess) {
    return (
      <div className={adminDataPanelClass}>
        <Alert
          variant="warning"
          title="Không có quyền truy cập"
          message="Chỉ tài khoản admin mới được vào trang cài đặt hệ thống."
        />
      </div>
    );
  }

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle="Cài đặt hệ thống"
        parents={[
          { label: "Admin", href: "/admin/users" },
          { label: "Cài đặt hệ thống" },
        ]}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-scrollbar shrink-0 overflow-x-auto border-b border-gray-200 px-3 py-3 dark:border-gray-800 sm:px-4">
          <div className="flex min-w-max gap-2">
            {TABS.map((tab) => (
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

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {renderPanel(activeTab)}
        </div>
      </div>
    </div>
  );
}