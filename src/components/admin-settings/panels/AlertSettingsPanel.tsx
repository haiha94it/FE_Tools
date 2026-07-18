"use client";

import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { resolveAdminSettingsImage } from "@/lib/admin-settings-utils";
import { toast } from "@/lib/toast";
import { adminSettingsService } from "@/services/admin-settings.service";
import type { PopupAlertItem } from "@/types/admin-settings";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import SettingsImageField from "../shared/SettingsImageField";
import SettingsPanelActions from "../shared/SettingsPanelActions";
import SettingsPreviewDialog from "../shared/SettingsPreviewDialog";

export default function AlertSettingsPanel() {
  const [items, setItems] = useState<PopupAlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [active, setActive] = useState(true);

  // Dedupe Strict Mode nằm ở adminSettingsService.listAlerts
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await adminSettingsService.listAlerts());
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setLink("");
    setImagePath("");
    setActive(true);
  };

  const selectItem = (item: PopupAlertItem) => {
    setEditingId(item.id);
    setLink(item.link ?? "");
    setImagePath(item.image ?? "");
    setActive(Boolean(item.active));
  };

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
      toast.error("Vui lòng chọn ảnh thông báo.");
      return;
    }
    setSaving(true);
    try {
      await adminSettingsService.saveAlert({
        id: editingId,
        link,
        image: imagePath,
        active,
      });
      toast.success("Đã lưu thông báo.");
      resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (item: PopupAlertItem) => {
    if (!item.image) return;
    setSaving(true);
    try {
      await adminSettingsService.saveAlert({
        id: item.id,
        link: item.link ?? "",
        image: item.image,
        active: !item.active,
      });
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !(await confirm({
        title: "Xóa thông báo",
        message: "Xóa thông báo này?",
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await adminSettingsService.deleteAlerts([id]);
      toast.success("Đã xóa thông báo.");
      if (editingId === id) resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:grid-cols-2">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <div>
            <Label>Link</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <Checkbox checked={active} onChange={setActive} />
            Bật thông báo
          </label>
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
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Tạo mới thay vì sửa
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có thông báo nào.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => {
            const imageUrl = resolveAdminSettingsImage(item.image);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectItem(item)}
                className={`rounded-2xl border p-4 text-left transition hover:border-brand-300 dark:hover:border-brand-500/40 ${
                  editingId === item.id
                    ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    Thông báo {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={Boolean(item.active)}
                      onChange={() => void handleToggle(item)}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(item.id);
                      }}
                      className="text-xs text-error-500 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
                {imageUrl ? (
                  <div className="relative mb-3 h-24 w-24 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-contain p-1"
                    />
                  </div>
                ) : null}
                <p className="line-clamp-2 text-xs text-gray-500">{item.link}</p>
              </button>
            );
          })}
        </div>
      )}

      <SettingsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước thông báo"
        imagePath={imagePath}
        link={link}
      />
    </div>
  );
}