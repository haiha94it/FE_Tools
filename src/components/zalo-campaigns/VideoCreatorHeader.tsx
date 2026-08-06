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
      className="shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 dark:border-gray-800 dark:bg-white/[0.02]">
        <p className="text-theme-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Tài khoản kênh
        </p>
        <div className="flex items-center gap-2">
          {loginLoading && (
            <span className="flex items-center gap-1.5 text-theme-xs font-medium text-brand-600 dark:text-brand-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand-500" />
              Đang chuyển kênh…
            </span>
          )}
          {onOpenBulkPost && (
            <button
              type="button"
              disabled={loginLoading}
              onClick={onOpenBulkPost}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-theme-xs font-semibold transition disabled:opacity-60 ${
                bulkPostOpen
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300 dark:hover:bg-brand-500/20"
              }`}
            >
              <HiOutlineQueueList size={14} aria-hidden className="shrink-0" />
              Đăng hàng loạt
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto overscroll-x-contain p-3 no-scrollbar snap-x snap-mandatory">
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
              className={`flex shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 transition disabled:opacity-60 ${
                isSelected
                  ? "border-brand-300 border-l-[3px] border-l-brand-500 bg-brand-50 shadow-theme-xs dark:border-brand-500/40 dark:bg-brand-500/10"
                  : "border-gray-200 border-l-[3px] border-l-transparent bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:hover:border-gray-600"
              }`}
            >
              {account.avatar ? (
                <img
                  src={account.avatar}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover"
                />
              ) : (
                <AvatarText name={label} size="sm" />
              )}
              <span className="max-w-[100px] truncate text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
