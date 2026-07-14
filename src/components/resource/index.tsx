"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useAuthStore } from "@/stores/use-auth-store";
import { useZaloResourceStore } from "@/stores/use-zalo-resource-store";
import type { ZaloProductAppItem, ZaloResourceItem } from "@/types/zalo-resource";
import { useEffect, useState } from "react";
import {
  HiOutlineCollection,
  HiOutlinePlus,
  HiOutlineSparkles,
  HiOutlineViewGrid,
} from "react-icons/hi";
import ProductAppFormModal from "./ProductAppFormModal";
import ProductAppGrid from "./ProductAppGrid";
import ResourceCarousel from "./ResourceCarousel";
import ResourceFormModal from "./ResourceFormModal";

export default function ResourceView() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = Boolean(user?.isAdmin);

  const resources = useZaloResourceStore((s) => s.resources);
  const productApps = useZaloResourceStore((s) => s.productApps);
  const loading = useZaloResourceStore((s) => s.loading);
  const error = useZaloResourceStore((s) => s.error);
  const fetchAll = useZaloResourceStore((s) => s.fetchAll);
  const deleteResource = useZaloResourceStore((s) => s.deleteResource);
  const deleteProductApp = useZaloResourceStore((s) => s.deleteProductApp);

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ZaloResourceItem | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ZaloProductAppItem | null>(null);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const openCreateResource = () => {
    setEditingResource(null);
    setResourceModalOpen(true);
  };

  const openEditResource = (item: ZaloResourceItem) => {
    setEditingResource(item);
    setResourceModalOpen(true);
  };

  const handleDeleteResource = async (item: ZaloResourceItem) => {
    if (
      !(await confirm({
        title: "Xóa banner",
        message: `Xóa banner "${item.content}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteResource(item.id);
      toast.success("Đã xóa banner.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const openEditProduct = (item: ZaloProductAppItem) => {
    setEditingProduct(item);
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async (item: ZaloProductAppItem) => {
    if (
      !(await confirm({
        title: "Xóa sản phẩm",
        message: `Xóa "${item.title}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteProductApp(item.id);
      toast.success("Đã xóa sản phẩm.");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="w-full min-w-0 pb-2">
      <PageBreadcrumb
        pageTitle="Tài nguyên"
        showPageTitle={false}
        parents={[{ label: "Tài nguyên", href: "/resource" }]}
        className="mb-4 sm:mb-6"
      />

      <section className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-700 p-5 text-white shadow-theme-md sm:p-6 dark:border-brand-500/20">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-theme-xs font-medium backdrop-blur-sm">
              <HiOutlineSparkles size={14} className="shrink-0" />
              Trung tâm tài nguyên
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
              Khám phá công cụ &amp; giải pháp
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Banner nổi bật và danh sách sản phẩm ứng dụng — liên kết nhanh tới tài liệu,
              dịch vụ và tiện ích hỗ trợ vận hành Zalo.
            </p>
          </div>
          <div className="flex shrink-0 gap-3 self-start sm:self-center">
            <div className="min-w-[72px] rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold tabular-nums">{resources.length}</p>
              <p className="text-theme-xs text-white/80">Banner</p>
            </div>
            <div className="min-w-[72px] rounded-xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-2xl font-bold tabular-nums">{productApps.length}</p>
              <p className="text-theme-xs text-white/80">Sản phẩm</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <p className="mb-6 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-300">
          {error}
        </p>
      ) : null}

      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <HiOutlineCollection size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
                Banner nổi bật
              </h2>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Cuộn ngang để xem thêm
              </p>
            </div>
          </div>
          {isAdmin ? (
            <Button size="sm" onClick={openCreateResource}>
              <HiOutlinePlus className="mr-1" size={14} />
              Thêm banner
            </Button>
          ) : null}
        </div>
        {loading && resources.length === 0 ? (
          <div className="flex min-h-[180px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <ResourceCarousel
            items={resources}
            isAdmin={isAdmin}
            onEdit={openEditResource}
            onDelete={(item) => void handleDeleteResource(item)}
          />
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <HiOutlineViewGrid size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white/90">
                Sản phẩm &amp; ứng dụng
              </h2>
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">
                Thẻ giới thiệu dịch vụ và công cụ liên quan
              </p>
            </div>
          </div>
          {isAdmin ? (
            <Button size="sm" onClick={openCreateProduct}>
              <HiOutlinePlus className="mr-1" size={14} />
              Thêm sản phẩm
            </Button>
          ) : null}
        </div>
        {loading && productApps.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
          <ProductAppGrid
            items={productApps}
            isAdmin={isAdmin}
            onEdit={openEditProduct}
            onDelete={(item) => void handleDeleteProduct(item)}
          />
        )}
      </section>

      <ResourceFormModal
        open={resourceModalOpen}
        editingItem={editingResource}
        onClose={() => {
          setResourceModalOpen(false);
          setEditingResource(null);
        }}
      />

      <ProductAppFormModal
        open={productModalOpen}
        editingItem={editingProduct}
        onClose={() => {
          setProductModalOpen(false);
          setEditingProduct(null);
        }}
      />
    </div>
  );
}