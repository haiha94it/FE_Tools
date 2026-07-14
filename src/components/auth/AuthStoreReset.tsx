"use client";

import { useAuthStore } from "@/stores/use-auth-store";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/** Xóa lỗi/loading auth khi chuyển giữa signin, signup, forgot-password */
export default function AuthStoreReset() {
  const pathname = usePathname();
  const clearError = useAuthStore((s) => s.clearError);

  useEffect(() => {
    clearError();
    useAuthStore.setState({ isLoading: false });
  }, [pathname, clearError]);

  return null;
}