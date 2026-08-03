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
  /** Snapshot lúc mở dialog — tránh race form state */
  const [previewSnapshot, setPreviewSnapshot] = useState<{
    imagePath: string;
    link: string;
  }>({ imagePath: "", link: "" });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [link, setLink] = useState("");
  const [imagePath, setImagePath] = useState("");
  const [active, setActive] = useState(true);

  /** Nạp 1 popup vào form (sửa / xem trước) */
  const selectItem = useCallback((item: PopupAlertItem) => {
    setEditingId(item.id);
    setLink(item.link ?? "");
    setImagePath(item.image ?? "");
    setActive(Boolean(item.active));
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setLink("");
    setImagePath("");
    setActive(true);
  };

  /**
   * Load list + tùy chọn nạp form.
   * prefer: id đã biết | image vừa save (create) | "first" auto item đầu.
   */
  const load = useCallback(
    async (prefer?: number | null | "first" | { image: string }) => {
      setLoading(true);
      try {
        const list = await adminSettingsService.listAlerts();
        setItems(list);

        let pick: PopupAlertItem | undefined;
        if (prefer === "first") {
          pick = list[0];
        } else if (prefer && typeof prefer === "object" && "image" in prefer) {
          pick =
            list.find((i) => i.image === prefer.image) ?? list[0] ?? undefined;
        } else if (typeof prefer === "number") {
          pick = list.find((i) => i.id === prefer) ?? list[0] ?? undefined;
        } else if (prefer === null) {
          pick = undefined;
        } else {
          // reload thuần (toggle): sync form nếu đang sửa id còn trong list
          pick = undefined;
        }

        if (prefer === "first" || typeof prefer === "number" || (prefer && typeof prefer === "object")) {
          if (pick) selectItem(pick);
          else resetForm();
        } else if (prefer === undefined) {
          // giữ form; nếu đang edit id bị xóa thì nạp first hoặc clear
          setEditingId((cur) => {
            if (cur == null) return cur;
            const still = list.find((i) => i.id === cur);
            if (still) {
              setLink(still.link ?? "");
              setImagePath(still.image ?? "");
              setActive(Boolean(still.active));
              return still.id;
            }
            if (list[0]) {
              setLink(list[0].link ?? "");
              setImagePath(list[0].image ?? "");
              setActive(Boolean(list[0].active));
              return list[0].id;
            }
            setLink("");
            setImagePath("");
            setActive(true);
            return null;
          });
        }

        return list;
      } catch (error) {
        toast.error(getApiErrorMessage(error));
        return [] as PopupAlertItem[];
      } finally {
        setLoading(false);
      }
    },
    [selectItem],
  );

  useEffect(() => {
    // 1 thông báo (hoặc nhiều): mount → nạp item đầu vào form, Xem trước dùng được ngay
    void load("first");
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
      toast.error("Vui lòng chọn ảnh thông báo.");
      return;
    }
    setSaving(true);
    try {
      const savedId = editingId;
      const savedImage = imagePath;
      await adminSettingsService.saveAlert({
        id: editingId,
        link,
        image: imagePath,
        active,
      });
      toast.success("Đã lưu thông báo.");
      // Giữ form — không reset; re-select theo id hoặc image vừa tạo
      if (savedId != null) {
        await load(savedId);
      } else {
        await load({ image: savedImage });
      }
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
      await load("first");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const openPreview = () => {
    // Form trống → fallback item đầu (case chỉ 1 thông báo, user chưa click card)
    const fallback = items[0];
    const snapImage = imagePath || fallback?.image || "";
    const snapLink = imagePath ? link : (fallback?.link ?? link);
    if (!snapImage) {
      toast.error("Chưa có ảnh thông báo để xem trước.");
      return;
    }
    if (!imagePath && fallback) selectItem(fallback);
    setPreviewSnapshot({ imagePath: snapImage, link: snapLink });
    setPreviewOpen(true);
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
            previewDisabled={!imagePath && !items[0]?.image}
            onSave={() => void handleSave()}
            onPreview={openPreview}
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
              // Card dùng div — tránh <button> lồng <button> (Checkbox + Xóa)
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => selectItem(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectItem(item);
                  }
                }}
                className={`cursor-pointer rounded-2xl border p-4 text-left transition hover:border-brand-300 dark:hover:border-brand-500/40 ${
                  editingId === item.id
                    ? "border-brand-300 bg-brand-50/50 dark:border-brand-500/30 dark:bg-brand-500/10"
                    : "border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    Thông báo {index + 1}
                  </p>
                  <div
                    className="flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={Boolean(item.active)}
                      onChange={() => void handleToggle(item)}
                    />
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
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
              </div>
            );
          })}
        </div>
      )}

      <SettingsPreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title="Xem trước thông báo"
        imagePath={previewSnapshot.imagePath}
        link={previewSnapshot.link}
      />
    </div>
  );
}