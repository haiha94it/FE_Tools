"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/use-auth-store";

function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Đang tải...
        </p>
      </div>
    </div>
  );
}

/** Bảo vệ route admin — chưa đăng nhập thì chuyển về /login. */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isBootstrapped && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isBootstrapped, isAuthenticated, router]);

  if (!isBootstrapped) {
    return <AuthLoading />;
  }

  if (!isAuthenticated) {
    return <AuthLoading />;
  }

  return <>{children}</>;
}
