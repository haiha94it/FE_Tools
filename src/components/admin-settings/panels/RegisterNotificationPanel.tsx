"use client";

import Label from "@/components/form/Label";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { adminSettingsService } from "@/services/admin-settings.service";
import { useCallback, useEffect, useState } from "react";
import SettingsImageField from "../shared/SettingsImageField";
import SettingsPanelActions from "../shared/SettingsPanelActions";
import SettingsPreviewDialog from "../shared/SettingsPreviewDialog";

const textareaClassName =
  "w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

export default function RegisterNotificationPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [imagePath, setImagePath] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getRegisterPopup();
      setRecordId(data?.id ?? null);
      setContent(data?.content ?? "");
      setImagePath(data?.image ?? "");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      setImagePath(await adminSettingsService.uploadImage(file));
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!imagePath) {
      toast.error("Vui lòng chọn ảnh.");
      return;
    }
    setSaving(true);
    try {
      await adminSettingsService.saveRegisterPopup({
        id: recordId,
        content,
        image: imagePath,
      });
      toast.success("Đã lưu thông báo đăng ký.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <Label>Nội dung</Label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className={textareaClassName}
          placeholder="Hỗ trợ {{ domain }} để thay domain động"
        />
      </div>
      <SettingsImageField
        label="Ảnh thông báo"
        imagePath={imagePath}
        uploading={uploading}
        onSelect={handleUpload}
        required
      />
      <SettingsPanelActions
        saving={saving}
        saveDisabled={!imagePath}
        onSave={() => void handleSave()}
        onPreview={() => setPreviewOpen(true)}
      />
      <SettingsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước thông báo đăng ký"
        content={content.replace(
          /{{\s*domain\s*}}/g,
          typeof window !== "undefined" ? window.location.origin : "",
        )}
        imagePath={imagePath}
      />
    </div>
  );
}