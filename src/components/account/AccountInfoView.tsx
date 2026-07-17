"use client";

import AccountChangePasswordCard from "@/components/account/AccountChangePasswordCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { APP_NAME } from "@/constants/brand";
import {
  formatAccountDate,
  getUserRoleLabel,
  isAccountExpired,
} from "@/lib/account-utils";
import {
  ArrowRightIcon,
  BoxIcon,
  CalenderIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  GroupIcon,
  LockIcon,
  PaperPlaneIcon,
  ShootingStarIcon,
} from "@/icons";
import { useAuthStore } from "@/stores/use-auth-store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const SHORTCUTS = [
  {
    href: "/zalo-accounts",
    label: "Tài khoản Zalo",
    desc: "Quản lý kết nối",
    icon: GroupIcon,
  },
  {
    href: "/zalo-messages",
    label: "Tin nhắn",
    desc: "Hộp thư đa kênh",
    icon: ChatIcon,
  },
  {
    href: "/shop",
    label: "Cửa hàng",
    desc: "Mini shop bán hàng",
    icon: BoxIcon,
  },
  {
    href: "/guides",
    label: "Hướng dẫn",
    desc: "Tài liệu & tips",
    icon: DocsIcon,
  },
] as const;

function ProfileCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] ${className}`}
    >
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function InfoTableRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-0.5 border-b border-gray-50 px-4 py-2.5 last:border-b-0 sm:grid-cols-[8.5rem_1fr] sm:items-center sm:gap-4 sm:px-5 dark:border-gray-800/80">
      <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-800 dark:text-white/90">{value}</dd>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 truncate text-[11px] text-white/55">{hint}</p> : null}
    </div>
  );
}

export default function AccountInfoView() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const logout = useAuthStore((s) => s.logout);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/signin");
  };

  const expired = isAccountExpired(user?.expirationDate);
  const roleLabel = getUserRoleLabel(user);
  const zaloUsage = user?.accountLimit
    ? Math.round(((user.accountCount ?? 0) / user.accountLimit) * 100)
    : 0;

  return (
    <div className="space-y-4 md:space-y-5">
      <PageBreadCrumb pageTitle="Trang thông tin" />

      <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-4 sm:p-5">
        <Image
          src="/images/shape/grid-01.svg"
          alt=""
          width={320}
          height={320}
          className="pointer-events-none absolute -right-6 -top-8 opacity-15"
          aria-hidden
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="rounded-full bg-white/15 p-0.5 ring-1 ring-white/25">
              <AvatarText
                name={user?.name ?? user?.username ?? "U"}
                className="!h-14 !w-14 !text-lg !bg-white !text-brand-600 sm:!h-16 sm:!w-20 sm:!text-xl"
              />
            </div>
            <div className="min-w-0 text-white">
              <p className="text-xs font-medium text-white/70">Xin chào</p>
              <h2 className="mt-0.5 truncate text-xl font-bold sm:text-2xl">
                {user?.name ?? user?.username ?? "—"}
              </h2>
              <p className="truncate text-xs text-white/75 sm:text-sm">@{user?.username ?? "—"}</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold">
                  <ShootingStarIcon className="size-3" />
                  {roleLabel}
                </span>
                {expired ? (
                  <span className="rounded-full bg-error-500/90 px-2.5 py-0.5 text-[11px] font-semibold">
                    Đã hết hạn
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
                    {APP_NAME}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing || isLoading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25 disabled:opacity-60 sm:text-sm"
            >
              <PaperPlaneIcon className="size-3.5" />
              {refreshing ? "Đang tải…" : "Làm mới"}
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={isLoading}
              className="inline-flex cursor-pointer items-center rounded-lg bg-white px-3 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60 sm:text-sm"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {expired ? (
          <p className="relative mt-3 rounded-lg bg-error-500/20 px-3 py-2 text-xs text-white ring-1 ring-white/15 sm:text-sm">
            Tài khoản đã hết hạn sử dụng. Vui lòng liên hệ quản trị để gia hạn.
          </p>
        ) : null}

        <div className="relative mt-4 grid grid-cols-1 gap-3 border-t border-white/15 pt-4 sm:grid-cols-2 sm:gap-4">
          <HeroMetric
            label="Hạn sử dụng"
            value={formatAccountDate(user?.expirationDate)}
            hint={expired ? "Cần gia hạn" : "Còn hiệu lực"}
          />
          <HeroMetric
            label="Tài khoản Zalo"
            value={`${user?.accountCount ?? 0} / ${user?.accountLimit ?? 0}`}
            hint={user?.accountLimit ? `Đã dùng ${zaloUsage}%` : undefined}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5">
        <ProfileCard
          title="Thông tin cá nhân"
          subtitle="Dữ liệu từ tài khoản đăng nhập"
          className="lg:col-span-7"
        >
          <dl>
            <InfoTableRow label="Tài khoản" value={user?.username ?? "—"} />
            <InfoTableRow label="Họ và tên" value={user?.name ?? "Chưa cập nhật"} />
            <InfoTableRow label="Email" value={user?.email || "—"} />
            <InfoTableRow
              label="Quyền hạn"
              value={
                <Badge size="sm" color="primary">
                  {roleLabel}
                </Badge>
              }
            />
          </dl>
        </ProfileCard>

        <ProfileCard
          title="Truy cập nhanh"
          subtitle="Các module chính của hệ thống"
          className="lg:col-span-5"
        >
          <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
            {SHORTCUTS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-5"
                >
                  <Icon className="size-4 shrink-0 text-gray-400 transition group-hover:text-brand-500 dark:text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </div>
                  <ArrowRightIcon className="size-3.5 shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-gray-600" />
                </Link>
              );
            })}
          </div>
        </ProfileCard>

        <div className="lg:col-span-7">
          <AccountChangePasswordCard />
        </div>

        <ProfileCard
          title="Hỗ trợ tài khoản"
          subtitle="Quên mật khẩu hoặc cần tài liệu?"
          className="lg:col-span-5"
        >
          <div className="divide-y divide-gray-50 dark:divide-gray-800/80">
            <Link
              href="/forgot-password"
              prefetch={false}
              className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-5"
            >
              <LockIcon className="size-4 shrink-0 text-brand-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Yêu cầu reset mật khẩu
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Gửi yêu cầu khôi phục qua hệ thống
                </p>
              </div>
              <ArrowRightIcon className="size-3.5 shrink-0 text-gray-300 group-hover:text-brand-500" />
            </Link>
            <Link
              href="/dieu-khoan"
              prefetch={false}
              className="group flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02] sm:px-5"
            >
              <DocsIcon className="size-4 shrink-0 text-gray-400 dark:text-gray-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  Điều khoản sử dụng
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Chính sách & quy định dịch vụ
                </p>
              </div>
              <ArrowRightIcon className="size-3.5 shrink-0 text-gray-300 group-hover:text-brand-500" />
            </Link>
          </div>
        </ProfileCard>
      </div>
    </div>
  );
}