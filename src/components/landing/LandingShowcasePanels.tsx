"use client";

import type { ShowcaseTabId } from "@/components/landing/landing-data";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { ReactNode } from "react";
import { useRef } from "react";

function PanelChrome({ title, children }: { title: string; children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // GSAP 3D Interactive Tilt nhẹ khi Hover trên ảnh Showcase
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(containerRef.current, {
      rotateY: x * 6,
      rotateX: -y * 6,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    gsap.to(containerRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="landing-card overflow-hidden shadow-2xl shadow-brand-500/10 rounded-2xl border border-gray-200 dark:border-gray-800 [perspective:1000px] [transform-style:preserve-3d]"
    >
      <div className="landing-mockup-chrome flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        <span className="landing-lead ml-2 text-xs font-medium text-gray-500 dark:text-gray-400">{title}</span>
      </div>
      {children}
    </div>
  );
}

function MessengerPanel() {
  return (
    <PanelChrome title="cskh.tudongai.com/zalo-messages">
      <div className="overflow-hidden bg-gray-950/5">
        <img
          src="/images/logo/anh-2-tin-nhan.png"
          alt="Hộp thư Zalo realtime — CSKH tự động"
          className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </PanelChrome>
  );
}

function CampaignsPanel() {
  return (
    <PanelChrome title="cskh.tudongai.com/zalo-campaigns">
      <div className="overflow-hidden bg-gray-950/5">
        <img
          src="/images/logo/anh-2-chien-dich.png"
          alt="Tự động hóa marketing Zalo — CSKH tự động"
          className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </PanelChrome>
  );
}

function ShopPanel() {
  return (
    <PanelChrome title="cskh.tudongai.com/shop">
      <div className="overflow-hidden bg-gray-950/5">
        <img
          src="/images/logo/anh-2-quan-ly-shop-ban-hang.png"
          alt="Quản lý cửa hàng shop online — CSKH tự động"
          className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </PanelChrome>
  );
}

function AccountsPanel() {
  return (
    <PanelChrome title="cskh.tudongai.com/zalo-accounts">
      <div className="overflow-hidden bg-gray-950/5">
        <img
          src="/images/logo/anh-2-quan-ly-tai-khoan.png"
          alt="Trung tâm quản lý tài khoản Zalo — CSKH tự động"
          className="w-full h-auto object-cover transition-transform duration-500 hover:scale-[1.02]"
        />
      </div>
    </PanelChrome>
  );
}

const PANELS: Record<ShowcaseTabId, () => ReactNode> = {
  messenger: MessengerPanel,
  campaigns: CampaignsPanel,
  shop: ShopPanel,
  accounts: AccountsPanel,
};

export default function LandingShowcasePanels({ tabId }: { tabId: ShowcaseTabId }) {
  const panelRef = useRef<HTMLDivElement>(null);

  // GSAP Smooth Tab Switch Transition (Fade & Scale Zoom)
  useGSAP(() => {
    if (!panelRef.current) return;

    gsap.fromTo(
      panelRef.current,
      { opacity: 0, scale: 0.95, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "power2.out" }
    );
  }, [tabId]);

  const Panel = PANELS[tabId];
  return (
    <div ref={panelRef}>
      <Panel />
    </div>
  );
}