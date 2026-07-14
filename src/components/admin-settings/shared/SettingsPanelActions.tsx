"use client";

import Button from "@/components/ui/button/Button";

interface SettingsPanelActionsProps {
  saving?: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  onPreview?: () => void;
  previewLabel?: string;
  externalPreviewHref?: string;
  externalPreviewLabel?: string;
}

export default function SettingsPanelActions({
  saving = false,
  saveDisabled = false,
  onSave,
  onPreview,
  previewLabel = "Xem trước",
  externalPreviewHref,
  externalPreviewLabel,
}: SettingsPanelActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={onSave} disabled={saving || saveDisabled}>
        {saving ? "Đang lưu..." : "Lưu"}
      </Button>
      {onPreview ? (
        <Button size="sm" variant="outline" onClick={onPreview} disabled={saving}>
          {previewLabel}
        </Button>
      ) : null}
      {externalPreviewHref ? (
        <a
          href={externalPreviewHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        >
          {externalPreviewLabel ?? "Mở trang xem"}
        </a>
      ) : null}
    </div>
  );
}