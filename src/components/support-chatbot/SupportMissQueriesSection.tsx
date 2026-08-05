"use client";

import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useSupportMissStore } from "@/stores/use-support-miss-store";
import { useSupportFaqStore } from "@/stores/use-support-faq-store";
import type { SupportMissQuery } from "@/types/support-chatbot";
import { useEffect, useState } from "react";
import { FiHelpCircle, FiTrash2 } from "react-icons/fi";
import SupportMediaPicker from "./SupportMediaPicker";

export default function SupportMissQueriesSection() {
  const items = useSupportMissStore((s) => s.items);
  const count = useSupportMissStore((s) => s.count);
  const page = useSupportMissStore((s) => s.page);
  const pageSize = useSupportMissStore((s) => s.pageSize);
  const search = useSupportMissStore((s) => s.search);
  const loading = useSupportMissStore((s) => s.loading);
  const saving = useSupportMissStore((s) => s.saving);
  const error = useSupportMissStore((s) => s.error);

  const setSearch = useSupportMissStore((s) => s.setSearch);
  const setPage = useSupportMissStore((s) => s.setPage);
  const fetchMiss = useSupportMissStore((s) => s.fetchMiss);
  const deleteMiss = useSupportMissStore((s) => s.deleteMiss);
  const clearAll = useSupportMissStore((s) => s.clearAll);
  const convertToFaq = useSupportMissStore((s) => s.convertToFaq);
  const fetchFaqs = useSupportFaqStore((s) => s.fetchFaqs);
  const media = useSupportFaqStore((s) => s.media);
  const mediaLoading = useSupportFaqStore((s) => s.mediaLoading);
  const fetchMedia = useSupportFaqStore((s) => s.fetchMedia);
  const uploadMedia = useSupportFaqStore((s) => s.uploadMedia);

  const [searchInput, setSearchInput] = useState(search);
  const [answerOpen, setAnswerOpen] = useState(false);
  const [current, setCurrent] = useState<SupportMissQuery | null>(null);
  const [answer, setAnswer] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    void fetchMiss();
  }, [fetchMiss, page, pageSize, search]);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput), 350);
    return () => window.clearTimeout(t);
  }, [searchInput, setSearch]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const closeAnswerModal = () => {
    setAnswerOpen(false);
    setCurrent(null);
    setAnswer("");
    setMediaIds([]);
  };

  const openAnswer = (row: SupportMissQuery) => {
    setCurrent(row);
    setAnswer("");
    setMediaIds([]);
    setAnswerOpen(true);
    void fetchMedia();
  };

  const toggleMedia = (id: number) => {
    setMediaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const m = await uploadMedia(file);
      setMediaIds((prev) => (prev.includes(m.id) ? prev : [...prev, m.id]));
      toast.success("Đã upload ảnh.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleConvert = async () => {
    if (!current) return;
    const a = answer.trim();
    if (!a) {
      toast.error("Nhập câu trả lời.");
      return;
    }
    try {
      await convertToFaq(current.id, {
        answer: a,
        is_active: true,
        media_ids: mediaIds,
      });
      toast.success("Đã thêm vào FAQ.");
      closeAnswerModal();
      void fetchFaqs({ silent: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (row: SupportMissQuery) => {
    const ok = await confirm({
      title: "Xóa câu hỏi miss",
      message: `Xóa «${row.question.slice(0, 80)}»?`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteMiss(row.id);
      toast.success("Đã xóa.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: "Xóa toàn bộ miss",
      message: "Xóa hết câu hỏi bot chưa trả lời được?",
      confirmText: "Xóa hết",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const n = await clearAll();
      toast.success(`Đã xóa ${n} bản ghi.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <FiHelpCircle size={16} />
            Câu hỏi bot chưa trả lời được
            {count > 0 ? (
              <Badge size="sm" color="warning" variant="light">
                {count}
              </Badge>
            ) : null}
          </h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={saving || count === 0}
          onClick={() => void handleClear()}
        >
          <FiTrash2 className="mr-1" size={14} />
          Xóa hết
        </Button>
      </div>

      <div className="w-full max-w-xs">
        <Input
          placeholder="Tìm câu hỏi miss…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error ? (
        <p className="text-xs text-error-600">{error}</p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="max-h-80 overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2">Câu hỏi</th>
                <th className="px-3 py-2">Cập nhật</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-gray-500">
                    Chưa có câu hỏi.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white hover:bg-gray-50/80 dark:bg-transparent dark:hover:bg-white/[0.02]"
                  >
                    <td className="max-w-[420px] px-3 py-2.5">
                      <p className="line-clamp-3 font-medium text-gray-900 dark:text-white/90">
                        {row.question}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-400">
                      {row.updated_at
                        ? new Date(row.updated_at).toLocaleString("vi-VN")
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          disabled={saving}
                          onClick={() => openAnswer(row)}
                        >
                          Trả lời → FAQ
                        </Button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(row)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
                          title="Xóa"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-800">
          <span>
            {count} câu · trang {page}/{totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={answerOpen}
        onClose={closeAnswerModal}
        className="max-w-lg m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Trả lời & thêm vào FAQ
          </h3>
          <p className="mb-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:bg-white/5 dark:text-gray-300">
            {current?.question}
          </p>
          <Label>Câu trả lời</Label>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={5}
            placeholder="Nhập câu trả lời cho khách…"
            className="mt-1 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />

          <div className="mt-4">
            <SupportMediaPicker
              media={media}
              mediaIds={mediaIds}
              mediaLoading={mediaLoading}
              uploading={uploading}
              disabled={saving}
              onToggle={toggleMedia}
              onUpload={handleUpload}
            />
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={closeAnswerModal}
              disabled={saving || uploading}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={() => void handleConvert()}
              disabled={saving || uploading || !answer.trim()}
            >
              {saving ? "Đang lưu…" : "Lưu vào FAQ"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
