import { fetchAccessibleAccounts } from "@/lib/fetch-accessible-accounts";
import type { ZaloAccount } from "@/types/zalo-account";
import type {
  ContactsTab,
  FriendModal,
  GroupModal,
} from "@/types/zalo-contacts";
import { create } from "zustand";

interface ZaloContactsState {
  accounts: ZaloAccount[];
  isLoadingAccounts: boolean;
  selectedAccountId: number | null;
  activeTab: ContactsTab;
  friendView: NonNullable<FriendModal>;
  groupView: NonNullable<GroupModal>;
  groupRefreshKey: number;

  fetchAccounts: () => Promise<void>;
  setSelectedAccountId: (id: number | null) => void;
  setActiveTab: (tab: ContactsTab) => void;
  setFriendView: (view: NonNullable<FriendModal>) => void;
  setGroupView: (view: NonNullable<GroupModal>) => void;
  bumpGroupRefresh: () => void;
}

export const useZaloContactsStore = create<ZaloContactsState>((set, get) => ({
  accounts: [],
  isLoadingAccounts: false,
  selectedAccountId: null,
  activeTab: "friends",
  friendView: "scan",
  groupView: "scan",
  groupRefreshKey: 0,

  fetchAccounts: async () => {
    set({ isLoadingAccounts: true });
    try {
      const accounts = await fetchAccessibleAccounts();
      set({ accounts, isLoadingAccounts: false });
      const { selectedAccountId } = get();
      if (!selectedAccountId && accounts[0]) {
        set({ selectedAccountId: accounts[0].id });
      }
    } catch {
      set({ isLoadingAccounts: false });
    }
  },

  setSelectedAccountId: (selectedAccountId) => set({ selectedAccountId }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setFriendView: (friendView) => set({ friendView }),
  setGroupView: (groupView) => set({ groupView }),
  bumpGroupRefresh: () =>
    set((state) => ({ groupRefreshKey: state.groupRefreshKey + 1 })),
}));