"use client";

import { useEffect, useState } from "react";
import { zaloShopService } from "@/services/zalo-shop.service";

export const INTERNAL_SYSTEM_DOMAINS = [
  "care.chotnhanh.vn",
  "care.vbinh.online",
  "creator.chotnhanh.vn",
  "carepro.chotnhanh.vn",
  "careplus.chotnhanh.vn",
  "zcare.chotnhanh.vn",
  "zcare.vbinh.online",
  "tudongai.com",
  "zalo.tudongai.com",
  "cskh.tudongai.com",
  "localhost",
  "127.0.0.1",
];

export function isSystemDomain(hostname: string): boolean {
  if (!hostname) return true;
  const cleanHost = hostname.toLowerCase().split(":")[0];
  return INTERNAL_SYSTEM_DOMAINS.some((domain) => cleanHost.includes(domain));
}

export default function CustomDomainResolver() {
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    if (!isSystemDomain(hostname) && (pathname === "/" || pathname === "")) {
      setRedirecting(true);
      void zaloShopService.getIdDomain(hostname).then((userId) => {
        if (userId) {
          window.location.href = `${window.location.origin}/store/${userId}`;
        } else {
          setRedirecting(false);
        }
      });
    }
  }, []);

  if (redirecting) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-gray-800 dark:bg-gray-950 dark:text-gray-200">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="mt-4 text-sm font-medium">Đang kết nối tới gian hàng...</p>
      </div>
    );
  }

  return null;
}
