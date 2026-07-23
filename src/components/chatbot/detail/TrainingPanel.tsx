"use client";

import TrainingFormModal, {
  type TrainingFormValues,
} from "@/components/chatbot/detail/TrainingFormModal";
import CustomSelect from "@/components/form/CustomSelect";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { confirm } from "@/lib/confirm";
import {
  resolveCategoryBgColor,
  truncateText,
} from "@/lib/chatbot-utils";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type { TrainingDataItem } from "@/types/chatbot";
import { useEffect, useMemo, useState } from "react";

interface TrainingPanelProps {
  chatbotId: number;
}

export default function TrainingPanel({ chatbotId }: TrainingPanelProps) {
  const setChatbotId = useChatbotTrainingStore((s) => s.setChatbotId);
  const trainingData = useChatbotTrainingStore((s) => s.trainingData);
  const trainingCount = useChatbotTrainingStore((s) => s.trainingCount);
  const isLoadingTraining = useChatbotTrainingStore((s) => s.isLoadingTraining);
  const trainingSearch = useChatbotTrainingStore((s) => s.trainingSearch);
  const categoryFilter = useChatbotTrainingStore((s) => s.categoryFilter);
  const hideAutoHarvested = useChatbotTrainingStore((s) => s.hideAutoHarvested);
  const page = useChatbotTrainingStore((s) => s.page);
  const pageSize = useChatbotTrainingStore((s) => s.pageSize);
  const categories = useChatbotTrainingStore((s) => s.categories);
  const images = useChatbotTrainingStore((s) => s.images);
  const isSavingTraining = useChatbotTrainingStore((s) => s.isSavingTraining);

  const setTrainingSearch = useChatbotTrainingStore((s) => s.setTrainingSearch);
  const setCategoryFilter = useChatbotTrainingStore((s) => s.setCategoryFilter);
  const setHideAutoHarvested = useChatbotTrainingStore(
    (s) => s.setHideAutoHarvested,
  );
  const setPage = useChatbotTrainingStore((s) => s.setPage);
  const fetchTrainingData = useChatbotTrainingStore((s) => s.fetchTrainingData);
  const fetchCategories = useChatbotTrainingStore((s) => s.fetchCategories);
  const fetchImages = useChatbotTrainingStore((s) => s.fetchImages);
  const createTrainingData = useChatbotTrainingStore((s) => s.createTrainingData);
  const updateTrainingData = useChatbotTrainingStore((s) => s.updateTrainingData);
  const deleteTrainingData = useChatbotTrainingStore((s) => s.deleteTrainingData);
  const clearAllTrainingData = useChatbotTrainingStore(
    (s) => s.clearAllTrainingData,
  );
  const syncEmbeddings = useChatbotTrainingStore((s) => s.syncEmbeddings);
  const exportTrainingData = useChatbotTrainingStore((s) => s.exportTrainingData);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingDataItem | null>(null);

  useEffect(() => {
    setChatbotId(chatbotId);
    void fetchCategories();
    void fetchImages({ silent: true });
  }, [chatbotId, setChatbotId, fetchCategories, fetchImages]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTrainingData();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [
    chatbotId,
    trainingSearch,
    categoryFilter,
    page,
    pageSize,
    fetchTrainingData,
  ]);

  const rows = useMemo(() => {
    if (!hideAutoHarvested) return trainingData;
    return trainingData.filter((item) => !item.is_auto_harvested);
  }, [trainingData, hideAutoHarvested]);

  const totalPages = Math.max(1, Math.ceil(trainingCount / pageSize));

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Tất cả danh mục" },
      ...categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (item: TrainingDataItem) => {
    setEditing(item);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TrainingFormValues) => {
    if (editing) {
      const ok = await updateTrainingData(editing.id, {
        question: values.question,
        answer: values.answer,
        category_id: values.categoryId,
        image_send_mode: values.imageSendMode,
        training_images: values.imageIds,
      });
      if (ok) setFormOpen(false);
      return;
    }

    const ok = await createTrainingData({
      chatbot_id: chatbotId,
      question: values.question,
      answer: values.answer,
      category_id: values.categoryId,
      image_send_mode: values.imageSendMode,
      training_images: values.imageIds,
    });
    if (ok) setFormOpen(false);
  };

  const handleClearAll = async () => {
    const ok = await confirm({
      title: "Xóa toàn bộ Q&A",
      message: "Thao tác này không thể hoàn tác.",
      description: `Sẽ xóa toàn bộ dữ liệu huấn luyện của kịch bản #${chatbotId}.`,
      confirmText: "Xóa tất cả",
      variant: "danger",
    });
    if (!ok) return;
    await clearAllTrainingData();
  };

  const handleExport = async () => {
    const data = await exportTrainingData();
    if (data == null) return;
    const blob = new Blob(
      [typeof data === "string" ? data : JSON.stringify(data, null, 2)],
      { type: "text/plain;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatbot-${chatbotId}-training-export.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" color="primary" variant="light">
            {trainingCount} Q&A
          </Badge>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <input
              type="checkbox"
              checked={hideAutoHarvested}
              onChange={(e) => setHideAutoHarvested(e.target.checked)}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            Ẩn câu hỏi auto-harvested
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openCreate}>
            + Thêm Q&A
          </Button>
          <Button size="sm" variant="outline" onClick={() => void handleExport()}>
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void syncEmbeddings()}
          >
            Đồng bộ vector
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleClearAll()}
            className="!text-error-600"
          >
            Xóa tất cả
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          placeholder="Tìm theo câu hỏi…"
          value={trainingSearch}
          onChange={(e) => setTrainingSearch(e.target.value)}
        />
        <CustomSelect
          value={categoryFilter != null ? String(categoryFilter) : ""}
          onChange={(v) => setCategoryFilter(v ? Number(v) : null)}
          options={categoryOptions}
          placeholder="Lọc danh mục"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.02]">
        {isLoadingTraining && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Đang tải Q&A…
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-500">
            Chưa có dữ liệu huấn luyện. Thêm Q&A để bot trả lời khách.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {item.category ? (
                      <span
                        className="inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        style={{
                          backgroundColor: resolveCategoryBgColor(
                            item.category.color,
                          ),
                        }}
                      >
                        {item.category.name}
                      </span>
                    ) : (
                      <Badge size="sm" color="light" variant="light">
                        Chưa phân loại
                      </Badge>
                    )}
                    {item.is_auto_harvested ? (
                      <Badge size="sm" color="warning" variant="light">
                        Auto
                      </Badge>
                    ) : null}
                    {(item.images?.length ?? 0) > 0 ? (
                      <span className="text-xs text-gray-500">
                        {item.images!.length} ảnh
                      </span>
                    ) : null}
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.question}
                  </p>
                  {item.answer ? (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {truncateText(item.answer, 120)}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm italic text-gray-400">
                      (Chưa có câu trả lời)
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(item)}
                    className="!px-3 !py-1.5"
                  >
                    Sửa
                  </Button>
                  <Tooltip content="Xóa Q&A">
                    <button
                      type="button"
                      aria-label="Xóa Q&A"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Xóa Q&A",
                          message: "Bạn chắc chắn muốn xóa câu hỏi này?",
                          confirmText: "Xóa",
                          variant: "danger",
                        });
                        if (ok) await deleteTrainingData(item.id);
                      }}
                      className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium text-error-600 ring-1 ring-inset ring-gray-200 transition hover:bg-error-50 dark:ring-gray-700 dark:hover:bg-error-500/10"
                    >
                      Xóa
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      ) : null}

      <TrainingFormModal
        isOpen={formOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        categories={categories}
        libraryImages={images}
        isSaving={isSavingTraining}
        onClose={() => setFormOpen(false)}
        onSubmit={(values) => {
          void handleSubmit(values);
        }}
      />
    </div>
  );
}
