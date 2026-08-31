import AuthHomeLink from "@/components/auth/AuthHomeLink";
import BrandLogo from "@/components/common/BrandLogo";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950">
      <ThemeProvider>
        {/* Modern Tech Abstract Background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* Ambient Glow Orbs */}
          <div className="absolute -top-32 -left-32 h-[450px] w-[450px] rounded-full bg-brand-500/20 blur-[130px]" />
          <div className="absolute top-1/3 -right-32 h-[500px] w-[500px] rounded-full bg-blue-600/15 blur-[140px]" />
          <div className="absolute -bottom-32 left-1/3 h-[450px] w-[450px] rounded-full bg-indigo-600/15 blur-[130px]" />

          {/* Center Subtle Radial Lighting */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.06)_0%,transparent_60%)]" />

          {/* Dark Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/70" />
        </div>

        <div className="relative z-10 flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-lg rounded-3xl border border-gray-200/80 bg-white/95 p-6 shadow-2xl backdrop-blur-2xl sm:p-10 dark:border-gray-800 dark:bg-gray-900/90">
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
