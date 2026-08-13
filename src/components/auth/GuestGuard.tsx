"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";

/** Trang guest (signin) — đã đăng nhập thì chuyển về trang chủ */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isBootstrapped && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isBootstrapped, isAuthenticated, router]);

  if (!isBootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}