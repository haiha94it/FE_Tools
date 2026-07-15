"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { canManageGuidesAndResources } from "@/lib/map-auth-user";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloGuideStore } from "@/stores/use-zalo-guide-store";
import type { ZaloGuideItem } from "@/types/zalo-guide";
import { useEffect, useState } from "react";
import { HiOutlineAcademicCap, HiOutlinePlus, HiOutlinePlay } from "react-icons/hi";
import GuideCarousel from "./GuideCarousel";
import GuideFormModal from "./GuideFormModal";
import TutorialVideoEmbed from "./TutorialVideoEmbed";

export default function GuidesView() {
  const user = useAuthStore((s) => s.user);
  const canManage = canManageGuidesAndResources(user);

  const guides = useZaloGuideStore((s) => s.guides);
  const loading = useZaloGuideStore((s) => s.loading);
  const error = useZaloGuideStore((s) => s.error);
  const fetchGuides = useZaloGuideStore((s) => s.fetchGuides);
  const deleteGuide = useZaloGuideStore((s) => s.deleteGuide);

  const [formOpen, setFormOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<ZaloGuideItem | null>(null);

  useEffect(() => {
    void fetchGuides();
  }, [fetchGuides]);

  const scrollToGuide = (item: ZaloGuideItem) => {
    const el = document.getElementById(`guide-video-${item.id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openCreate = () => {
    if (!canManage) return;
    setEditingGuide(null);
    setFormOpen(true);
  };

  const openEdit = (item: ZaloGuideItem) => {
    if (!canManage) return;
    setEditingGuide(item);
    setFormOpen(true);
  };

  const handleDelete = async (item: ZaloGuideItem) => {
    if (!canManage) return;
    if (
      !(await confirm({
        title: "Xóa hướng dẫn",
        message: `Xóa "${item.title}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteGuide(item.id);
      toast.success("Đã xóa hướng dẫn.");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="w-full min-w-0 pb-4">
      <PageBreadcrumb
        pageTitle="Hướng dẫn"
        showPageTitle={false}
        parents={[{ label: "Hướng dẫn", href: "/guides" }]}
        className="mb-4 sm:mb-6"
      />

      <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 p-5 text-white shadow-theme-md sm:p-6 dark:border-brand-500/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-theme-xs font-medium backdrop-blur-sm">
              <HiOutlineAcademicCap size={14} className="shrink-0" />
              Hướng dẫn sử dụng
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              Video hướng dẫn tính năng
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Chọn chủ đề trên carousel để xem video chi tiết. Nội dung được lọc theo hệ
              thống bạn đang sử dụng.
            </p>
          </div>
          {canManage ? (
            <Button
              size="sm"
              className="shrink-0 self-start border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:self-center"
              onClick={openCreate}
            >
              <HiOutlinePlus className="mr-1" size={14} />
              Thêm hướng dẫn
            </Button>
          ) : null}
        </div>
      </section>

      {error ? (
        <p className="mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      ) : null}

      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-4 flex min-w-0 items-center gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            <HiOutlinePlay size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
              Danh sách chủ đề
            </h2>
            <p className="text-theme-xs text-gray-500 dark:text-gray-400">
              Bấm thẻ để cuộn tới video tương ứng
            </p>
          </div>
        </div>
        {loading && guides.length === 0 ? (
          <div className="flex min-h-[200px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <GuideCarousel
            items={guides}
            isAdmin={canManage}
            onSelect={scrollToGuide}
            onEdit={openEdit}
            onDelete={(item) => void handleDelete(item)}
          />
        )}
      </section>

      <section className="space-y-10">
        {guides.map((item) => (
          <article
            key={item.id}
            id={`guide-video-${item.id}`}
            className="scroll-mt-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-6"
          >
            <div className="mb-5 text-center">
              <p className="text-theme-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                Hướng dẫn sử dụng
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl dark:text-white/90">
                {item.title}
              </h2>
            </div>
            <TutorialVideoEmbed url={item.link} title={item.title} />
          </article>
        ))}
      </section>

      {canManage ? (
        <GuideFormModal
          open={formOpen}
          editingItem={editingGuide}
          onClose={() => {
            setFormOpen(false);
            setEditingGuide(null);
          }}
        />
      ) : null}
    </div>
  );
}