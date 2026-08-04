"use client";

import AvatarText from "@/components/ui/avatar/AvatarText";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import TimePicker from "@/components/form/time-picker";
import { Modal } from "@/components/ui/modal";
import {
  campaignFormAccountPaneClass,
  campaignFormBodyClass,
  campaignFormGridWideClass,
  campaignFormMainClass,
  campaignFormModalPanelClass,
  campaignFormModalPanelClassWizard,
  campaignFormScrollPaneClass,
  campaignFormWizardListScrollClass,
  CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
} from "@/components/zalo-campaigns/CampaignFormModalLayout";
import {
  CampaignFormWizardFooter,
  CampaignFormWizardHeader,
  type CampaignWizardStep,
} from "@/components/zalo-campaigns/CampaignFormWizard";
import { useCampaignFormWizard } from "@/hooks/use-campaign-form-wizard";
import { TimeIcon } from "@/icons";
import {
  formatTimeForApi,
  parseTimeToDate,
  splitLines,
} from "@/lib/zalo-join-group-campaign-utils";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useZaloJoinGroupCampaignStore } from "@/stores/use-zalo-join-group-campaign-store";
import type { JoinGroupCampaign } from "@/types/zalo-join-group-campaign";
import type { ZaloAccount } from "@/types/zalo-account";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

interface JoinGroupCampaignFormModalProps {
  open: boolean;
  editingCampaign: JoinGroupCampaign | null;
  accounts: ZaloAccount[];
  accountsLoading: boolean;
  onClose: () => void;
  readOnly?: boolean;
}

const textareaClassName =
  "w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

const defaultStart = () => {
  const date = new Date();
  date.setHours(7, 0, 0, 0);
  return date;
};

const defaultEnd = () => {
  const date = new Date();
  date.setHours(21, 0, 0, 0);
  return date;
};

