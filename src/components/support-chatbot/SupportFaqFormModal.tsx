"use client";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { SupportFaq, SupportMedia } from "@/types/support-chatbot";
import { useEffect, useState } from "react";
import SupportMediaPicker from "./SupportMediaPicker";

export interface SupportFaqFormValues {
  question: string;
  answer: string;
  is_active: boolean;
  media_ids: number[];
}

interface SupportFaqFormModalProps {
  isOpen: boolean;
  mode: "create" | "edit";
  initial?: SupportFaq | null;
  media: SupportMedia[];
  mediaLoading?: boolean;
  isSaving?: boolean;
  onClose: () => void;
  onSubmit: (values: SupportFaqFormValues) => void;
  onUploadMedia: (file: File) => Promise<SupportMedia>;
}

function initialMediaIds(faq?: SupportFaq | null): number[] {
  if (!faq?.images?.length) return [];
  return faq.images
    .map((img) => img.media_id)
    .filter((id): id is number => typeof id === "number");
}

export default function SupportFaqFormModal({
  isOpen,
  mode,
  initial,
  media,
  mediaLoading,
  isSaving,
  onClose,
  onSubmit,
  onUploadMedia,
}: SupportFaqFormModalProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuestion(initial?.question ?? "");
    setAnswer(initial?.answer ?? "");
    setIsActive(initial?.is_active !== false);
    setMediaIds(initialMediaIds(initial));
  }, [isOpen, initial]);

  const toggleMedia = (id: number) => {
    setMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const m = await onUploadMedia(file);
      setMediaIds((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    const q = question.trim();
    if (!q) return;
    onSubmit({
      question: q,
      answer: answer.trim(),
      is_active: isActive,
      media_ids: mediaIds,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg m-4">
      <div className="p-5 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          {mode === "create" ? "Thêm FAQ" : "Sửa FAQ"}
        </h3>

        <div className="space-y-4">
          <div>
            <Label>
              Câu hỏi <span className="text-error-500">*</span>
            </Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="VD: Cách đăng bài video như thế nào?"
            />
          </div>

          <div>
            <Label>Câu trả lời</Label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="Nội dung trả lời cho người dùng..."
              className="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
            />
            FAQ đang bật
          </label>

          <SupportMediaPicker
            media={media}
            mediaIds={mediaIds}
            mediaLoading={mediaLoading}
            uploading={uploading}
            disabled={isSaving}
            onToggle={toggleMedia}
            onUpload={handleUpload}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={isSaving || uploading}
          >
            Hủy
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving || uploading || !question.trim()}
          >
            {isSaving ? "Đang lưu…" : mode === "create" ? "Thêm" : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
