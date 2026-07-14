"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useModal } from "@/hooks/useModal";
import {
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  createChannelPage,
  createStoreProduct,
  deleteStoreProduct,
  fetchPageInfo,
  fetchStoreProducts,
  formatZaloTimestamp,
  updatePageField,
  updatePageVisibility,
} from "@/lib/zalo-video/creator-public-api";
import { refreshCsrfToken } from "@/lib/zalo-video/session";
import type { ZaloChannelInfo, ZaloStoreProductItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";

interface ChannelPagePanelProps {
  accountId: number;
  channelInfo?: ZaloChannelInfo;
}

function isPageMissing(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;
  const record = error as { error?: number | string };
  return record.error === -105 || record.error === "-105";
}

export default function ChannelPagePanel({
  accountId,
}: ChannelPagePanelProps) {
  const [loading, setLoading] = useState(true);
  const [pageMissing, setPageMissing] = useState(false);
  const [pageName, setPageName] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [pageThumbnail, setPageThumbnail] = useState<string | null>(null);
  const [pageVisible, setPageVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [products, setProducts] = useState<ZaloStoreProductItem[]>([]);
  const [saving, setSaving] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createVisible, setCreateVisible] = useState(true);
  const [creating, setCreating] = useState(false);

  const addModal = useModal();
  const [productName, setProductName] = useState("");
  const [productLink, setProductLink] = useState("");
  const [productThumb, setProductThumb] = useState("");
  const [addingProduct, setAddingProduct] = useState(false);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const info = await fetchPageInfo(accountId);
      if (isPageMissing(info)) {
        setPageMissing(true);
        setProducts([]);
        return;
      }
      setPageMissing(false);
      setPageName(info.data?.name ?? "");
      setPageDescription(info.data?.description ?? "");
      setPageThumbnail(info.data?.thumbnail ?? null);
      setPageVisible(info.data?.showed ?? true);
      const list = await fetchStoreProducts(accountId, 0);
      setProducts(list);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPageMissing(true);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void refreshCsrfToken(accountId);
    void loadPage();
  }, [accountId, loadPage]);

  const handleCreatePage = async () => {
    if (!createName.trim()) {
      toast.error("Nhập tên trang thông tin");
      return;
    }
    setCreating(true);
    try {
      const result = await createChannelPage({
        accountId,
        name: createName.trim(),
        description: createDescription.trim(),
        showed: createVisible ? 1 : 0,
      });
      if (result.error && result.error !== 0) {
        toast.error(result.msg ?? "Không tạo được trang");
        return;
      }
      toast.success("Đã tạo trang thông tin");
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveInfo = async () => {
    setSaving(true);
    try {
      await updatePageField({ accountId, value: pageName, type: "name" });
      await updatePageField({
        accountId,
        value: pageDescription,
        type: "description",
      });
      toast.success("Đã lưu thông tin trang");
      setEditing(false);
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVisibility = async (visible: boolean) => {
    try {
      await updatePageVisibility(accountId, visible ? 1 : 0);
      setPageVisible(visible);
      toast.success("Đã cập nhật hiển thị trang");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleAddProduct = async () => {
    if (!productName.trim() || !productLink.trim()) {
      toast.error("Nhập tên và liên kết sản phẩm");
      return;
    }
    setAddingProduct(true);
    try {
      await createStoreProduct({
        accountId,
        name: productName.trim(),
        link: productLink.trim(),
        thumbnails: productThumb.trim() || "[]",
      });
      toast.success("Đã thêm nội dung");
      addModal.closeModal();
      setProductName("");
      setProductLink("");
      setProductThumb("");
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setAddingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: ZaloStoreProductItem) => {
    if (
      !(await confirm({
        title: "Xóa nội dung",
        message: `Xóa "${product.name}"?`,
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteStoreProduct(accountId, product.id);
      toast.success("Đã xóa nội dung");
      await loadPage();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <ComponentCard title="Trang thông tin" desc="Đang tải…">
        <p className="py-16 text-center text-sm text-gray-500">Đang tải…</p>
      </ComponentCard>
    );
  }

  if (pageMissing) {
    return (
      <ComponentCard
        title="Tạo trang thông tin"
        desc="Trang giúp thu hút người xem và giới thiệu sản phẩm/dịch vụ"
      >
        <div className="mx-auto max-w-lg space-y-4">
          <div className="flex justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/10">
              <HiOutlineDocumentText size={24} className="shrink-0 text-brand-500" aria-hidden />
            </span>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Tên trang</label>
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Nhập tên trang"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mô tả</label>
            <TextArea
              value={createDescription}
              onChange={(value) => setCreateDescription(value)}
              rows={4}
              placeholder="Mô tả trang thông tin"
            />
          </div>
          <Switch
            label="Hiển thị trang trên Kênh của tôi"
            checked={createVisible}
            onChange={setCreateVisible}
          />
          <button
            type="button"
            disabled={creating}
            onClick={() => void handleCreatePage()}
            className="h-11 w-full rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {creating ? "Đang tạo…" : "Tạo trang"}
          </button>
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard
      title="Trang thông tin"
      desc="Quản lý trang và nội dung hiển thị trên kênh"
      hideDescOnMobile
    >
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {pageThumbnail ? (
              <img
                src={pageThumbnail}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <HiOutlineInformationCircle size={24} className="shrink-0 text-gray-400" aria-hidden />
              </span>
            )}
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="space-y-3">
                  <Input
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="Tên trang"
                  />
                  <TextArea
                    value={pageDescription}
                    onChange={(value) => setPageDescription(value)}
                    rows={3}
                    placeholder="Mô tả trang"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void handleSaveInfo()}
                      className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {saving ? "Đang lưu…" : "Lưu"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm dark:border-gray-700"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    {pageName || "Trang thông tin"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {pageDescription || "Chưa có mô tả"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="mt-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Chỉnh sửa
                  </button>
                </>
              )}
            </div>
          </div>
          <Switch
            label="Hiển thị trang"
            checked={pageVisible}
            onChange={(value) => void handleToggleVisibility(value)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
          Nội dung đang hiển thị
        </h4>
        <button
          type="button"
          onClick={addModal.openModal}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          <HiOutlinePlus size={16} className="shrink-0" aria-hidden />
          Thêm mới
        </button>
      </div>

      {products.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-500">
          Chưa có nội dung nào
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 dark:bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Liên kết</th>
                <th className="px-4 py-3">Ngày tạo</th>
                <th className="px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((product) => (
                <tr key={String(product.id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {product.thumbnails?.[0] ? (
                        <img
                          src={product.thumbnails[0]}
                          alt=""
                          className="h-9 w-9 rounded object-cover"
                        />
                      ) : null}
                      <span className="font-medium text-gray-800 dark:text-white/90">
                        {product.name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-brand-600">
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {product.link ?? "—"}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatZaloTimestamp(product.createdTime)}
                  </td>
                  <td className="px-4 py-3">
                    <Tooltip content="Xóa">
                      <button
                        type="button"
                        aria-label="Xóa"
                        onClick={() => void handleDeleteProduct(product)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-error-200 text-error-600 dark:border-error-500/30"
                      >
                        <HiOutlineTrash size={16} className="shrink-0" aria-hidden />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={addModal.isOpen}
        onClose={addModal.closeModal}
        className="max-w-lg m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Thêm nội dung
          </h3>
          <div className="mt-4 space-y-3">
            <Input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Tên sản phẩm / dịch vụ"
            />
            <Input
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              placeholder="Liên kết (URL)"
            />
            <Input
              value={productThumb}
              onChange={(e) => setProductThumb(e.target.value)}
              placeholder="Thumbnail JSON hoặc URL (tuỳ chọn)"
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={addModal.closeModal}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm dark:border-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={addingProduct}
              onClick={() => void handleAddProduct()}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {addingProduct ? "Đang thêm…" : "Thêm"}
            </button>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}