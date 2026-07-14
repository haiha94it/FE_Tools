import type { ShowcaseTabId } from "@/components/landing/landing-data";
import type { ReactNode } from "react";

function PanelChrome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="landing-card overflow-hidden shadow-xl shadow-brand-500/10">
      <div className="landing-mockup-chrome flex items-center gap-2 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-400" />
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="landing-lead ml-2 text-[11px] font-medium">{title}</span>
      </div>
      {children}
    </div>
  );
}

function MessengerPanel() {
  return (
    <PanelChrome title="carevippro.app/zalo-messages">
      <div className="landing-mockup-body flex min-h-[300px] sm:min-h-[360px]">
        <div className="landing-mockup-sidebar hidden w-14 shrink-0 flex-col gap-1.5 p-2 sm:flex">
          {["bg-brand-500", "bg-emerald-400", "bg-amber-400"].map((c, i) => (
            <div key={c} className={`h-7 w-7 rounded-lg ${c} ${i > 0 ? "opacity-40" : ""}`} />
          ))}
        </div>
        <div className="landing-mockup-divider w-[38%] shrink-0 border-r p-2">
          <p className="landing-lead mb-2 text-[10px] font-semibold uppercase">Hội thoại</p>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className={`mb-1.5 flex items-center gap-2 rounded-lg p-1.5 ${n === 1 ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}
            >
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
              <div className="min-w-0 flex-1">
                <div className="landing-mockup-skeleton h-1.5 w-12 rounded" />
                <div className="landing-mockup-skeleton-soft mt-1 h-1 w-16 rounded" />
              </div>
              {n === 1 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[8px] font-bold text-white">
                  3
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="landing-title text-xs font-semibold">Khách hàng A</span>
            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
              Live
            </span>
          </div>
          <div className="flex-1 space-y-2">
            <div className="landing-mockup-bubble mr-6 max-w-[85%] rounded-xl rounded-tl-sm px-2.5 py-2 text-[10px]">
              Cho em xin báo giá sản phẩm ạ
            </div>
            <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-brand-500 px-2.5 py-2 text-[10px] text-white">
              Dạ em gửi bảng giá ngay ạ!
            </div>
          </div>
          <div className="mt-2 flex gap-1">
            {["VIP", "Follow"].map((l) => (
              <span
                key={l}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-medium text-violet-600 dark:bg-violet-500/15 dark:text-violet-400"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PanelChrome>
  );
}

function CampaignsPanel() {
  const campaigns = [
    { name: "Kết bạn tự động", progress: 78, color: "bg-emerald-500" },
    { name: "Gửi tin nhóm Sale", progress: 45, color: "bg-brand-500" },
    { name: "Mời tham gia nhóm", progress: 92, color: "bg-violet-500" },
  ];
  return (
    <PanelChrome title="carevippro.app/zalo-campaigns">
      <div className="landing-mockup-body space-y-3 p-4 sm:min-h-[360px]">
        <div className="flex items-center justify-between">
          <p className="landing-title text-sm font-semibold">Chiến dịch đang chạy</p>
          <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
            3 active
          </span>
        </div>
        {campaigns.map((c) => (
          <div key={c.name} className="landing-mockup-divider rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <span className="landing-lead text-xs font-medium">{c.name}</span>
              <span className="landing-title text-xs font-bold">{c.progress}%</span>
            </div>
            <div className="landing-mockup-skeleton-soft mt-2 h-2 overflow-hidden rounded-full">
              <div
                className={`h-full rounded-full ${c.color}`}
                style={{ width: `${c.progress}%` }}
              />
            </div>
          </div>
        ))}
        <div className="grid grid-cols-3 gap-2 pt-2">
          {["Kết bạn", "Gửi tin", "Đăng video"].map((t) => (
            <div
              key={t}
              className="landing-mockup-divider landing-lead rounded-lg border border-dashed py-3 text-center text-[10px] font-medium"
            >
              + {t}
            </div>
          ))}
        </div>
      </div>
    </PanelChrome>
  );
}

function ShopPanel() {
  return (
    <PanelChrome title="carevippro.app/shop">
      <div className="landing-mockup-body p-4 sm:min-h-[360px]">
        <div className="mb-3 flex items-center justify-between">
          <p className="landing-title text-sm font-semibold">Sản phẩm nổi bật</p>
          <span className="landing-lead text-[10px]">12 sản phẩm</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="landing-mockup-divider overflow-hidden rounded-xl border">
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900" />
              <div className="p-2">
                <div className="landing-mockup-skeleton h-2 w-3/4 rounded" />
                <p className="mt-1 text-[10px] font-bold text-brand-600">
                  {(n * 150).toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PanelChrome>
  );
}

function AccountsPanel() {
  const rows = [
    { name: "Nick Sale 01", status: "Online", tone: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15" },
    { name: "Nick Sale 02", status: "Online", tone: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15" },
    { name: "Nick MKT", status: "Proxy", tone: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15" },
    { name: "Nick Backup", status: "Offline", tone: "text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-white/[0.06]" },
  ];
  return (
    <PanelChrome title="carevippro.app/zalo-accounts">
      <div className="landing-mockup-body p-4 sm:min-h-[360px]">
        <div className="mb-3 flex gap-2">
          {["Tất cả", "Online", "Proxy"].map((f, i) => (
            <span
              key={f}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium ${
                i === 0
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-400"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.name}
              className="landing-mockup-divider flex items-center justify-between rounded-xl border px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
                <span className="landing-title text-xs font-medium">{r.name}</span>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${r.tone}`}>
                {r.status}
              </span>
            </div>
          ))}
        </div>
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