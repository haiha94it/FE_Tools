"use client";

import MediaPickerModal from "@/components/chatbot/detail/MediaPickerModal";
import PlaceholderHint from "@/components/chatbot/PlaceholderHint";
import CustomSelect from "@/components/form/CustomSelect";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import {
  getTrainingImageUrl,
  resolveTrainingImageMediaId,
  resolveTrainingImageSendMode,
} from "@/lib/chatbot-utils";
import type {
  ChatbotCategory,
  TrainingDataItem,
  TrainingImage,
  TrainingImageSendMode,
} from "@/types/chatbot";
import {
  TRAINING_ANSWER_MAX_LENGTH,
  TRAINING_QUESTION_MAX_LENGTH,
} from "@/types/chatbot";
import { useMemo, useState } from "react";

export interface TrainingFormValues {
  question: string;
  answer: string;
  categoryId: number | null;
  imageSendMode: TrainingImageSendMode;
  imageIds: number[];
}

interface TrainingFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initial?: TrainingDataItem | null;
  categories: ChatbotCategory[];
  libraryImages: TrainingImage[];
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (values: TrainingFormValues) => void;
}

function buildInitialImageIds(initial?: TrainingDataItem | null): number[] {
  if (!initial?.images?.length) return [];
  return initial.images.map((img) => resolveTrainingImageMediaId(img));
}

function TrainingFormBody({
  mode,
  initial,
  categories,
  libraryImages,
  isSaving = false,
  onClose,
  onSubmit,
}: Omit<TrainingFormModalProps, "isOpen">) {
  const [question, setQuestion] = useState(initial?.question ?? "");
  const [answer, setAnswer] = useState(initial?.answer ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.category?.id ?? initial?.category_id ?? null,
  );
  const [imageSendMode, setImageSendMode] = useState<TrainingImageSendMode>(
    resolveTrainingImageSendMode(initial?.image_send_mode),
  );
  const [imageIds, setImageIds] = useState<number[]>(() =>
    buildInitialImageIds(initial),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerIds, setPickerIds] = useState<number[]>([]);

  const selectedImages = useMemo(() => {
    return imageIds.map((id) => {
      const fromLib = libraryImages.find(
        (img) => resolveTrainingImageMediaId(img) === id || img.id === id,
      );
      const fromInitial = initial?.images?.find(
        (img) => resolveTrainingImageMediaId(img) === id || img.id === id,
      );
      return fromLib ?? fromInitial ?? { id, media: id };
    });
  }, [imageIds, libraryImages, initial]);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Không phân loại" },
      ...categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories],
  );

  const canSubmit = question.trim().length > 0 && !isSaving;

  return (
    <>
      <div className="max-h-[85dvh] overflow-y-auto p-6 sm:p-8">
        <h2 className="pr-10 text-lg font-semibold text-gray-900 dark:text-white">
          {mode === "create" ? "Thêm Q&A" : "Sửa Q&A"}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Câu trả lời có thể để trống nếu chỉ thu thập câu hỏi.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="qa-question">Câu hỏi</Label>
              <span className="text-xs text-gray-400">
                {question.trim().length}/{TRAINING_QUESTION_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="qa-question"
              value={question}
              maxLength={TRAINING_QUESTION_MAX_LENGTH}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Khách thường hỏi gì?"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label htmlFor="qa-answer">Câu trả lời</Label>
              <span className="text-xs text-gray-400">
                {answer.trim().length}/{TRAINING_ANSWER_MAX_LENGTH}
              </span>
            </div>
            <textarea
              id="qa-answer"
              value={answer}
              maxLength={TRAINING_ANSWER_MAX_LENGTH}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              placeholder="Chào {{title}} {{name}}, ..."
            />
            <PlaceholderHint className="mt-1.5" />
          </div>

          <div>
            <Label>Danh mục</Label>
            <CustomSelect
              value={categoryId != null ? String(categoryId) : ""}
              onChange={(v) => setCategoryId(v ? Number(v) : null)}
              options={categoryOptions}
              placeholder="Chọn danh mục"
            />
          </div>

          <div>
            <Label>Chế độ gửi ảnh</Label>
            <div className="mt-1.5 flex flex-wrap gap-3">
              {(
                [
                  { value: "all", label: "Gửi tất cả ảnh" },
                  { value: "random_one", label: "Ngẫu nhiên 1 ảnh" },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="image-send-mode"
                    checked={imageSendMode === option.value}
                    onChange={() => setImageSendMode(option.value)}
                    className="text-brand-500 focus:ring-brand-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Ảnh đính kèm ({imageIds.length})</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setPickerIds(imageIds);
                  setPickerOpen(true);
                }}
                className="!px-3 !py-1.5"
              >
                Chọn ảnh
              </Button>
            </div>
            {selectedImages.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedImages.map((img) => {
                  const src = getTrainingImageUrl(img);
                  return (
                    <div
                      key={img.id}
                      className="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">
                          #{img.id}
                        </div>
                      )}
                      <button
                        type="button"
                        aria-label="Bỏ ảnh"
                        onClick={() =>
                          setImageIds((prev) =>
                            prev.filter((id) => id !== img.id),
                          )
                        }
                        className="absolute right-0.5 top-0.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-500">Chưa chọn ảnh.</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            size="sm"
            disabled={!canSubmit}
            onClick={() =>
              onSubmit({
                question: question.trim(),
                answer: answer.trim(),
                categoryId,
                imageSendMode,
                imageIds,
              })
            }
          >
            {isSaving ? "Đang lưu…" : mode === "create" ? "Thêm Q&A" : "Lưu"}
          </Button>
        </div>
      </div>

      <MediaPickerModal
        isOpen={pickerOpen}
        images={libraryImages}
        selectedIds={pickerIds}
        onClose={() => setPickerOpen(false)}
        onToggle={(id) =>
          setPickerIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
          )
        }
        onClear={() => setPickerIds([])}
        onConfirm={() => {
          setImageIds(pickerIds);
          setPickerOpen(false);
        }}
      />
    </>
  );
}

export default function TrainingFormModal({
  isOpen,
  mode,
  initial,
  categories,
  libraryImages,
  isSaving = false,
  onClose,
  onSubmit,
}: TrainingFormModalProps) {
  const formKey =
    mode === "edit" && initial
      ? `edit-${initial.id}`
      : `create-${isOpen ? "open" : "closed"}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      {isOpen ? (
        <TrainingFormBody
          key={formKey}
          mode={mode}
          initial={initial}
          categories={categories}
          libraryImages={libraryImages}
          isSaving={isSaving}
          onClose={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}
