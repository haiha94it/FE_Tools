"use client";

import {
  canAccessAdminRoute,
  isCampaignPermissionPath,
} from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTeamCollaborationStore } from "@/stores/use-team-collaboration-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Chặn NV / user không đủ quyền vào route manager-only hoặc campaign bị tắt */
export function TeamRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isBootstrapped = useAuthStore((s) => s.isBootstrapped);
  const campaignPermissions = useTeamCollaborationStore(
    (s) => s.campaignPermissions,
  );
  const permissionsLoaded = useTeamCollaborationStore(
    (s) => s.permissionsLoaded,
  );

  const needsPermissions = isCampaignPermissionPath(pathname);
  const ready = isBootstrapped && user && (!needsPermissions || permissionsLoaded);
  const allowed = ready
    ? canAccessAdminRoute(pathname, user, campaignPermissions)
    : true;

  useEffect(() => {
    if (!ready || allowed) return;
    router.replace("/zalo-messenger");
  }, [allowed, ready, router]);

  if (!isBootstrapped || !user) {
    return null;
  }

  if (needsPermissions && !permissionsLoaded) {
    return null;
  }

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}