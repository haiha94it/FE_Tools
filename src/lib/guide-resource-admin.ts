import { canManageGuidesAndResources } from "@/lib/map-auth-user";
import { useAuthStore } from "@/stores/use-auth-store";

export function assertGuidesAndResourcesAdmin(): void {
  const user = useAuthStore.getState().user;
  if (!canManageGuidesAndResources(user)) {
    throw new Error("Chỉ quản trị viên mới được thao tác nội dung hướng dẫn và tài nguyên.");
  }
}