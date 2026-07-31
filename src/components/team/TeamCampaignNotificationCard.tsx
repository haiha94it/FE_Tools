"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Label from "@/components/form/Label";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import ContactAvatar from "@/components/zalo-contacts/shared/ContactAvatar";
import { getApiErrorMessage } from "@/lib/errors";
import { canSkipZaloProxyRequirement } from "@/lib/map-auth-user";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  getCampaignNotificationAccountLabel,
  useZaloCampaignNotificationStore,
} from "@/stores/use-zalo-campaign-notification-store";
import { useEffect } from "react";
import { HiOutlineBellAlert } from "react-icons/hi2";

export default function TeamCampaignNotificationCard() {
  const accounts = useZaloCampaignNotificationStore((s) => s.accounts);
  const selectedAccountId = useZaloCampaignNotificationStore(
    (s) => s.selectedAccountId,
  );
  const groups = useZaloCampaignNotificationStore((s) => s.groups);
  const selectedGroupId = useZaloCampaignNotificationStore(
    (s) => s.selectedGroupId,
  );
  const active = useZaloCampaignNotificationStore((s) => s.active);
  const loading = useZaloCampaignNotificationStore((s) => s.loading);
  const saving = useZaloCampaignNotificationStore((s) => s.saving);
  const accountsLoading = useZaloCampaignNotificationStore(
    (s) => s.accountsLoading,
  );
  const groupsLoading = useZaloCampaignNotificationStore(
    (s) => s.groupsLoading,
  );

  const fetchAll = useZaloCampaignNotificationStore((s) => s.fetchAll);
  const setSelectedAccountId = useZaloCampaignNotificationStore(
    (s) => s.setSelectedAccountId,
  );
  const setSelectedGroupId = useZaloCampaignNotificationStore(
    (s) => s.setSelectedGroupId,
  );
  const setActive = useZaloCampaignNotificationStore((s) => s.setActive);
  const save = useZaloCampaignNotificationStore((s) => s.save);
  const user = useAuthStore((s) => s.user);
  const canSkipProxy = canSkipZaloProxyRequirement(user);

  useEffect(() => {
    if (!user) return;
    void fetchAll();
  }, [fetchAll, user]);

  const handleSave = async () => {
    try {
      await save();
      toast.success("Đã lưu thiết lập thông báo chiến dịch.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <ComponentCard
      title="Thông báo chiến dịch"
      desc="Chọn nick gửi và nhóm Zalo nhận thông báo chung khi chiến dịch có sự kiện mới."
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50/60 px-4 py-3.5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <HiOutlineBellAlert
            className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
            size={21}
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            Nick gửi phải đang tham gia nhóm nhận thông báo. Danh sách nhóm sẽ
            thay đổi theo nick Zalo được chọn.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                1
              </span>
              <Label className="mb-0">Nick Zalo gửi thông báo</Label>
            </div>
            <div className="custom-scrollbar h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
            {accountsLoading ? (
              <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                Đang tải danh sách nick...
              </p>
            ) : accounts.length === 0 ? (
              <p className="flex h-full items-center justify-center px-4 text-center text-sm text-gray-500">
                Chưa có nick hoạt động (checkpoint tắt
                {canSkipProxy ? "" : ", proxy OK hoặc không gắn proxy"}).
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => {
                  const selected = selectedAccountId === account.id;
                  const name =
                    account.name?.trim() ||
                    account.phone_number?.trim() ||
                    `Nick #${account.id}`;
                  return (
                    <button
                      key={account.id}
                      type="button"
                      onClick={() =>
                        void setSelectedAccountId(selected ? null : account.id)
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <ContactAvatar
                        name={name}
                        avatar={account.avatar}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getCampaignNotificationAccountLabel(account)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                2
              </span>
              <Label className="mb-0">Nhóm Zalo nhận thông báo</Label>
            </div>
            <div className="custom-scrollbar h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900">
            {groupsLoading ? (
              <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                Đang tải danh sách nhóm...
              </p>
            ) : !selectedAccountId ? (
              <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                Chọn nick Zalo trước để xem danh sách nhóm.
              </p>
            ) : groups.length === 0 ? (
              <p className="flex h-full items-center justify-center text-center text-sm text-gray-500">
                Nick này chưa có nhóm đang tham gia.
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => {
                  const selected = selectedGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() =>
                        setSelectedGroupId(selected ? null : group.id)
                      }
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                        selected
                          ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/10"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                    >
                      <ContactAvatar
                        name={group.name || `Nhóm #${group.id}`}
                        avatar={group.avt}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-white/90">
                          {group.name || `Nhóm #${group.id}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {group.total_member
                            ? `${group.total_member} thành viên`
                            : "Nhóm Zalo"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 rounded-xl border border-gray-200 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
          <div className="flex items-center justify-between gap-4 sm:flex-1">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {active ? "Đang bật thông báo" : "Đang tắt thông báo"}
              </p>
              <p className="text-xs text-gray-500">
                Bật để nhận tin khi chiến dịch có sự kiện mới.
              </p>
            </div>
            <Switch
              checked={active}
              disabled={loading || saving}
              onChange={setActive}
            />
          </div>

          <Button
            className="w-full sm:w-auto"
            onClick={() => void handleSave()}
            disabled={
              loading || saving || !selectedAccountId || !selectedGroupId
            }
          >
            {saving ? "Đang lưu..." : "Lưu thiết lập"}
          </Button>
        </div>
      </div>
    </ComponentCard>
  );
}
