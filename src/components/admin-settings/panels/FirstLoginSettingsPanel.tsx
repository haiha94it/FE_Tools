"use client";

import { getApiErrorMessage } from "@/lib/errors";
import { normalizeHtmlContent } from "@/lib/admin-settings-utils";
import { toast } from "@/lib/toast";
import { adminSettingsService } from "@/services/admin-settings.service";
import { useCallback, useEffect, useState } from "react";
import SettingsHtmlEditor from "../shared/SettingsHtmlEditor";
import SettingsPanelActions from "../shared/SettingsPanelActions";
import SettingsPreviewDialog from "../shared/SettingsPreviewDialog";

export default function FirstLoginSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [content, setContent] = useState("");
  const [active, setActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getTermPopup();
      setContent(normalizeHtmlContent(data?.content));
      setActive(data?.active ?? true);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminSettingsService.saveTermPopup({ content, active });
      toast.success("Đã lưu thông báo đăng nhập lần đầu.");
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
    <div className="space-y-4">
      <SettingsHtmlEditor
        label="Nội dung thông báo đăng nhập lần đầu"
        value={content}
        active={active}
        onChange={setContent}
        onActiveChange={setActive}
        activeLabel="Bật popup khi đăng nhập lần đầu"
      />
      <SettingsPanelActions
        saving={saving}
        onSave={() => void handleSave()}
        onPreview={() => setPreviewOpen(true)}
        externalPreviewHref="/dieu-khoan"
        externalPreviewLabel="Xem trang điều khoản"
      />
      <SettingsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước thông báo đăng nhập lần đầu"
        content={content}
        showAcceptMock
      />
    </div>
  );
}