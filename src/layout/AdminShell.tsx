"use client";

import AcceptTermsGate from "@/components/auth/AcceptTermsGate";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TeamRouteGuard } from "@/components/auth/TeamRouteGuard";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React from "react";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <AuthGuard>
      <TeamRouteGuard>
      <div className="h-dvh overflow-hidden xl:flex">
        <AppSidebar />
        <Backdrop />
        <div
          className={`flex h-dvh min-w-0 flex-1 flex-col overflow-hidden transition-all duration-300 ease-in-out ${mainContentMargin}`}
        >
          <AppHeader />
          <main className="custom-scrollbar mx-auto flex h-0 min-h-0 w-full max-w-(--breakpoint-2xl) flex-1 flex-col overflow-x-hidden overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
      {/* Popup điều khoản đăng nhập lần đầu — accept_terms */}
      <AcceptTermsGate />
      </TeamRouteGuard>
    </AuthGuard>
  );
}