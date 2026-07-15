"use client";

import { IconArrowRight } from "@/components/landing/LandingIcons";
import { useAuthStore } from "@/stores/use-auth-store";
import Link from "next/link";

const DASHBOARD_HREF = "/me";
const ACCOUNT_HREF = "/me";

type LandingAuthActionsVariant = "nav" | "nav-mobile" | "hero" | "cta" | "footer";

interface LandingAuthActionsProps {
  variant: LandingAuthActionsVariant;
  onNavigate?: () => void;
}

function AuthSkeleton({ variant }: { variant: LandingAuthActionsVariant }) {
  if (variant === "footer") return null;

  if (variant === "nav") {
    return (
      <div
        className="hidden h-10 w-[168px] animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 md:block"
        aria-hidden
      />
    );
  }

  if (variant === "nav-mobile") {
    return (
      <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" aria-hidden />
    );
  }

  const sizeClass =
    variant === "hero" ? "h-12 w-full sm:w-[280px]" : "h-12 w-48 mx-auto";

  return <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${sizeClass}`} aria-hidden />;
}

export default function LandingAuthActions({
  variant,
  onNavigate,
}: LandingAuthActionsProps) {
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const displayName = user?.name ?? user?.username;

  if (!isBootstrapped) {
    return <AuthSkeleton variant={variant} />;
  }

  const handleClick = () => onNavigate?.();

  if (isAuthenticated) {
    switch (variant) {
      case "nav":
        return (
          <div className="hidden items-center gap-3 md:flex">
            {displayName && (
              <span className="landing-lead hidden max-w-[120px] truncate text-sm lg:inline">
                Xin chào, <span className="landing-title font-semibold">{displayName}</span>
              </span>
            )}
            <Link href={DASHBOARD_HREF} className="landing-btn-primary whitespace-nowrap px-4 py-2.5 text-sm">
              Vào bảng điều khiển
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        );

      case "nav-mobile":
        return (
          <div className="flex flex-col gap-2">
            {displayName && (
              <p className="landing-lead px-3 py-1 text-sm">
                Xin chào, <span className="landing-title font-semibold">{displayName}</span>
              </p>
            )}
            <Link
              href={DASHBOARD_HREF}
              className="landing-btn-primary w-full py-2.5 text-sm"
              onClick={handleClick}
            >
              Vào bảng điều khiển
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>
        );

      case "hero":
        return (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href={DASHBOARD_HREF} className="landing-btn-primary px-6 py-3">
              Vào bảng điều khiển
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href={ACCOUNT_HREF} className="landing-btn-secondary px-6 py-3">
              Trang thông tin
            </Link>
          </div>
        );

      case "cta":
        return (
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={DASHBOARD_HREF}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg hover:shadow-black/20"
            >
              Vào bảng điều khiển
              <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ACCOUNT_HREF}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Trang thông tin
            </Link>
          </div>
        );

      case "footer":
        return (
          <>
            <li>
              <Link href={DASHBOARD_HREF} className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                Bảng điều khiển
              </Link>
            </li>
            <li>
              <Link href={ACCOUNT_HREF} className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
                Trang thông tin
              </Link>
            </li>
          </>
        );
    }
  }

  switch (variant) {
    case "nav":
      return (
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/signin" className="landing-btn-secondary px-4 py-2.5 text-sm">
            Đăng nhập
          </Link>
          <Link href="/signup" className="landing-btn-primary px-4 py-2.5 text-sm">
            Bắt đầu miễn phí
          </Link>
        </div>
      );

    case "nav-mobile":
      return (
        <div className="flex flex-col gap-2">
          <Link
            href="/signin"
            className="landing-btn-secondary w-full py-2.5 text-sm"
            onClick={handleClick}
          >
            Đăng nhập
          </Link>
          <Link
            href="/signup"
            className="landing-btn-primary w-full py-2.5 text-sm"
            onClick={handleClick}
          >
            Bắt đầu miễn phí
          </Link>
        </div>
      );

    case "hero":
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href="/signup" className="landing-btn-primary px-6 py-3">
            Dùng thử miễn phí
            <IconArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/signin" className="landing-btn-secondary px-6 py-3">
            Đã có tài khoản
          </Link>
        </div>
      );

    case "cta":
      return (
        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-lg hover:shadow-black/20"
          >
            Tạo tài khoản miễn phí
            <IconArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signin"
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Đăng nhập
          </Link>
        </div>
      );

    case "footer":
      return (
        <>
          <li>
            <Link href="/signin" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
              Đăng nhập
            </Link>
          </li>
          <li>
            <Link href="/signup" className="cursor-pointer hover:text-gray-800 dark:hover:text-white/80">
              Đăng ký
            </Link>
          </li>
        </>
      );
  }
}