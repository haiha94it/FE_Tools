"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import { VIDEO_CREATOR_BASE } from "@/config/api";
import { isZaloAccountActive } from "@/lib/zalo-account-utils";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import { useRouter } from "next/navigation";
import { HiOutlineQueueList } from "react-icons/hi2";

interface VideoCreatorHeaderProps {
  selectedAccountId: number | null;
  bulkPostOpen?: boolean;
  onOpenBulkPost?: () => void;
}

/**
 * Chọn nick kênh — compact 1 hàng (label + bulk + scroller accounts).
 */
export default function VideoCreatorHeader({
  selectedAccountId,
  bulkPostOpen = false,
  onOpenBulkPost,
}: VideoCreatorHeaderProps) {
  const router = useRouter();
  const accounts = useZaloVideoStore((s) => s.accounts);
  const loginLoading = useZaloVideoStore((s) => s.loginLoading);
  const resetChannelState = useZaloVideoStore((s) => s.resetChannelState);

  const activeAccounts = accounts.filter((account) =>
    isZaloAccountActive(account),
  );

  const handleSelect = (id: number) => {
    if (loginLoading) return;
    if (selectedAccountId === id) {
      void useZaloVideoStore.getState().activateAccount(id, { force: true });
      return;
    }
    resetChannelState();
    router.push(`${VIDEO_CREATOR_BASE}/${id}`);
  };

  return (
    <section
      aria-label="Chọn tài khoản Zalo"
      className="shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-3 sm:py-2">
        <p className="hidden shrink-0 text-[10px] font-semibold uppercase tracking-wider text-gray-400 sm:block">
          Kênh
        </p>

        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain no-scrollbar snap-x snap-mandatory">
          {activeAccounts.map((account) => {
            const isSelected = selectedAccountId === account.id;
            const label =
              account.name?.trim() || account.phone_number || `#${account.id}`;

            return (
              <button
                key={account.id}
                type="button"
                disabled={loginLoading}
                onClick={() => handleSelect(account.id)}
                className={`flex shrink-0 snap-start items-center gap-1.5 rounded-lg border px-2 py-1 transition disabled:opacity-60 ${
                  isSelected
                    ? "border-brand-300 bg-brand-50 shadow-theme-xs dark:border-brand-500/40 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:hover:border-gray-600"
                }`}
              >
                {account.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={account.avatar}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <AvatarText name={label} size="xs" />
                )}
                <span className="max-w-[88px] truncate text-left text-[11px] font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {loginLoading && (
            <span className="hidden items-center gap-1 text-[10px] font-medium text-brand-600 sm:inline-flex dark:text-brand-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Đang chuyển…
            </span>
          )}
          {onOpenBulkPost && (
            <button
              type="button"
              disabled={loginLoading}
              onClick={onOpenBulkPost}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition disabled:opacity-60 ${
                bulkPostOpen
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
              }`}
            >
              <HiOutlineQueueList size={14} aria-hidden className="shrink-0" />
              <span className="hidden sm:inline">Đăng hàng loạt</span>
              <span className="sm:hidden">Hàng loạt</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
