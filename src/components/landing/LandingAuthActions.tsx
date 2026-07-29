"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import gsap from "gsap";
import Link from "next/link";
import { useRef } from "react";

const DASHBOARD_HREF = "/me";
const ACCOUNT_HREF = "/me";

type LandingAuthActionsVariant = "nav" | "nav-mobile" | "hero" | "cta" | "footer";

interface LandingAuthActionsProps {
  variant: LandingAuthActionsVariant;
  onNavigate?: () => void;
}

// WORLD-CLASS GSAP BUTTON (MAGNETIC PULL + ARROW PASS LOOP + SHIMMER BEAM + WAVE TEXT)
function WorldClassGsapButton({
  href,
  label,
  className = "",
  onClick,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  const btnRef = useRef<HTMLAnchorElement>(null);
  const textCharsRef = useRef<HTMLSpanElement[]>([]);
  const arrowOldRef = useRef<SVGSVGElement>(null);
  const arrowNewRef = useRef<SVGSVGElement>(null);
  const shimmerRef = useRef<HTMLDivElement>(null);

  // Khởi tạo animation từng ký tự nhảy sóng
  const chars = label.split("");

  const handleMouseEnter = () => {
    if (!btnRef.current) return;

    // 1. Text Wave Letter Bounce
    if (textCharsRef.current.length > 0) {
      gsap.to(textCharsRef.current, {
        y: -3,
        duration: 0.15,
        stagger: 0.02,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }

    // 2. Arrow Pass Loop Effect (Mũi tên cũ biến mất sang phải, Mũi tên mới lướt chéo từ trái sang)
    if (arrowOldRef.current && arrowNewRef.current) {
      gsap.fromTo(
        arrowOldRef.current,
        { x: 0, opacity: 1 },
        { x: 16, opacity: 0, duration: 0.2, ease: "power2.in" }
      );
      gsap.fromTo(
        arrowNewRef.current,
        { x: -16, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35, delay: 0.08, ease: "back.out(2)" }
      );
    }

    // 3. Shimmer Beam Pass (Vệt sáng lấp lánh quét qua)
    if (shimmerRef.current) {
      gsap.fromTo(
        shimmerRef.current,
        { xPercent: -100 },
        { xPercent: 200, duration: 0.65, ease: "power2.inOut" }
      );
    }
  };

  const handleMouseLeave = () => {
    if (!btnRef.current) return;

    // Reset Magnetic & Arrow position
    gsap.to(btnRef.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });

    if (arrowOldRef.current && arrowNewRef.current) {
      gsap.to(arrowOldRef.current, { x: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
      gsap.to(arrowNewRef.current, { x: -16, opacity: 0, duration: 0.2, ease: "power2.in" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(btnRef.current, {
      x: x * 0.2,
      y: y * 0.2,
      duration: 0.3,
      ease: "power2.out",
    });
  };

  return (
    <Link
      ref={btnRef}
      href={href}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={`landing-btn-primary group relative inline-flex items-center justify-center gap-3 overflow-hidden shadow-lg shadow-brand-500/20 transition-all duration-300 ${className}`}
    >
      {/* Vệt sáng lấp lánh Shimmer Beam Sweeping */}
      <div
        ref={shimmerRef}
        className="pointer-events-none absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full"
        aria-hidden
      />

      {/* Dòng chữ nhảy sóng từng ký tự */}
      <span className="relative z-10 inline-flex items-center">
        {chars.map((char, index) => (
          <span
            key={index}
            ref={(el) => {
              if (el) textCharsRef.current[index] = el;
            }}
            className="inline-block transition-transform"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </span>

      {/* Khung chứa 2 Mũi tên xé gió Morphing Loop */}
      <div className="relative z-10 h-4 w-4 shrink-0 overflow-hidden">
        {/* Mũi tên ban đầu */}
        <svg
          ref={arrowOldRef}
          className="absolute inset-0 h-4 w-4 stroke-[2.2]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>

        {/* Mũi tên mới bay từ bên trái vào khi hover */}
        <svg
          ref={arrowNewRef}
          className="absolute inset-0 h-4 w-4 stroke-[2.2] opacity-0 -translate-x-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
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
            <WorldClassGsapButton
              href={DASHBOARD_HREF}
              label="Vào bảng điều khiển"
              className="px-4 py-2.5 text-sm"
            />
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
            <WorldClassGsapButton
              href={DASHBOARD_HREF}
              label="Vào bảng điều khiển"
              className="w-full py-2.5 text-sm"
              onClick={handleClick}
            />
          </div>
        );

      case "hero":
        return (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <WorldClassGsapButton
              href={DASHBOARD_HREF}
              label="Vào bảng điều khiển"
              className="px-6 py-3 text-base"
            />
            <Link href={ACCOUNT_HREF} className="landing-btn-secondary px-6 py-3">
              Trang thông tin
            </Link>
          </div>
        );

      case "cta":
        return (
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <WorldClassGsapButton
              href={DASHBOARD_HREF}
              label="Vào bảng điều khiển"
              className="px-6 py-3 text-base"
            />
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
          <WorldClassGsapButton
            href="/signup"
            label="Bắt đầu miễn phí"
            className="px-4 py-2.5 text-sm"
          />
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
          <WorldClassGsapButton
            href="/signup"
            label="Bắt đầu miễn phí"
            className="w-full py-2.5 text-sm"
            onClick={handleClick}
          />
        </div>
      );

    case "hero":
      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <WorldClassGsapButton
            href="/signup"
            label="Dùng thử miễn phí"
            className="px-6 py-3 text-base"
          />
          <Link href="/signin" className="landing-btn-secondary px-6 py-3">
            Đã có tài khoản
          </Link>
        </div>
      );

    case "cta":
      return (
        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <WorldClassGsapButton
            href="/signup"
            label="Tạo tài khoản miễn phí"
            className="px-6 py-3 text-base"
          />
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