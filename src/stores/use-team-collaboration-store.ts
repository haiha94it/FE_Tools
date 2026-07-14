import { teamPermissionsService, createFullPermissionsMap } from "@/services/team-permissions.service";
import { zaloAccountService } from "@/services/zalo-account.service";
import { runAsyncAction } from "@/stores/helpers/async-actions";
import { useAuthStore } from "@/stores/use-auth-store";
import type { CampaignPermissionsMap } from "@/types/team-collaboration";
import type { ZaloAccount } from "@/types/zalo-account";
import { create } from "zustand";
import { isEmployeeUser, isManagerUser } from "@/lib/team-collaboration-utils";

interface TeamCollaborationState {
  campaignPermissions: CampaignPermissionsMap | null;
  assignedAccounts: ZaloAccount[];
  permissionsLoaded: boolean;
  accountsLoaded: boolean;
  isLoading: boolean;
  error: string | null;

  bootstrapTeamContext: () => Promise<void>;
  refreshCampaignPermissions: () => Promise<void>;
  refreshAssignedAccounts: () => Promise<void>;
  fetchAccessibleAccounts: () => Promise<ZaloAccount[]>;
  setCampaignPermissions: (permissions: CampaignPermissionsMap) => void;
}

export const useTeamCollaborationStore = create<TeamCollaborationState>(
  (set, get) => ({
    campaignPermissions: null,
    assignedAccounts: [],
    permissionsLoaded: false,
    accountsLoaded: false,
    isLoading: false,
    error: null,

    bootstrapTeamContext: async () => {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({
          campaignPermissions: null,
          assignedAccounts: [],
          permissionsLoaded: true,
          accountsLoaded: true,
        });
        return;
      }

      await runAsyncAction(
        async () => {
          const [permissions, accounts] = await Promise.all([
            teamPermissionsService.getMyCampaignPermissions(),
            get().fetchAccessibleAccounts(),
          ]);
          set({
            campaignPermissions: permissions,
            assignedAccounts: accounts,
            permissionsLoaded: true,
            accountsLoaded: true,
          });
        },
        set,
        { silent: true },
      ).catch(() => {
        if (isManagerUser(user)) {
          set({
            campaignPermissions: createFullPermissionsMap(undefined, true),
            permissionsLoaded: true,
          });
        } else {
          set({ permissionsLoaded: true, accountsLoaded: true });
        }
      });
    },

    refreshCampaignPermissions: async () => {
      const permissions = await teamPermissionsService.getMyCampaignPermissions();
      set({ campaignPermissions: permissions, permissionsLoaded: true });
    },

    refreshAssignedAccounts: async () => {
      const accounts = await get().fetchAccessibleAccounts();
      set({ assignedAccounts: accounts, accountsLoaded: true });
    },

    fetchAccessibleAccounts: async () => {
      const user = useAuthStore.getState().user;
      if (isEmployeeUser(user)) {
        return teamPermissionsService.getMyAccountAssignments();
      }
      return zaloAccountService.list();
    },

    setCampaignPermissions: (permissions) => {
      set({ campaignPermissions: permissions, permissionsLoaded: true });
    },
  }),
);