import { useTeamCollaborationStore } from "@/stores/use-team-collaboration-store";
import type { ZaloAccount } from "@/types/zalo-account";

/** Nick theo phạm vi team — manager: mọi nick; NV: nick được gán (§3 contract). */
export async function fetchAccessibleAccounts(): Promise<ZaloAccount[]> {
  return useTeamCollaborationStore.getState().fetchAccessibleAccounts();
}