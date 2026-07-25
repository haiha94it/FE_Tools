"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
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

export default function CampaignNotificationView() {
  const accounts = useZaloCampaignNotificationStore((s) => s.accounts);
  const selectedAccountId = useZaloCampaignNotificationStore(
    (s) => s.selectedAccountId,
  );
  const phoneNumber = useZaloCampaignNotificationStore((s) => s.phoneNumber);
  const active = useZaloCampaignNotificationStore((s) => s.active);
  const loading = useZaloCampaignNotificationStore((s) => s.loading);
  const saving = useZaloCampaignNotificationStore((s) => s.saving);
  const accountsLoading = useZaloCampaignNotificationStore(
    (s) => s.accountsLoading,
  );

  const fetchAll = useZaloCampaignNotificationStore((s) => s.fetchAll);
  const setSelectedAccountId = useZaloCampaignNotificationStore(
    (s) => s.setSelectedAccountId,
  );
  const setPhoneNumber = useZaloCampaignNotificationStore((s) => s.setPhoneNumber);
  const setActive = useZaloCampaignNotificationStore((s) => s.setActive);
  const save = useZaloCampaignNotificationStore((s) => s.save);
  const user = useAuthStore((s) => s.user);
  const canSkipProxy = canSkipZaloProxyRequirement(user);

  useEffect(() => {
    if (!user) return;
    void fetchAll();
  }, [fetchAll, user?.id]);

  const handleSave = async () => {
    try {
      await save();
      toast.success("Đã lưu thiết lập thông báo chiến dịch.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
      <PageBreadcrumb
        pageTitle="Thông báo chiến dịch"
        parents={[
          { label: "Chiến dịch", href: "/zalo-campaigns/campaign-notification" },
        ]}
      />

      <ComponentCard
        title="Thiết lập thông báo chiến dịch tự động"
        desc="Nhận tin Zalo khi có sự kiện chiến dịch (vd. khách hỏi mua). Cần 1 nick Zalo gửi và 1 SĐT có Zalo nhận — nên kết bạn 2 nick với nhau."
        fill
      >
        <div className="custom-scrollbar mx-auto flex h-0 min-h-0 w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pr-1">
          <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <HiOutlineBellAlert
              className="mt-0.5 shrink-0 text-brand-600 dark:text-brand-400"
              size={22}
              aria-hidden
            />
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              Không thể tự gửi Zalo cho chính mình — chọn nick gửi thông báo và SĐT
              nick khác (đã kết bạn) để nhận tin.
            </p>
          </div>

          <div>
            <Label>Nick Zalo gửi thông báo</Label>
            {accountsLoading ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Đang tải danh sách nick...
              </p>
            ) : accounts.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-500">
                Chưa có nick hoạt động (checkpoint tắt
                {canSkipProxy ? "" : ", proxy OK hoặc không gắn proxy"}).
              </p>
            ) : (
              <div className="custom-scrollbar mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2 dark:border-gray-700">
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
                        setSelectedAccountId(selected ? null : account.id)
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

          <div>
            <Label>Số điện thoại Zalo nhận thông báo</Label>
            <Input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="VD: 0912345678"
              disabled={loading || saving}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
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

          <div className="flex justify-end">
            <Button
              onClick={() => void handleSave()}
              disabled={loading || saving || !selectedAccountId}
            >
              {saving ? "Đang lưu..." : "Lưu thiết lập"}
            </Button>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}