"use client";

import { canAccessAdminRoute } from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Chặn NV / user không đủ quyền vào route manager-only (proxy, team, post-video…) */
export function TeamRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);

  const allowed = canAccessAdminRoute(pathname, user);

  useEffect(() => {
    if (!isBootstrapped || !user || allowed) return;
    router.replace("/zalo-messenger");
  }, [allowed, isBootstrapped, pathname, router, user]);

  if (!isBootstrapped || !user) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}