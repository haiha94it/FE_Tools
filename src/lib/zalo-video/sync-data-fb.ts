import type { ZaloAccount } from "@/types/zalo-account";

const DATA_FB_KEY = "dataFb";

/** Đồng bộ danh sách tài khoản vào localStorage — zl-video đọc webSession từ đây */
export function syncDataFbAccounts(accounts: ZaloAccount[]): void {
  if (typeof window === "undefined") return;

  const mapped = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    avatar: account.avatar,
    checkpoint: account.checkpoint,
    webSession: (account as ZaloAccount & { webSession?: string }).webSession,
    proxy: account.proxy
      ? {
          proxy:
            account.proxy.proxy
            ?? [
              account.proxy.host,
              account.proxy.port,
              account.proxy.username,
              account.proxy.password,
            ]
              .filter(Boolean)
              .join(":"),
        }
      : null,
  }));

  localStorage.setItem(DATA_FB_KEY, JSON.stringify(mapped));
}