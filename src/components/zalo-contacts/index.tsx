"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPageClass } from "@/components/ui/table/ScrollableTableContainer";
import { useZaloContactsStore } from "@/stores/use-zalo-contacts-store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import FriendRecommendPanel from "./friends/FriendRecommendModal";
import ScanFriendsPanel from "./friends/ScanFriendsModal";
import SentFriendRequestsPanel from "./friends/SentFriendRequestsModal";
import FriendsToolbar from "./friends/FriendsToolbar";
import GetGroupLinkPanel from "./groups/GetGroupLinkModal";
import ScanGroupsPanel from "./groups/ScanGroupsModal";
import GroupsToolbar from "./groups/GroupsToolbar";
import AccountSelect from "./shared/AccountSelect";
import ContactLabelPanel from "./shared/ContactLabelModal";
import ContactsTabs from "./shared/ContactsTabs";

export default function ZaloContactsView() {
  const searchParams = useSearchParams();
  const accountIdParam = searchParams.get("accountId");

  const accounts = useZaloContactsStore((s) => s.accounts);
  const isLoadingAccounts = useZaloContactsStore((s) => s.isLoadingAccounts);
  const selectedAccountId = useZaloContactsStore((s) => s.selectedAccountId);
  const activeTab = useZaloContactsStore((s) => s.activeTab);
  const friendView = useZaloContactsStore((s) => s.friendView);
  const groupView = useZaloContactsStore((s) => s.groupView);

  const fetchAccounts = useZaloContactsStore((s) => s.fetchAccounts);
  const setSelectedAccountId = useZaloContactsStore(
    (s) => s.setSelectedAccountId,
  );
  const setActiveTab = useZaloContactsStore((s) => s.setActiveTab);
  const setFriendView = useZaloContactsStore((s) => s.setFriendView);
  const setGroupView = useZaloContactsStore((s) => s.setGroupView);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (!accountIdParam) return;
    const id = Number(accountIdParam);
    if (Number.isFinite(id)) setSelectedAccountId(id);
  }, [accountIdParam, setSelectedAccountId]);

  const noAccount = !selectedAccountId;

  return (
    <div className={adminDataPageClass}>
      <PageBreadcrumb
        pageTitle="Quản lý Bạn bè / Nhóm"
        showPageTitle={false}
        className="!mb-0"
        parents={[
          { label: "Quản lý tài khoản Zalo", href: "/zalo-accounts" },
        ]}
      />

      <ComponentCard fill>
        <div className="flex shrink-0 min-w-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="w-full min-w-0 sm:max-w-xs">
            <AccountSelect
              accounts={accounts}
              value={selectedAccountId}
              disabled={isLoadingAccounts}
              onChange={setSelectedAccountId}
            />
          </div>
          <ContactsTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {activeTab === "friends" ? (
          <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 min-w-0">
              <FriendsToolbar
                activeView={friendView}
                disabled={noAccount}
                onSelect={setFriendView}
              />
            </div>
            {noAccount ? (
              <p className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                Chọn tài khoản Zalo để quản lý bạn bè và nhóm.
              </p>
            ) : (
              <div
                className={`flex h-0 min-h-0 flex-1 flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800 ${
                  friendView === "label"
                    ? "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2"
                    : "mt-3 pt-3 sm:mt-4 sm:pt-4"
                }`}
              >
                <ScanFriendsPanel
                  active={friendView === "scan"}
                  accountId={selectedAccountId}
                />
                <ContactLabelPanel
                  active={friendView === "label"}
                  scope="friend"
                  accountId={selectedAccountId}
                />
                <FriendRecommendPanel
                  active={friendView === "recommend"}
                  accountId={selectedAccountId}
                />
                <SentFriendRequestsPanel
                  active={friendView === "sent-requests"}
                  accountId={selectedAccountId}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-0 min-h-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 min-w-0">
              <GroupsToolbar
                activeView={groupView}
                disabled={noAccount}
                onSelect={setGroupView}
              />
            </div>
            {noAccount ? (
              <p className="shrink-0 text-sm text-gray-500 dark:text-gray-400">
                Chọn tài khoản Zalo để quản lý bạn bè và nhóm.
              </p>
            ) : (
              <div
                className={`flex h-0 min-h-0 flex-1 flex-col overflow-hidden border-t border-gray-100 dark:border-gray-800 ${
                  groupView === "label"
                    ? "mt-1.5 pt-1.5 sm:mt-2 sm:pt-2"
                    : "mt-3 pt-3 sm:mt-4 sm:pt-4"
                }`}
              >
                <ScanGroupsPanel
                  active={groupView === "scan"}
                  accountId={selectedAccountId}
                />
                <ContactLabelPanel
                  active={groupView === "label"}
                  scope="group"
                  accountId={selectedAccountId}
                />
                <GetGroupLinkPanel
                  active={groupView === "get-link"}
                  accountId={selectedAccountId}
                />
              </div>
            )}
          </div>
        )}
      </ComponentCard>
    </div>
  );
}