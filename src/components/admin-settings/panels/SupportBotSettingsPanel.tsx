"use client";

import SupportEditorsSection from "@/components/support-chatbot/SupportEditorsSection";
import SupportFaqFormModal, {
  type SupportFaqFormValues,
} from "@/components/support-chatbot/SupportFaqFormModal";
import SupportMissQueriesSection from "@/components/support-chatbot/SupportMissQueriesSection";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { confirm } from "@/lib/confirm";
import { canAccessAdminSettings } from "@/lib/map-auth-user";
import { useAuthStore } from "@/stores/use-auth-store";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useSupportFaqStore } from "@/stores/use-support-faq-store";
import type { SupportFaq } from "@/types/support-chatbot";
import { useEffect, useState } from "react";
import {
  FiDownload,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

export default function SupportBotSettingsPanel() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = canAccessAdminSettings(user);
  const faqs = useSupportFaqStore((s) => s.faqs);
  const count = useSupportFaqStore((s) => s.count);
  const page = useSupportFaqStore((s) => s.page);
  const pageSize = useSupportFaqStore((s) => s.pageSize);
  const search = useSupportFaqStore((s) => s.search);
  const loading = useSupportFaqStore((s) => s.loading);
  const saving = useSupportFaqStore((s) => s.saving);
  const media = useSupportFaqStore((s) => s.media);
  const mediaLoading = useSupportFaqStore((s) => s.mediaLoading);
  const error = useSupportFaqStore((s) => s.error);

  const setSearch = useSupportFaqStore((s) => s.setSearch);
  const setPage = useSupportFaqStore((s) => s.setPage);
  const fetchFaqs = useSupportFaqStore((s) => s.fetchFaqs);
  const fetchMedia = useSupportFaqStore((s) => s.fetchMedia);
  const createFaq = useSupportFaqStore((s) => s.createFaq);
  const updateFaq = useSupportFaqStore((s) => s.updateFaq);
  const deleteFaq = useSupportFaqStore((s) => s.deleteFaq);
  const clearFaqs = useSupportFaqStore((s) => s.clearFaqs);
  const exportText = useSupportFaqStore((s) => s.exportText);
  const uploadMedia = useSupportFaqStore((s) => s.uploadMedia);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupportFaq | null>(null);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    void fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, setSearch]);

  useEffect(() => {
    void fetchFaqs();
  }, [fetchFaqs, page, pageSize, search]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (row: SupportFaq) => {
    setEditing(row);
    setFormOpen(true);
  };

  const handleSubmit = async (values: SupportFaqFormValues) => {
    try {
      if (editing) {
        await updateFaq(editing.id, values);
        toast.success("Đã cập nhật FAQ.");
      } else {
        await createFaq(values);
        toast.success("Đã thêm FAQ.");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (row: SupportFaq) => {
    const ok = await confirm({
      title: "Xóa FAQ",
      message: `Xóa câu hỏi «${row.question.slice(0, 80)}»?`,
      confirmText: "Xóa",
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteFaq(row.id);
      toast.success("Đã xóa FAQ.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleClear = async () => {
    const ok = await confirm({
      title: "Xóa toàn bộ FAQ",
      message: "Toàn bộ kịch bản hỏi đáp CSKH sẽ bị xóa. Không hoàn tác.",
      confirmText: "Xóa hết",
      variant: "danger",
    });
    if (!ok) return;
    try {
      const n = await clearFaqs();
      toast.success(`Đã xóa ${n} bản ghi.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleExport = async () => {
    try {
      const text = await exportText();
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "support-faq-export.txt";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file TXT.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className="space-y-5 p-1 sm:p-2">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          Setup bot hỏi đáp CSKH
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          Cấu hình câu hỏi – câu trả lời cho <strong>con trợ lý HDSD</strong>{" "}
          (nút <strong>AI</strong> góc phải màn hình). User click AI → popup
          «Trợ lý riêng của bạn» → bot trả lời theo FAQ bên dưới.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Tìm câu hỏi / trả lời…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={openCreate} disabled={saving}>
            <FiPlus className="mr-1" size={14} />
            Thêm FAQ
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleExport()}
            disabled={saving}
          >
            <FiDownload className="mr-1" size={14} />
            Export
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void handleClear()}
            disabled={saving || count === 0}
          >
            <FiTrash2 className="mr-1" size={14} />
            Xóa hết
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
              <tr>
                <th className="px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">Câu hỏi</th>
                <th className="px-3 py-2.5">Trả lời</th>
                <th className="px-3 py-2.5">Trạng thái</th>
                <th className="px-3 py-2.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading && faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    Đang tải…
                  </td>
                </tr>
              ) : faqs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-500">
                    Chưa có FAQ. Bấm «Thêm FAQ» để tạo kịch bản đầu tiên.
                  </td>
                </tr>
              ) : (
                faqs.map((row, idx) => (
                  <tr
                    key={row.id}
                    className="bg-white hover:bg-gray-50/80 dark:bg-transparent dark:hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2.5 text-xs text-gray-400">
                      {(page - 1) * pageSize + idx + 1}
                    </td>
                    <td className="max-w-[220px] px-3 py-2.5">
                      <p className="line-clamp-2 font-medium text-gray-900 dark:text-white/90">
                        {row.question}
                      </p>
                      {row.images && row.images.length > 0 ? (
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {row.images.length} ảnh
                        </p>
                      ) : null}
                    </td>
                    <td className="max-w-[280px] px-3 py-2.5">
                      <p className="line-clamp-2 text-gray-600 dark:text-gray-400">
                        {row.answer || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge
                        size="sm"
                        color={row.is_active === false ? "light" : "success"}
                        variant="light"
                      >
                        {row.is_active === false ? "Tắt" : "Bật"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:hover:bg-white/5"
                          title="Sửa"
                        >
                          <FiEdit2 size={14} />
                        </button>
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
            {count} FAQ · trang {page}/{totalPages}
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

      <SupportMissQueriesSection />

      {isAdmin ? <SupportEditorsSection /> : null}

      <SupportFaqFormModal
        isOpen={formOpen}
        mode={editing ? "edit" : "create"}
        initial={editing}
        media={media}
        mediaLoading={mediaLoading}
        isSaving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={(v) => void handleSubmit(v)}
        onUploadMedia={uploadMedia}
      />
    </div>
  );
}
