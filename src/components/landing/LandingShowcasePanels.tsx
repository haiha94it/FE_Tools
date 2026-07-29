import type { ShowcaseTabId } from "@/components/landing/landing-data";
import type { ReactNode } from "react";

function PanelChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="landing-card overflow-hidden shadow-xl shadow-brand-500/10 rounded-2xl border border-gray-200 dark:border-gray-800">
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
          src="/images/logo/Ảnh 2 - tin nhan.png"
          alt="Hộp thư Zalo realtime — CSKH tự động"
          className="w-full h-auto object-cover transition-all duration-300 hover:scale-[1.01]"
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
          src="/images/logo/Ảnh 2 - chiến dịch.png"
          alt="Tự động hóa marketing Zalo — CSKH tự động"
          className="w-full h-auto object-cover transition-all duration-300 hover:scale-[1.01]"
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
          src="/images/logo/Ảnh 2 - quản lý shop bán hàng.png"
          alt="Quản lý cửa hàng shop online — CSKH tự động"
          className="w-full h-auto object-cover transition-all duration-300 hover:scale-[1.01]"
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
          src="/images/logo/Ảnh 2 - quản lý tài khoản.png"
          alt="Trung tâm quản lý tài khoản Zalo — CSKH tự động"
          className="w-full h-auto object-cover transition-all duration-300 hover:scale-[1.01]"
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
  const Panel = PANELS[tabId];
  return <Panel />;
}