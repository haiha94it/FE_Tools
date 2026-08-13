import AuthHomeLink from "@/components/auth/AuthHomeLink";
import BrandLogo from "@/components/common/BrandLogo";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { APP_NAME } from "@/constants/brand";
import { ThemeProvider } from "@/context/ThemeContext";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gray-950">
      <ThemeProvider>
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/logo/auth.png"
            alt={APP_NAME}
            className="h-full w-full object-cover scale-102 blur-[3px] opacity-75 dark:opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/45 via-black/35 to-slate-950/55" />
        </div>

        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-lg rounded-3xl border border-white/30 bg-white/85 p-6 shadow-2xl backdrop-blur-2xl sm:p-10 dark:border-gray-700/60 dark:bg-gray-900/85">
            <Link href="/" className="mb-5 flex justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/25">
              <BrandLogo className="h-11 w-auto object-contain" priority />
            </Link>
            <div className="mb-4">
              <AuthHomeLink />
            </div>
            {children}
          </div>
        </div>

        <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
          <ThemeTogglerTwo />
        </div>
      </ThemeProvider>
    </div>
  );
}
