"use client";

import TrainingFormModal, {
  type TrainingFormValues,
} from "@/components/chatbot/detail/TrainingFormModal";
import CustomSelect from "@/components/form/CustomSelect";
import Input from "@/components/form/input/InputField";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { confirm } from "@/lib/confirm";
import {
  resolveCategoryBgColor,
  truncateText,
} from "@/lib/chatbot-utils";
import { useChatbotTrainingStore } from "@/stores/use-chatbot-training-store";
import type { TrainingDataItem } from "@/types/chatbot";
import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiChevronDown,
  FiCpu,
  FiDownload,
  FiEdit,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";

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
  const [actionsOpen, setActionsOpen] = useState(false);

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
    setActionsOpen(false);
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
    setActionsOpen(false);
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

  const handleSyncEmbeddings = async () => {
    setActionsOpen(false);
    await syncEmbeddings();
  };

  const isTrulyEmpty = trainingCount === 0 && !trainingSearch.trim() && categoryFilter === null;

  return (
    <div className="space-y-4">
      {/* Top action row */}
      {!isTrulyEmpty && (
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3.5 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <Badge size="sm" color="primary" variant="light">
              {trainingCount} Q&A
            </Badge>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition">
              <input
                type="checkbox"
                checked={hideAutoHarvested}
                onChange={(e) => setHideAutoHarvested(e.target.checked)}
                className="h-4 w-4 rounded-md border-gray-300 text-brand-500 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800"
              />
              Ẩn auto-harvested
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={openCreate}
              className="flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold"
            >
              <FiPlus size={14} /> Thêm Q&A
            </Button>

            <div className="relative">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActionsOpen(!actionsOpen)}
                className="dropdown-toggle flex items-center gap-1 !px-3 !py-2 text-xs font-medium"
              >
                Tác vụ <FiChevronDown size={12} className={`transition-transform duration-200 ${actionsOpen ? "rotate-180" : ""}`} />
              </Button>
              <Dropdown isOpen={actionsOpen} onClose={() => setActionsOpen(false)} className="w-48 right-0 mt-1.5">
                <DropdownItem onClick={() => void handleExport()} className="flex items-center gap-2">
                  <FiDownload size={14} className="text-gray-400" /> Xuất file (Export)
                </DropdownItem>
                <DropdownItem onClick={() => void handleSyncEmbeddings()} className="flex items-center gap-2">
                  <FiRefreshCw size={14} className="text-gray-400" /> Đồng bộ Vector AI
                </DropdownItem>
                <div className="border-t border-gray-100 dark:border-gray-800 my-1"></div>
                <DropdownItem
                  onClick={() => void handleClearAll()}
                  className="flex items-center gap-2 !text-error-600 hover:!bg-error-50 dark:hover:!bg-error-500/10"
                >
                  <FiTrash2 size={14} /> Xóa toàn bộ
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>
      )}

      {/* Filter inputs row */}
      {!isTrulyEmpty && (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <Input
            placeholder="Tìm kiếm câu hỏi..."
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
      )}

      {/* Training data content card */}
      <div className="overflow-hidden rounded-2xl border border-gray-150 bg-white dark:border-gray-800 dark:bg-white/[0.01]">
        {isLoadingTraining && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="relative mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <FiCpu size={20} className="animate-pulse" />
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Đang tải danh sách Q&A...
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 dark:bg-gray-800/50 dark:text-gray-500">
              <FiBookOpen size={24} />
            </div>
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Dữ liệu huấn luyện trống
            </h5>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[280px] mb-4">
              Chưa có dữ liệu Q&A. Hãy thêm câu hỏi và câu trả lời mẫu để huấn luyện bot thông minh hơn.
            </p>
            <Button
              size="sm"
              onClick={openCreate}
              className="flex items-center gap-1.5 !px-3.5 !py-2 text-xs font-semibold"
            >
              <FiPlus size={13} /> Thêm câu hỏi đầu tiên
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rows.map((item) => (
              <div
                key={item.id}
                className="group flex flex-col gap-3 px-4 py-3.5 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.category ? (
                      <span
                        className="inline-flex rounded-md px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider"
                        style={{
                          backgroundColor: resolveCategoryBgColor(
                            item.category.color,
                          ),
                        }}
                      >
                        {item.category.name}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                        Chưa phân loại
                      </span>
                    )}
                    {item.is_auto_harvested ? (
                      <Badge size="sm" color="warning" variant="light">
                        Tự động
                      </Badge>
                    ) : null}
                    {(item.images?.length ?? 0) > 0 ? (
                      <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                        • {item.images!.length} ảnh đính kèm
                      </span>
                    ) : null}
                  </div>
                  
                  <h6 className="text-xs font-semibold text-gray-900 dark:text-white leading-relaxed">
                    Q: {item.question}
                  </h6>
                  
                  {item.answer ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed pl-3 border-l border-gray-100 dark:border-gray-800">
                      A: {truncateText(item.answer, 120)}
                    </p>
                  ) : (
                    <p className="text-xs italic text-gray-400 pl-3 border-l border-gray-100 dark:border-gray-800">
                      (Chưa thiết lập câu trả lời mẫu)
                    </p>
                  )}
                </div>

                <div className="flex sm:flex-col justify-end shrink-0 gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition duration-150">
                  <Tooltip content="Chỉnh sửa">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:border-brand-500 hover:text-brand-600 hover:shadow-xs dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400 transition"
                    >
                      <FiEdit size={12} />
                    </button>
                  </Tooltip>
                  
                  <Tooltip content="Xóa Q&A">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await confirm({
                          title: "Xóa Q&A",
                          message: "Bạn chắc chắn muốn xóa câu hỏi này?",
                          confirmText: "Xóa",
                          variant: "danger",
                        });
                        if (ok) await deleteTrainingData(item.id);
                      }}
                      className="cursor-pointer flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 bg-white text-error-600 hover:border-error-500 hover:bg-error-50 hover:shadow-xs dark:border-gray-800 dark:bg-gray-900 dark:hover:border-error-500 dark:hover:bg-error-500/10 transition"
                    >
                      <FiTrash2 size={12} />
                    </button>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <span className="font-medium">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="!px-2.5 !py-1 text-[11px]"
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="!px-2.5 !py-1 text-[11px]"
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
