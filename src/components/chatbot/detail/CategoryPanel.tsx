"use client";

import CustomSelect from "@/components/form/CustomSelect";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { confirm } from "@/lib/confirm";
import {
  CATEGORY_COLOR_PRESETS,
  resolveCategoryBgColor,
} from "@/lib/chatbot-utils";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type { ChatbotCategory } from "@/types/chatbot";
import { useEffect, useState } from "react";
import { FiEdit, FiFolder, FiFolderPlus, FiTrash2 } from "react-icons/fi";

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

  const isTrulyEmpty = categories.length === 0;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      {!isTrulyEmpty && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 dark:border-gray-800">
          <Badge size="sm" color="primary" variant="light">
            {categories.length} Danh mục
          </Badge>
          <Button
            size="sm"
            onClick={openCreate}
            className="flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold"
          >
            <FiFolderPlus size={14} /> Thêm danh mục
          </Button>
        </div>
      )}

      {/* Main container */}
      <div className="overflow-hidden rounded-2xl border border-gray-150 bg-white dark:border-gray-800 dark:bg-white/[0.01]">
        {isLoadingCategories && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-55 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <FiFolder className="animate-pulse text-brand-500" size={20} />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Đang tải danh sách danh mục...
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
              <FiFolder size={24} />
            </div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Danh mục trống
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mb-4">
              Chưa có danh mục nào. Hãy tạo danh mục mới để dễ dàng nhóm các câu hỏi huấn luyện.
            </p>
            <Button
              size="sm"
              onClick={openCreate}
              className="flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold"
            >
              <FiFolderPlus size={13} /> Tạo danh mục đầu tiên
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {categories.map((cat) => (
              <li
                key={cat.id}
                className="group flex flex-col gap-3 px-4 py-3.5 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider"
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
                      {cat.is_active === false ? "Tắt" : "Hoạt động"}
                    </Badge>
                    {cat.disable_reminder_chatbot ? (
                      <Badge size="sm" color="warning" variant="light">
                        Tắt nhắc nhở
                      </Badge>
                    ) : null}
                  </div>
                  {cat.description ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-3 border-l border-gray-100 dark:border-gray-800">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
                
                <div className="flex shrink-0 gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition duration-150 justify-end">
                  <Tooltip content="Chỉnh sửa">
                    <button
                      type="button"
                      onClick={() => openEdit(cat)}
                      className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-brand-500 hover:text-brand-600 hover:shadow-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400 transition"
                    >
                      <FiEdit size={12} />
                    </button>
                  </Tooltip>
                  <Tooltip content="Xóa danh mục">
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
                      className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-error-600 hover:border-error-500 hover:bg-error-50 hover:shadow-xs dark:border-gray-800 dark:bg-gray-900 dark:hover:border-error-500 dark:hover:bg-error-500/10 transition"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </Tooltip>
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
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ví dụ: Đặt hàng, Khuyến mãi..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cat-color">Màu sắc hiển thị</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORY_COLOR_PRESETS.map((color) => {
                  const active = form.color === color.value;
                  return (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setForm({ ...form, color: color.value })}
                      className={`h-7 w-7 cursor-pointer rounded-full transition ${
                        active
                          ? "ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.label}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <Label htmlFor="cat-desc">Mô tả danh mục</Label>
              <textarea
                id="cat-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Mô tả ngắn về danh mục này..."
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-hidden focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-gray-100 p-3.5 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cat-active" className="!mb-0 cursor-pointer">
                    Trạng thái hoạt động
                  </Label>
                  <p className="text-[11px] text-gray-500">
                    Bật/Tắt phân loại câu hỏi này của Bot
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>

              <div className="border-t border-gray-50 dark:border-gray-800/80 my-1"></div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="cat-reminder" className="!mb-0 cursor-pointer">
                    Chặn nhắc nhở tự động
                  </Label>
                  <p className="text-[11px] text-gray-500">
                    Không gửi nhắc nhở khi khách hỏi chủ đề này
                  </p>
                </div>
                <Switch
                  checked={form.disable_reminder_chatbot}
                  onChange={(checked) =>
                    setForm({ ...form, disable_reminder_chatbot: checked })
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={() => void handleSave()} disabled={isSavingCategory}>
                {isSavingCategory ? "Đang lưu…" : "Lưu"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