export default function JoinGroupCampaignFormModal({
  open,
  editingCampaign,
  accounts,
  accountsLoading,
  onClose,
  readOnly = false,
}: JoinGroupCampaignFormModalProps) {
  const createOrEditCampaign = useZaloJoinGroupCampaignStore(
    (s) => s.createOrEditCampaign,
  );
  const saving = useZaloJoinGroupCampaignStore((s) => s.saving);
  const { isWizard, wizardStep, setWizardStep, goBack, goNext } =
    useCampaignFormWizard(open);

  const [name, setName] = useState("");
  const [delayTime, setDelayTime] = useState("350");
  const [numberCount, setNumberCount] = useState("10");
  const [groupLinks, setGroupLinks] = useState("");
  const [divide, setDivide] = useState(false);
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [selectedAccountIds, setSelectedAccountIds] = useState<number[]>([]);
  const [accountSearch, setAccountSearch] = useState("");

  const resetForm = () => {
    setName("");
    setDelayTime("350");
    setNumberCount("10");
    setGroupLinks("");
    setDivide(false);
    setStartTime(defaultStart());
    setEndTime(defaultEnd());
    setSelectedAccountIds([]);
    setAccountSearch("");
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (!editingCampaign) {
      resetForm();
      return;
    }

    setName(editingCampaign.name ?? "");
    setDelayTime(String(editingCampaign.delay_time ?? 350));
    setNumberCount(String(editingCampaign.number_count ?? 10));
    setGroupLinks((editingCampaign.list_group ?? []).join("\n"));
    setDivide(Boolean(editingCampaign.divide));
    setStartTime(parseTimeToDate(editingCampaign.from_time) ?? defaultStart());
    setEndTime(parseTimeToDate(editingCampaign.to_time) ?? defaultEnd());
    setSelectedAccountIds(editingCampaign.accounts ?? []);
  }, [open, editingCampaign]);

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    if (!query) return accounts;
    return accounts.filter((item) =>
      [item.name, item.phone_number]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [accounts, accountSearch]);

  const allFilteredAccountsSelected =
    filteredAccounts.length > 0 &&
    filteredAccounts.every((account) => selectedAccountIds.includes(account.id));

  const toggleAccount = (id: number) => {
    setSelectedAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /** Chọn hoặc bỏ chọn toàn bộ tài khoản đang hiển thị theo tìm kiếm. */
  const toggleAllFilteredAccounts = () => {
    const filteredIds = new Set(filteredAccounts.map((account) => account.id));
    setSelectedAccountIds((current) =>
      allFilteredAccountsSelected
        ? current.filter((id) => !filteredIds.has(id))
        : Array.from(new Set([...current, ...filteredIds])),
    );
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên kịch bản.");
      return;
    }
    const delay = Number(delayTime);
    const count = Number(numberCount);
    if (!Number.isFinite(delay) || delay <= 0) {
      toast.error("Thời gian chờ không hợp lệ.");
      return;
    }
    if (!Number.isFinite(count) || count <= 0) {
      toast.error("Số lượt tham gia không hợp lệ.");
      return;
    }
    if (!selectedAccountIds.length) {
      toast.error("Chọn ít nhất một tài khoản Zalo.");
      return;
    }

    try {
      await createOrEditCampaign({
        id_category: editingCampaign?.id ?? null,
        name: trimmedName,
        list_group: splitLines(groupLinks),
        delay_time: delay,
        number_count: count,
        divide,
        id_accounts: selectedAccountIds,
        from_time: formatTimeForApi(startTime),
        to_time: formatTimeForApi(endTime),
      });
      toast.success(
        editingCampaign ? "Đã cập nhật kịch bản." : "Đã tạo kịch bản mới.",
      );
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const wizardSteps: CampaignWizardStep[] = useMemo(
    () => [
      {
        id: "config",
        title: "Cấu hình",
        hint: "Tên, tốc độ, khung giờ và chia đều link",
      },
      {
        id: "links",
        title: "Link nhóm",
        hint: "Danh sách link nhóm Zalo (mỗi dòng một link)",
      },
      {
        id: "accounts",
        title: "Nick Zalo",
        hint: "Chọn nick tham gia các nhóm",
      },
    ],
    [],
  );

  const validateWizardStep = useCallback(
    (step: number): boolean => {
      if (step === 0) {
        if (!name.trim()) {
          toast.error("Vui lòng nhập tên kịch bản.");
          return false;
        }
        const delay = Number(delayTime);
        const count = Number(numberCount);
        if (!Number.isFinite(delay) || delay <= 0) {
          toast.error("Thời gian chờ không hợp lệ.");
          return false;
        }
        if (!Number.isFinite(count) || count <= 0) {
          toast.error("Số lượt tham gia không hợp lệ.");
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!splitLines(groupLinks).length) {
          toast.error("Nhập ít nhất một link nhóm.");
          return false;
        }
        return true;
      }
      return true;
    },
    [name, delayTime, numberCount, groupLinks],
  );

  const modalTitle = editingCampaign
    ? readOnly
      ? "Xem kịch bản tham gia nhóm"
      : "Sửa kịch bản tham gia nhóm"
    : "Thêm kịch bản tham gia nhóm";

  const configFields = (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
          Tên kịch bản
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập tên kịch bản"
          disabled={saving}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Thời gian chờ (giây)
          </label>
          <Input
            type="number"
            value={delayTime}
            onChange={(e) => setDelayTime(e.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Số lượt tham gia / ngày
          </label>
          <Input
            type="number"
            value={numberCount}
            onChange={(e) => setNumberCount(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-700 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <Checkbox checked disabled onChange={() => {}} />
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <TimeIcon className="size-4 text-brand-500 dark:text-brand-400" />
            Khung giờ chạy
          </span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-theme-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            Bắt buộc
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white px-2 py-1 text-theme-xs font-medium text-gray-500 shadow-theme-xs dark:bg-gray-900 dark:text-gray-400">
              Từ
            </span>
            <TimePicker
              value={startTime}
              onChange={setStartTime}
              disabled={saving}
            />
          </div>
          <span
            aria-hidden
            className="hidden text-gray-300 sm:inline dark:text-gray-600"
          >
            →
          </span>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white px-2 py-1 text-theme-xs font-medium text-gray-500 shadow-theme-xs dark:bg-gray-900 dark:text-gray-400">
              Đến
            </span>
            <TimePicker value={endTime} onChange={setEndTime} disabled={saving} />
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2 text-sm font-normal text-gray-600 dark:text-gray-400">
        <span className="mt-0.5 shrink-0">
          <Checkbox checked={divide} onChange={setDivide} disabled={saving} />
        </span>
        <button
          type="button"
          onClick={() => !saving && setDivide((prev) => !prev)}
          disabled={saving}
          className="text-left disabled:cursor-not-allowed"
        >
          Khi tick vào ô này, danh sách nhóm sẽ được chia đều cho các tài khoản
          Zalo được chọn khi chạy kịch bản.
          <br />
          <span className="text-theme-xs text-gray-500 dark:text-gray-500">
            Ví dụ: 100 link nhóm và 2 tài khoản Zalo — mỗi tài khoản tham gia 50
            nhóm
          </span>
        </button>
      </div>
    </div>
  );

  const linksFields = (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600 dark:text-gray-400">
        Danh sách link nhóm Zalo (mỗi dòng một link)
      </label>
      <textarea
        value={groupLinks}
        onChange={(e) => setGroupLinks(e.target.value)}
        rows={isWizard ? 12 : 8}
        disabled={saving}
        placeholder={"https://zalo.me/g/xxxxx\nhttps://zalo.me/g/yyyyy"}
        className={textareaClassName}
      />
      {splitLines(groupLinks).length > 0 ? (
        <p className="mt-2 text-xs text-gray-500">
          {splitLines(groupLinks).length} link
        </p>
      ) : null}
    </div>
  );

  const accountsPanel = (
    <div
      className={
        isWizard
          ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
          : campaignFormAccountPaneClass
      }
    >
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800 dark:text-white/90">
            Chọn tài khoản Zalo
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleAllFilteredAccounts}
              disabled={saving || accountsLoading || !filteredAccounts.length}
              className="text-theme-xs font-semibold text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-brand-400 dark:hover:text-brand-300"
            >
              {allFilteredAccountsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
            </button>
            <span className="text-theme-xs text-gray-500">
              {selectedAccountIds.length} đã chọn
            </span>
          </div>
        </div>
        <Input
          value={accountSearch}
          onChange={(e) => setAccountSearch(e.target.value)}
          placeholder="Tìm tài khoản..."
          disabled={accountsLoading || saving}
        />
      </div>
      <div
        className={
          isWizard
            ? `${campaignFormWizardListScrollClass} mt-3 space-y-1`
            : "custom-scrollbar mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain"
        }
        style={
          isWizard
            ? {
                maxHeight: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                height: CAMPAIGN_WIZARD_LIST_MAX_HEIGHT,
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-y",
              }
            : undefined
        }
      >
        {accountsLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Đang tải tài khoản...
          </p>
        ) : filteredAccounts.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Không có tài khoản phù hợp.
          </p>
        ) : (
          filteredAccounts.map((account) => {
            const selected = selectedAccountIds.includes(account.id);
            return (
              <button
                key={account.id}
                type="button"
                onClick={() => toggleAccount(account.id)}
                className={`flex w-full min-w-0 items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition active:bg-brand-50/80 sm:py-2 ${
                  selected
                    ? "border-brand-300 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                <Checkbox
                  checked={selected}
                  onChange={() => toggleAccount(account.id)}
                />
                <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  {account.avatar ? (
                    <Image
                      src={account.avatar}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <AvatarText
                      name={account.name || `Tài khoản #${account.id}`}
                      size="sm"
                      className="!h-9 !w-9"
                    />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                    {account.name || `Tài khoản #${account.id}`}
                  </span>
                  <span className="block truncate text-theme-xs text-gray-500">
                    {account.phone_number || "—"}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const wizardBody =
    wizardStep === 0
      ? configFields
      : wizardStep === 1
        ? linksFields
        : accountsPanel;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className={
        isWizard
          ? campaignFormModalPanelClassWizard
          : campaignFormModalPanelClass.md
      }
      showCloseButton
    >
      <div className={campaignFormBodyClass}>
        {isWizard ? (
          <>
            <div className="mb-1 min-w-0 max-w-full shrink-0 pr-9">
              <h3 className="text-sm font-semibold leading-snug break-words text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
            </div>
            <CampaignFormWizardHeader
              steps={wizardSteps}
              current={wizardStep}
              onJump={(i) => {
                if (i < wizardStep) setWizardStep(i);
              }}
            />
            <div
              className={
                wizardStep >= 2
                  ? "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  : "custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain"
              }
              style={
                wizardStep < 2
                  ? { WebkitOverflowScrolling: "touch", touchAction: "pan-y" }
                  : undefined
              }
            >
              <fieldset
                disabled={readOnly}
                className={
                  wizardStep >= 2
                    ? "flex min-h-0 flex-1 flex-col border-0 p-0"
                    : "min-w-0 border-0 p-0"
                }
              >
                {wizardBody}
              </fieldset>
            </div>
            <div className="relative z-10 shrink-0 border-t border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
              <CampaignFormWizardFooter
                current={wizardStep}
                total={wizardSteps.length}
                onBack={goBack}
                onNext={() => {
                  if (!validateWizardStep(wizardStep)) return;
                  goNext(wizardSteps.length - 1);
                }}
                onCancel={onClose}
                onSubmit={() => void handleSave()}
                saving={saving}
                readOnly={readOnly}
              />
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 shrink-0 pr-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalTitle}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Đặt tên → thời gian chờ → số lượt → danh sách link nhóm → chọn
                tài khoản → lưu
              </p>
            </div>

            <div className={campaignFormMainClass}>
              <fieldset disabled={readOnly} className="contents">
                <div className={campaignFormGridWideClass}>
                  <div className={campaignFormScrollPaneClass}>
                    <div className="space-y-4">
                      {configFields}
                      {linksFields}
                    </div>
                  </div>
                  {accountsPanel}
                </div>
              </fieldset>
            </div>

            <div className="mt-4 flex shrink-0 justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              {readOnly ? (
                <Button size="sm" variant="outline" onClick={onClose}>
                  Đóng
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onClose}
                    disabled={saving}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => void handleSave()}
                    disabled={saving}
                  >
                    {saving ? "Đang lưu..." : "Lưu kịch bản"}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
