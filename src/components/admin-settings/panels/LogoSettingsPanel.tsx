"use client";

import { invalidateBrandLogoCache } from "@/lib/brand-logo";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { adminSettingsService } from "@/services/admin-settings.service";
import { useCallback, useEffect, useState } from "react";
import SettingsImageField from "../shared/SettingsImageField";
import SettingsPanelActions from "../shared/SettingsPanelActions";

export default function LogoSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePath, setImagePath] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getLogo();
      setImagePath(data?.link ?? data?.image ?? "");
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
      toast.error("Vui lòng chọn logo mới.");
      return;
    }
    setSaving(true);
    try {
      await adminSettingsService.saveLogo({ link: imagePath });
      // Sidebar/header/landing reload logo API ngay, không cần F5
      invalidateBrandLogoCache();
      toast.success("Đã cập nhật logo.");
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
    <div className="max-w-md space-y-4">
      <SettingsImageField
        label="Logo hiện tại / logo mới"
        imagePath={imagePath}
        uploading={uploading}
        onSelect={handleUpload}
        required
      />
      <SettingsPanelActions
        saving={saving}
        saveDisabled={!imagePath}
        onSave={() => void handleSave()}
      />
    </div>
  );
}