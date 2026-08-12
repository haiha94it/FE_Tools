"use client";

import { useEffect, useState } from "react";
import LandingPage from "@/components/landing/LandingPage";
import { isSystemDomain } from "@/components/storefront/CustomDomainResolver";
import { zaloShopService } from "@/services/zalo-shop.service";

export default function RootHomePageClient() {
  const [isSystem, setIsSystem] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    const sys = isSystemDomain(hostname);
    if (!sys) {
      setIsSystem(false);
      void zaloShopService.getIdDomain(hostname).then((userId) => {
        if (userId) {
          window.location.href = `${window.location.origin}/store/${userId}`;
        } else {
          setIsSystem(true);
        }
      });
    } else {
      setIsSystem(true);
    }
  }, []);

  if (isSystem !== true) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Đang kết nối tới gian hàng...</p>
      </div>
    );
  }

  return (
    <div className="landing-page min-h-dvh antialiased">
      <LandingPage />
    </div>
  );
}
