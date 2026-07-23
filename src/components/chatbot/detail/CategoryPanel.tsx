"use client";

import CustomSelect from "@/components/form/CustomSelect";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import {
  CATEGORY_COLOR_PRESETS,
  resolveCategoryBgColor,
} from "@/lib/chatbot-utils";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type { ChatbotCategory } from "@/types/chatbot";
import { useEffect, useState } from "react";

interface CategoryPanelProps {
  chatbotId: number;
}

interface CategoryFormState {
  name: string;
  color: string;
  description: string;
  is_active: boolean;
  disable_reminder_chatbot: boolean;
}

const emptyForm = (): CategoryFormState => ({
  name: "",
  color: "blue",
  description: "",
  is_active: true,
  disable_reminder_chatbot: false,
});

export default function CategoryPanel({ chatbotId }: CategoryPanelProps) {
  const setChatbotId = useChatbotTrainingStore((s) => s.setChatbotId);
  const categories = useChatbotTrainingStore((s) => s.categories);
  const isLoadingCategories = useChatbotTrainingStore(
    (s) => s.isLoadingCategories,
  );
  const isSavingCategory = useChatbotTrainingStore((s) => s.isSavingCategory);
  const fetchCategories = useChatbotTrainingStore((s) => s.fetchCategories);
  const createCategory = useChatbotTrainingStore((s) => s.createCategory);
  const updateCategory = useChatbotTrainingStore((s) => s.updateCategory);
  const deleteCategory = useChatbotTrainingStore((s) => s.deleteCategory);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ChatbotCategory | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);

  useEffect(() => {
    setChatbotId(chatbotId);
    void fetchCategories();
  }, [chatbotId, setChatbotId, fetchCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (cat: ChatbotCategory) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      color: cat.color || "blue",
      description: cat.description || "",
      is_active: cat.is_active !== false,
      disable_reminder_chatbot: Boolean(cat.disable_reminder_chatbot),
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    if (editing) {
      const ok = await updateCategory(editing.id, {
        name: form.name.trim(),
        color: form.color,
        description: form.description.trim(),
        is_active: form.is_active,
        disable_reminder_chatbot: form.disable_reminder_chatbot,
      });
      if (ok) setOpen(false);
      return;
    }

    const ok = await createCategory({
      chatbot_id: chatbotId,
      name: form.name.trim(),
      color: form.color,
      description: form.description.trim(),
      is_active: form.is_active,
      disable_reminder_chatbot: form.disable_reminder_chatbot,
    });
    if (ok) setOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Badge size="sm" color="primary" variant="light">
          {categories.length} danh mục
        </Badge>
        <Button size="sm" onClick={openCreate}>
          + Thêm danh mục
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        {isLoadingCategories && categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Đang tải danh mục…
          </p>
        ) : categories.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Chưa có danh mục. Tạo danh mục để phân loại câu hỏi.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded px-2 py-0.5 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: resolveCategoryBgColor(cat.color),
                      }}
                    >
                      {cat.name}
                    </span>
                    <Badge
                      size="sm"
                      color={cat.is_active === false ? "light" : "success"}
                      variant="light"
                    >
                      {cat.is_active === false ? "Tắt" : "Bật"}
                    </Badge>
                    {cat.disable_reminder_chatbot ? (
                      <Badge size="sm" color="warning" variant="light">
                        Tắt nhắc nhở
                      </Badge>
                    ) : null}
                  </div>
                  {cat.description ? (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(cat)}
                    className="!px-3 !py-1.5"
                  >
                    Sửa
                  </Button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm({
                        title: "Xóa danh mục",
                        message: `Xóa “${cat.name}”?`,
                        confirmText: "Xóa",
                        variant: "danger",
                      });
                      if (ok) await deleteCategory(cat.id);
                    }}
                    className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-error-600 ring-1 ring-inset ring-gray-200 transition hover:bg-error-50 dark:ring-gray-700"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-lg">
        <div className="p-6 sm:p-8">
          <h2 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">
            {editing ? "Sửa danh mục" : "Thêm danh mục"}
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="cat-name">Tên danh mục</Label>
              <Input
                id="cat-name"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Ví dụ: Báo giá"
              />
            </div>

            <div>
              <Label>Màu sắc</Label>
              <CustomSelect
                value={form.color}
                onChange={(v) => setForm((prev) => ({ ...prev, color: v }))}
                options={CATEGORY_COLOR_PRESETS.map((item) => ({
                  value: item.value,
                  label: item.label,
                }))}
              />
              <div
                className="mt-2 h-2 w-full rounded-full"
                style={{ backgroundColor: resolveCategoryBgColor(form.color) }}
              />
            </div>

            <div>
              <Label htmlFor="cat-desc">Mô tả</Label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                placeholder="Mô tả ngắn"
              />
            </div>

            <Switch
              label="Bật danh mục"
              checked={form.is_active}
              onChange={(checked) =>
                setForm((prev) => ({ ...prev, is_active: checked }))
              }
            />
            <Switch
              label="Tắt nhắc nhở tự động với danh mục này"
              checked={form.disable_reminder_chatbot}
              onChange={(checked) =>
                setForm((prev) => ({
                  ...prev,
                  disable_reminder_chatbot: checked,
                }))
              }
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSavingCategory}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={isSavingCategory || !form.name.trim()}
            >
              {isSavingCategory ? "Đang lưu…" : "Lưu"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
