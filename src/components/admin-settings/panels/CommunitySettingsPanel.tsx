"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { getApiErrorMessage } from "@/lib/errors";
import { normalizeHtmlContent } from "@/lib/admin-settings-utils";
import { toast } from "@/lib/toast";
import { adminSettingsService } from "@/services/admin-settings.service";
import { useCallback, useEffect, useState } from "react";
import SettingsPanelActions from "../shared/SettingsPanelActions";

export default function CommunitySettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [active, setActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminSettingsService.getCommunityPopup();
      setContent(data?.content ?? "");
      setLink(data?.link ?? "");
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
    if (!link.trim()) {
      toast.error("Vui lòng nhập link.");
      return;
    }
    if (!/^https?:\/\/.+/i.test(link.trim())) {
      toast.error("Link phải bắt đầu bằng http:// hoặc https://");
      return;
    }
    setSaving(true);
    try {
      await adminSettingsService.saveCommunityPopup({
        content: content.trim(),
        link: link.trim(),
        active,
      });
      toast.success("Đã lưu nút cộng đồng.");
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
        <Label>Nội dung nút</Label>
        <Input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ví dụ: Cộng đồng Zalo"
        />
      </div>
      <div>
        <Label>
          Link <span className="text-error-500">*</span>
        </Label>
        <Input
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
        />
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
        <Checkbox checked={active} onChange={setActive} />
        Bật nút cộng đồng
      </label>
      {content ? (
        <p className="text-xs text-gray-500">
          Xem trước nhãn: {normalizeHtmlContent(content)}
        </p>
      ) : null}
      <SettingsPanelActions saving={saving} onSave={() => void handleSave()} />
    </div>
  );
}