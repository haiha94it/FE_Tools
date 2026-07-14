"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import {
  resolveZaloLabelColor,
  ZALO_LABEL_MAX_COUNT,
} from "@/lib/zalo-label-utils";
import { confirm } from "@/lib/confirm";
import { toast } from "@/lib/toast";
import { zaloLabelService } from "@/services/zalo-label.service";
import type { MessengerCategoryLabel } from "@/types/zalo-messenger";
import { memo, useCallback, useEffect, useState } from "react";

interface LabelManageDialogProps {
  accountId: number;
  open: boolean;
  onClose: () => void;
  onLabelsChanged: () => void;
}

const DEFAULT_LABEL_COLOR = "#465fff";

function LabelManageDialog({
  accountId,
  open,
  onClose,
  onLabelsChanged,
}: LabelManageDialogProps) {
  const [labels, setLabels] = useState<MessengerCategoryLabel[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<MessengerCategoryLabel | null>(
    null,
  );
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_LABEL_COLOR);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    try {
      const list = await zaloLabelService.listCategories(accountId);
      setLabels(list);
    } catch {
      toast.error("Không tải được danh sách nhãn.");
      setLabels([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    if (!open) return;
    void fetchLabels();
  }, [open, fetchLabels]);

  const resetForm = () => {
    setName("");
    setColor(DEFAULT_LABEL_COLOR);
    setShowForm(false);
    setEditingLabel(null);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên nhãn.");
      return;
    }

    if (!editingLabel && labels.length >= ZALO_LABEL_MAX_COUNT) {
      toast.error(`Mỗi tài khoản chỉ tạo tối đa ${ZALO_LABEL_MAX_COUNT} nhãn.`);
      return;
    }

    setSaving(true);
    try {
      if (editingLabel) {
        await zaloLabelService.editCategory({
          id: editingLabel.id,
          name: trimmedName,
          color,
        });
        toast.success("Đã cập nhật nhãn.");
      } else {
        await zaloLabelService.createCategory({
          name: trimmedName,
          color,
        });
        toast.success("Đã tạo nhãn mới.");
      }
      resetForm();
      await fetchLabels();
      onLabelsChanged();
    } catch {
      /* toast from axios */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (label: MessengerCategoryLabel) => {
    if (
      !(await confirm({
        title: "Xóa nhãn",
        message: `Xóa nhãn "${label.name ?? ""}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }

    setDeletingId(label.id);
    try {
      await zaloLabelService.deleteCategory(label.id);
      toast.success("Đã xóa nhãn.");
      if (editingLabel?.id === label.id) resetForm();
      await fetchLabels();
      onLabelsChanged();
    } catch {
      /* toast from axios */
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (label: MessengerCategoryLabel) => {
    setEditingLabel(label);
    setName(label.name ?? "");
    setColor(resolveZaloLabelColor(label.color));
    setShowForm(true);
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      className="max-w-lg"
      showCloseButton
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:p-6">
        <div className="mb-4 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quản lý nhãn
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Tối đa {ZALO_LABEL_MAX_COUNT} nhãn / tài khoản
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Đang tải nhãn...
            </div>
          ) : labels.length === 0 && !showForm ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Chưa có nhãn nào. Bấm &quot;Thêm nhãn&quot; để tạo.
            </p>
          ) : (
            <ul className="space-y-2">
              {labels.map((label) => (
                <li
                  key={label.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10"
                      style={{
                        backgroundColor: resolveZaloLabelColor(label.color),
                      }}
                    />
                    <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {label.name || `Nhãn #${label.id}`}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(label)}
                      className="rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white hover:text-brand-600 dark:hover:bg-gray-900"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(label)}
                      disabled={deletingId === label.id}
                      className="rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white hover:text-red-600 disabled:opacity-50 dark:hover:bg-gray-900"
                    >
                      {deletingId === label.id ? "..." : "Xóa"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showForm ? (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                {editingLabel ? "Sửa nhãn" : "Thêm nhãn mới"}
              </p>
              <div className="mt-3">
                <Input
                  type="text"
                  value={name}
                  disabled={saving}
                  placeholder="Tên nhãn"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <label className="mt-3 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="color"
                  value={color}
                  disabled={saving}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                  aria-label="Chọn màu nhãn"
                />
                <span className="text-xs text-gray-500">Màu nhãn</span>
              </label>
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : editingLabel ? "Lưu" : "Tạo"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {!showForm ? (
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              disabled={labels.length >= ZALO_LABEL_MAX_COUNT}
            >
              Thêm nhãn
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

export default memo(LabelManageDialog);