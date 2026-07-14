"use client";

import AccountChangePasswordCard from "@/components/account/AccountChangePasswordCard";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import AvatarText from "@/components/ui/avatar/AvatarText";
import Badge from "@/components/ui/badge/Badge";
import { APP_NAME } from "@/constants/brand";
import {
  formatAccountDate,
  formatCoinBalance,
  getUserRoleLabel,
  isAccountExpired,
} from "@/lib/account-utils";
import {
  ArrowRightIcon,
  BoltIcon,
  BoxIcon,
  CalenderIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  EnvelopeIcon,
  GroupIcon,
  LockIcon,
  MailIcon,
  PaperPlaneIcon,
  ShootingStarIcon,
  UserCircleIcon,
  UserIcon,
} from "@/icons";
import { useAuthStore } from "@/stores/use-auth-store";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type SVGProps,
} from "react";

// purple utility — TailAdmin không có token riêng
const PURPLE_ICON = "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400";
const FACEBOOK_ICON = "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

function InfoRow({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: SvgIcon;
  iconClass: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl px-2 py-3 transition hover:bg-gray-50/80 dark:hover:bg-white/[0.02]">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        <Icon className="size-[18px]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 break-words text-sm font-semibold text-gray-800 dark:text-white/90">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconWrapClass,
  label,
  value,
  hint,
}: {
  icon: SvgIcon;
  iconWrapClass: string;
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconWrapClass}`}>
        <Icon className="size-6" />
      </div>
      <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-800 dark:text-white/90">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconClass,
}: {
  icon: SvgIcon;
  title: string;
  subtitle?: string;
  iconClass: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800 sm:px-6">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="size-5" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

const SHORTCUTS = [
  {
    href: "/zalo-accounts",
    label: "Tài khoản Zalo",
    desc: "Quản lý kết nối",
    icon: GroupIcon,
    iconClass: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  },
  {
    href: "/zalo-messages",
    label: "Tin nhắn",
    desc: "Hộp thư đa kênh",
    icon: ChatIcon,
    iconClass: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  },
  {
    href: "/shop",
    label: "Cửa hàng",
    desc: "Mini shop bán hàng",
    icon: BoxIcon,
    iconClass: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  },
  {
    href: "/guides",
    label: "Hướng dẫn",
    desc: "Tài liệu & tips",
    icon: DocsIcon,
    iconClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  },
] as const;

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
    <div>
      <PageBreadCrumb pageTitle="Trang thông tin" />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <div className="relative overflow-hidden rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 p-5 sm:p-7">
            <Image
              src="/images/shape/grid-01.svg"
              alt=""
              width={400}
              height={400}
              className="pointer-events-none absolute -right-8 -top-10 opacity-20"
              aria-hidden
            />
            <div className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="rounded-full bg-white/20 p-1 ring-2 ring-white/30">
                  <AvatarText
                    name={user?.name ?? user?.username ?? "U"}
                    className="!h-16 !w-16 !text-xl !bg-white !text-brand-600 sm:!h-20 sm:!w-20"
                  />
                </div>
                <div className="min-w-0 text-white">
                  <p className="text-sm font-medium text-white/75">Xin chào 👋</p>
                  <h2 className="mt-1 truncate text-2xl font-bold sm:text-3xl">
                    {user?.name ?? user?.username ?? "—"}
                  </h2>
                  <p className="mt-1 truncate text-sm text-white/80">@{user?.username ?? "—"}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
                      <ShootingStarIcon className="size-3.5" />
                      {roleLabel}
                    </span>
                    {expired ? (
                      <span className="rounded-full bg-error-500/90 px-3 py-1 text-xs font-semibold">
                        Đã hết hạn
                      </span>
                    ) : (
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                        {APP_NAME}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={refreshing || isLoading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25 disabled:opacity-60"
                >
                  <PaperPlaneIcon className="size-4" />
                  {refreshing ? "Đang tải…" : "Làm mới"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={isLoading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-50 disabled:opacity-60"
                >
                  Đăng xuất
                </button>
              </div>
            </div>

            {expired ? (
              <p className="relative mt-5 rounded-xl bg-error-500/20 px-4 py-3 text-sm text-white ring-1 ring-white/20">
                Tài khoản đã hết hạn sử dụng. Vui lòng liên hệ quản trị để gia hạn.
              </p>
            ) : null}
          </div>
        </div>

        <div className="col-span-12 sm:col-span-6 xl:col-span-4">
          <StatCard
            icon={CalenderIcon}
            iconWrapClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            label="Hạn sử dụng"
            value={formatAccountDate(user?.expirationDate)}
            hint={expired ? "Cần gia hạn" : "Tài khoản còn hiệu lực"}
          />
        </div>
        <div className="col-span-12 sm:col-span-6 xl:col-span-4">
          <StatCard
            icon={DollarLineIcon}
            iconWrapClass="bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
            label="Số dư xu"
            value={formatCoinBalance(user?.coinBalance)}
            hint="Dùng cho các tính năng trả phí"
          />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <StatCard
            icon={GroupIcon}
            iconWrapClass="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
            label="Tài khoản Zalo"
            value={`${user?.accountCount ?? 0} / ${user?.accountLimit ?? 0}`}
            hint={user?.accountLimit ? `Đã dùng ${zaloUsage}% hạn mức` : undefined}
          />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              icon={UserCircleIcon}
              title="Thông tin cá nhân"
              subtitle="Dữ liệu từ tài khoản đăng nhập"
              iconClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
            />
            <div className="grid gap-1 px-3 pb-4 sm:grid-cols-2 sm:px-4">
              <InfoRow
                icon={UserIcon}
                iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                label="Tài khoản"
                value={user?.username ?? "—"}
              />
              <InfoRow
                icon={UserCircleIcon}
                iconClass="bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
                label="Họ và tên"
                value={user?.name ?? "Chưa cập nhật"}
              />
              <InfoRow
                icon={EnvelopeIcon}
                iconClass="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                label="Email"
                value={user?.email || "—"}
              />
              <InfoRow
                icon={MailIcon}
                iconClass="bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400"
                label="Số điện thoại"
                value={user?.phone || "—"}
              />
              <InfoRow
                icon={ChatIcon}
                iconClass={FACEBOOK_ICON}
                label="Facebook"
                value={
                  user?.facebookLink ? (
                    <a
                      href={user.facebookLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-600 hover:underline dark:text-brand-400"
                    >
                      {user.facebookLink}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
              <InfoRow
                icon={ShootingStarIcon}
                iconClass={PURPLE_ICON}
                label="Quyền hạn"
                value={
                  <Badge size="sm" color="primary">
                    {roleLabel}
                  </Badge>
                }
              />
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              icon={BoltIcon}
              title="Truy cập nhanh"
              subtitle="Các module chính của hệ thống"
              iconClass="bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
            />
            <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
              {SHORTCUTS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex cursor-pointer flex-col rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition hover:border-brand-200 hover:bg-brand-50/50 hover:shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-800 dark:hover:bg-brand-500/5"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-800 dark:text-white/90">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                    <ArrowRightIcon className="mt-3 size-4 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500 dark:text-gray-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7">
          <AccountChangePasswordCard />
        </div>

        <div className="col-span-12 lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <SectionHeader
              icon={DocsIcon}
              title="Hỗ trợ tài khoản"
              subtitle="Quên mật khẩu hoặc cần tài liệu?"
              iconClass="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            />
            <div className="space-y-3 p-4 sm:p-5">
              <Link
                href="/forgot-password"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                  <LockIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Yêu cầu reset mật khẩu
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gửi yêu cầu khôi phục qua hệ thống
                  </p>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-gray-300 group-hover:text-brand-500" />
              </Link>
              <Link
                href="/dieu-khoan"
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/60 px-4 py-3.5 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:bg-white/[0.02] dark:hover:border-brand-800"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <DocsIcon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    Điều khoản sử dụng
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chính sách & quy định dịch vụ
                  </p>
                </div>
                <ArrowRightIcon className="size-4 shrink-0 text-gray-300 group-hover:text-brand-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

