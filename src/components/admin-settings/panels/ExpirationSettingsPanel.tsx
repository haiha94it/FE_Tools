"use client";

import Input from "@/components/form/input/InputField";
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

export default function ExpirationSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getExpiration();
      setContent(data?.content ?? "");
      setLink(data?.link ?? "");
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

  const handleDeleteImage = async () => {
    setClearing(true);
    try {
      await adminSettingsService.saveExpiration({
        content,
        link,
        image: "",
      });
      setImagePath("");
      toast.success("Đã xóa ảnh thông báo hết hạn.");
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setClearing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSettingsService.saveExpiration({
        content,
        link,
        image: imagePath,
      });
      toast.success("Đã lưu thông báo hết hạn.");
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
          rows={5}
          className={textareaClassName}
        />
      </div>
      <div>
        <Label>Link</Label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} />
      </div>
      <SettingsImageField
        label="Ảnh thông báo"
        imagePath={imagePath}
        uploading={uploading}
        clearing={clearing}
        onSelect={handleUpload}
        onClear={handleDeleteImage}
      />
      <SettingsPanelActions
        saving={saving || clearing}
        onSave={() => void handleSave()}
        onPreview={() => setPreviewOpen(true)}
      />
      <SettingsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước thông báo hết hạn"
        content={content}
        imagePath={imagePath}
        link={link}
      />
    </div>
  );
}