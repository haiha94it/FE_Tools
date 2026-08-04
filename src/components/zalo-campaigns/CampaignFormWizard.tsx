"use client";

import Button from "@/components/ui/button/Button";
import { memo, type ReactNode } from "react";

export interface CampaignWizardStep {
  id: string;
  /** Tiêu đề step (ngắn) */
  title: string;
  /** Không hiển thị trên UI (giữ field optional cho tương thích) */
  hint?: string;
}

interface CampaignFormWizardHeaderProps {
  steps: CampaignWizardStep[];
  current: number;
  onJump?: (index: number) => void;
  allowJumpBack?: boolean;
}

/**
 * Stepper gọn — nhường chỗ cho list nhóm/bạn bè.
 * Không render dòng hint (chật màn hình).
 */
export const CampaignFormWizardHeader = memo(function CampaignFormWizardHeader({
  steps,
  current,
  onJump,
  allowJumpBack = true,
}: CampaignFormWizardHeaderProps) {
  const cols =
    steps.length <= 2
      ? "grid-cols-2"
      : steps.length === 3
        ? "grid-cols-3"
        : "grid-cols-4";

  return (
    <nav
      aria-label="Các bước thiết lập kịch bản"
      className="mb-1.5 w-full min-w-0 max-w-full shrink-0 overflow-hidden"
    >
      <ol className={`grid w-full min-w-0 ${cols} gap-x-0.5`}>
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const clickable =
            Boolean(onJump) &&
            (done || (allowJumpBack && index <= current));
          return (
            <li key={step.id} className="min-w-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onJump?.(index)}
                className={`flex w-full min-w-0 flex-col items-center gap-0.5 rounded-md px-0.5 py-0.5 transition ${
                  clickable
                    ? "cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.04]"
                    : "cursor-default"
                }`}
              >
                <span className="relative flex h-6 w-full items-center justify-center">
                  {index > 0 ? (
                    <span
                      className={`absolute top-1/2 right-1/2 mr-3 h-px w-[calc(50%-0.75rem)] -translate-y-1/2 ${
                        index <= current
                          ? "bg-brand-400"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                  {index < steps.length - 1 ? (
                    <span
                      className={`absolute top-1/2 left-1/2 ml-3 h-px w-[calc(50%-0.75rem)] -translate-y-1/2 ${
                        done
                          ? "bg-brand-400"
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                      active
                        ? "bg-brand-500 text-white"
                        : done
                          ? "bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300"
                          : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                    }`}
                  >
                    {done ? "✓" : index + 1}
                  </span>
                </span>
                <span
                  className={`w-full max-w-full truncate text-center text-[9px] font-medium leading-tight ${
                    active
                      ? "text-brand-600 dark:text-brand-400"
                      : done
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {step.title}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

interface CampaignFormWizardFooterProps {
  current: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onCancel: () => void;
  onSubmit: () => void;
  nextDisabled?: boolean;
  submitDisabled?: boolean;
  saving?: boolean;
  readOnly?: boolean;
  submitLabel?: string;
  nextLabel?: string;
}

const btnRow =
  "!h-9 min-h-9 flex-1 px-2 text-xs font-semibold sm:!h-9 sm:flex-none sm:px-3 sm:text-sm";

/** Footer 1 hàng gọn — không xếp dọc che list */
export const CampaignFormWizardFooter = memo(function CampaignFormWizardFooter({
  current,
  total,
  onBack,
  onNext,
  onCancel,
  onSubmit,
  nextDisabled = false,
  submitDisabled = false,
  saving = false,
  readOnly = false,
  submitLabel = "Lưu",
  nextLabel = "Tiếp",
}: CampaignFormWizardFooterProps) {
  const isFirst = current <= 0;
  const isLast = current >= total - 1;

  if (readOnly) {
    return (
      <div className="flex shrink-0 items-center gap-2 pt-2">
        {!isFirst ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onBack}
            className={btnRow}
          >
            Quay lại
          </Button>
        ) : null}
        {isLast ? (
          <Button
            size="sm"
            variant="outline"
            onClick={onCancel}
            className={btnRow}
          >
            Đóng
          </Button>
        ) : (
          <Button size="sm" onClick={onNext} className={btnRow}>
            {nextLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 pt-2">
      <Button
        size="sm"
        variant="outline"
        onClick={isFirst ? onCancel : onBack}
        disabled={saving}
        className={btnRow}
      >
        {isFirst ? "Hủy" : "Quay lại"}
      </Button>
      {isLast ? (
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={saving || submitDisabled}
          className={btnRow}
        >
          {saving ? "Đang lưu..." : submitLabel}
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={onNext}
          disabled={saving || nextDisabled}
          className={btnRow}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  );
});

interface CampaignFormWizardShellProps {
  title: string;
  desktopHint?: string;
  steps: CampaignWizardStep[];
  current: number;
  onJump?: (index: number) => void;
  children: ReactNode;
  footer: ReactNode;
}

/** Shell modal body cho wizard mobile — title gọn, không hint */
export function CampaignFormWizardShell({
  title,
  steps,
  current,
  onJump,
  children,
  footer,
}: CampaignFormWizardShellProps) {
  return (
    <>
      <div className="mb-1 min-w-0 shrink-0 pr-9">
        <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      <CampaignFormWizardHeader
        steps={steps}
        current={current}
        onJump={onJump}
      />
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
      {footer}
    </>
  );
}
