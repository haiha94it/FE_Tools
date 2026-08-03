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
import { memo, useCallback, useLayoutEffect, useRef, useState } from "react";

interface LabelManageDialogProps {
  accountId: number;
  open: boolean;
  onClose: () => void;
  onLabelsChanged: () => void;
  /** Manager — tạo/sửa/xóa định nghĩa nhãn; NV chỉ xem danh sách */
  canManageDefinitions?: boolean;
}

const DEFAULT_LABEL_COLOR = "#465fff";

function LabelManageDialog({
  accountId,
  open,
  onClose,
  onLabelsChanged,
  canManageDefinitions = true,
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
  const scopeGenerationRef = useRef(0);
  const fetchEpochRef = useRef(0);
  const mutationBusyRef = useRef(false);
  const mutationBusy = saving || deletingId !== null;

  const resetForm = useCallback(() => {
    setName("");
    setColor(DEFAULT_LABEL_COLOR);
    setShowForm(false);
    setEditingLabel(null);
  }, []);

  const fetchLabels = useCallback(async (
    accountIdSnapshot: number,
    scopeGeneration: number,
  ) => {
    const fetchEpoch = ++fetchEpochRef.current;
    setLoading(true);
    try {
      const list = await zaloLabelService.listCategories(accountIdSnapshot);
      if (
        scopeGeneration !== scopeGenerationRef.current ||
        fetchEpoch !== fetchEpochRef.current
      ) {
        return;
      }
      setLabels(list);
    } catch {
      if (
        scopeGeneration !== scopeGenerationRef.current ||
        fetchEpoch !== fetchEpochRef.current
      ) {
        return;
      }
      toast.error("Không tải được danh sách nhãn.");
      setLabels([]);
    } finally {
      if (
        scopeGeneration === scopeGenerationRef.current &&
        fetchEpoch === fetchEpochRef.current
      ) {
        setLoading(false);
      }
    }
  }, []);

  useLayoutEffect(() => {
    const pendingGeneration = ++scopeGenerationRef.current;
    queueMicrotask(() => {
      if (pendingGeneration !== scopeGenerationRef.current) return;
      const scopeGeneration = ++scopeGenerationRef.current;
      setLabels([]);
      setLoading(false);
      setSaving(false);
      setDeletingId(null);
      fetchEpochRef.current += 1;
      mutationBusyRef.current = false;
      resetForm();
      if (open) void fetchLabels(accountId, scopeGeneration);
    });
    return () => {
      scopeGenerationRef.current += 1;
    };
  }, [accountId, fetchLabels, open, resetForm]);

  const handleClose = useCallback(() => {
    scopeGenerationRef.current += 1;
    setLoading(false);
    setSaving(false);
    setDeletingId(null);
    fetchEpochRef.current += 1;
    mutationBusyRef.current = false;
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  /** Lưu đúng scope dialog và serialize với thao tác xóa. */
  const handleSave = async () => {
    if (mutationBusyRef.current) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error("Vui lòng nhập tên nhãn.");
      return;
    }

    if (!editingLabel && labels.length >= ZALO_LABEL_MAX_COUNT) {
      toast.error(`Mỗi tài khoản chỉ tạo tối đa ${ZALO_LABEL_MAX_COUNT} nhãn.`);
      return;
    }

    const scopeGeneration = scopeGenerationRef.current;
    mutationBusyRef.current = true;
    setSaving(true);
    try {
      if (editingLabel) {
        await zaloLabelService.editCategory({
          id: editingLabel.id,
          name: trimmedName,
          color,
        });
        if (scopeGeneration !== scopeGenerationRef.current) return;
        toast.success("Đã cập nhật nhãn.");
      } else {
        await zaloLabelService.createCategory({
          name: trimmedName,
          color,
        });
        if (scopeGeneration !== scopeGenerationRef.current) return;
        toast.success("Đã tạo nhãn mới.");
      }
      resetForm();
      await fetchLabels(accountId, scopeGeneration);
      if (scopeGeneration !== scopeGenerationRef.current) return;
      onLabelsChanged();
    } catch {
      /* toast from axios */
    } finally {
      if (scopeGeneration === scopeGenerationRef.current) {
        mutationBusyRef.current = false;
        setSaving(false);
      }
    }
  };

  /** Xóa đúng scope dialog và serialize với thao tác lưu. */
  const handleDelete = async (label: MessengerCategoryLabel) => {
    if (mutationBusyRef.current) return;
    const confirmGeneration = scopeGenerationRef.current;
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

    if (
      confirmGeneration !== scopeGenerationRef.current ||
      mutationBusyRef.current
    ) {
      return;
    }

    const scopeGeneration = scopeGenerationRef.current;
    mutationBusyRef.current = true;
    setDeletingId(label.id);
    try {
      await zaloLabelService.deleteCategory(label.id);
      if (scopeGeneration !== scopeGenerationRef.current) return;
      toast.success("Đã xóa nhãn.");
      if (editingLabel?.id === label.id) resetForm();
      await fetchLabels(accountId, scopeGeneration);
      if (scopeGeneration !== scopeGenerationRef.current) return;
      onLabelsChanged();
    } catch {
      /* toast from axios */
    } finally {
      if (scopeGeneration === scopeGenerationRef.current) {
        mutationBusyRef.current = false;
        setDeletingId(null);
      }
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
      onClose={handleClose}
      className="max-w-lg"
      showCloseButton
    >
      <div className="flex max-h-[85vh] flex-col overflow-hidden p-5 sm:p-6">
        <div className="mb-4 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quản lý nhãn
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {canManageDefinitions
              ? `Tối đa ${ZALO_LABEL_MAX_COUNT} nhãn / tài khoản`
              : "Danh sách nhãn — gán/gỡ nhãn qua menu hội thoại."}
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
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
                  {canManageDefinitions ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(label)}
                        disabled={mutationBusy}
                        className="rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white hover:text-brand-600 dark:hover:bg-gray-900"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(label)}
                        disabled={mutationBusy}
                        className="rounded-lg px-2 py-1 text-xs text-gray-500 transition hover:bg-white hover:text-red-600 disabled:opacity-50 dark:hover:bg-gray-900"
                      >
                        {deletingId === label.id ? "..." : "Xóa"}
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          {canManageDefinitions && showForm ? (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/40 p-4 dark:border-brand-500/20 dark:bg-brand-500/5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-400">
                {editingLabel ? "Sửa nhãn" : "Thêm nhãn mới"}
              </p>
              <div className="mt-3">
                <Input
                  type="text"
                  value={name}
                  disabled={mutationBusy}
                  placeholder="Tên nhãn"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <label className="mt-3 flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 dark:border-gray-700 dark:bg-gray-900">
                <input
                  type="color"
                  value={color}
                  disabled={mutationBusy}
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
                  disabled={mutationBusy}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={() => void handleSave()}
                  disabled={mutationBusy}
                >
                  {saving ? "Đang lưu..." : editingLabel ? "Lưu" : "Tạo"}
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        {canManageDefinitions && !showForm ? (
          <div className="mt-4 shrink-0 border-t border-gray-100 pt-4 dark:border-gray-800">
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              disabled={mutationBusy || labels.length >= ZALO_LABEL_MAX_COUNT}
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
