"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Select from "@/components/form/Select";
import { Modal } from "@/components/ui/modal";
import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import { useModal } from "@/hooks/useModal";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineSquares2X2,
  HiOutlineTag,
  HiOutlineTrash,
} from "react-icons/hi2";
import VideoCreatorInlineIcon from "./VideoCreatorInlineIcon";
import { confirm } from "@/lib/confirm";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import {
  CONTACT_LABEL_OPTIONS,
  getContactLabelText,
} from "@/lib/zalo-video/category-labels";
import {
  addVideoLabel,
  fetchCategoryVideos,
  fetchStoreProducts,
  fetchVideosForLabelPicker,
  removeVideoLabel,
} from "@/lib/zalo-video/creator-public-api";
import { refreshCsrfToken } from "@/lib/zalo-video/session";
import type { ZaloCategoryVideoItem, ZaloStoreProductItem } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";

interface CategoryLabelPanelProps {
  accountId: number;
}

export default function CategoryLabelPanel({ accountId }: CategoryLabelPanelProps) {
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState<ZaloCategoryVideoItem[]>([]);
  const [pickerVideos, setPickerVideos] = useState<ZaloCategoryVideoItem[]>([]);
  const [storeProducts, setStoreProducts] = useState<ZaloStoreProductItem[]>([]);

  const pickModal = useModal();
  const labelModal = useModal();
  const [selectedVideoId, setSelectedVideoId] = useState<string | number | null>(
    null,
  );
  const [labelType, setLabelType] = useState<"contact" | "store">("contact");
  const [contactLabelId, setContactLabelId] = useState(String(CONTACT_LABEL_OPTIONS[0].id));
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const contactOptions = CONTACT_LABEL_OPTIONS.map((item) => ({
    value: String(item.id),
    label: item.label,
  }));

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCategoryVideos(accountId);
      setVideos(data);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void refreshCsrfToken(accountId);
    void loadVideos();
  }, [accountId, loadVideos]);

  const openPickModal = async () => {
    try {
      const data = await fetchVideosForLabelPicker(accountId);
      setPickerVideos(data);
      pickModal.openModal();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const openLabelModal = async (
    videoId: string | number,
    type: "contact" | "store",
  ) => {
    setSelectedVideoId(videoId);
    setLabelType(type);
    setContactLabelId(String(CONTACT_LABEL_OPTIONS[0].id));
    setSelectedStoreIds([]);
    if (type === "store") {
      try {
        const products = await fetchStoreProducts(accountId, 0);
        setStoreProducts(products);
      } catch {
        setStoreProducts([]);
      }
    }
    labelModal.openModal();
  };

  const handleAddLabel = async () => {
    if (!selectedVideoId) return;
    setSubmitting(true);
    try {
      if (labelType === "contact") {
        await addVideoLabel({
          accountId,
          videoId: selectedVideoId,
          customText: contactLabelId,
          type: "contact-label-cta",
        });
      } else {
        if (selectedStoreIds.length === 0) {
          toast.error("Chọn ít nhất một mục trang thông tin");
          return;
        }
        await addVideoLabel({
          accountId,
          videoId: selectedVideoId,
          customText: selectedStoreIds.join(","),
          type: "store-label-cta",
        });
      }
      toast.success("Đã gán nhãn");
      labelModal.closeModal();
      await loadVideos();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveLabel = async (
    video: ZaloCategoryVideoItem,
    ctaType?: string,
  ) => {
    try {
      await removeVideoLabel({
        accountId,
        videoId: video.id,
        ctaType,
        type: "delete-label-cta",
      });
      toast.success("Đã xóa nhãn");
      await loadVideos();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleRemoveVideo = async (video: ZaloCategoryVideoItem) => {
    if (
      !(await confirm({
        title: "Xóa video",
        message: "Xóa video khỏi danh sách gán nhãn?",
        confirmText: "Xóa",
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await removeVideoLabel({
        accountId,
        videoId: video.id,
        type: "delete-cta-video",
      });
      toast.success("Đã xóa");
      await loadVideos();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handlePickVideo = async (videoId: string | number) => {
    pickModal.closeModal();
    await openLabelModal(videoId, "contact");
  };

  return (
    <ComponentCard
      title="Gán nhãn video"
      desc="Gắn nhãn liên hệ hoặc trang thông tin lên video"
      hideDescOnMobile
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadVideos()}
          className="h-11 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300"
        >
          {loading ? "Đang tải…" : "↻ Tải lại"}
        </button>
        <button
          type="button"
          onClick={() => void openPickModal()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600"
        >
          <VideoCreatorInlineIcon icon={HiOutlinePlus} />
          Chọn video
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <p className="py-20 text-center text-sm text-gray-500">Đang tải…</p>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <HiOutlineTag size={32} className="shrink-0 text-gray-300" aria-hidden />
          <p className="text-sm text-gray-500">Chưa có video nào được gán nhãn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <article
              key={String(video.id)}
              className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start dark:border-gray-800 dark:bg-white/[0.02]"
            >
              <div className="relative h-[120px] w-[90px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <HiOutlineSquares2X2 size={20} className="shrink-0 text-gray-300" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-white/90">
                  {video.description?.split("\n")[0]?.trim() || "Video"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {video.labelCtas?.map((cta, index) => (
                    <div
                      key={`${video.id}-${index}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-white/[0.03]"
                    >
                      {cta.products?.length ? (
                        <span className="text-gray-700 dark:text-gray-300">
                          Trang thông tin ({cta.products.length})
                        </span>
                      ) : (
                        <span className="text-brand-600 dark:text-brand-400">
                          {getContactLabelText(cta.customText)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void handleRemoveLabel(video, cta.ctaType)
                        }
                        className="text-error-500 hover:text-error-600"
                        aria-label="Xóa nhãn"
                      >
                        <VideoCreatorInlineIcon icon={HiOutlineTrash} size="sm" />
                      </button>
                    </div>
                  ))}
                  {(video.labelCtas?.length ?? 0) < 2 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void openLabelModal(video.id, "contact")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        <HiOutlineChatBubbleLeftRight
                          size={14}
                          className="shrink-0 text-brand-500 dark:text-brand-400"
                          aria-hidden
                        />
                        Thêm liên hệ
                      </button>
                      <button
                        type="button"
                        onClick={() => void openLabelModal(video.id, "store")}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                      >
                        <HiOutlineDocumentText
                          size={14}
                          className="shrink-0 text-brand-500 dark:text-brand-400"
                          aria-hidden
                        />
                        Thêm trang TT
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Tooltip content="Xóa khỏi danh sách">
                <button
                  type="button"
                  aria-label="Xóa khỏi danh sách"
                  onClick={() => void handleRemoveVideo(video)}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-error-200 px-3 text-xs font-medium text-error-600 dark:border-error-500/30"
                >
                  <VideoCreatorInlineIcon icon={HiOutlineTrash} />
                </button>
              </Tooltip>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={pickModal.isOpen}
        onClose={pickModal.closeModal}
        className="max-w-2xl m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Chọn video để gán nhãn
          </h3>
          <div className="custom-scrollbar mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
            {pickerVideos.map((video) => (
              <button
                key={String(video.id)}
                type="button"
                onClick={() => void handlePickVideo(video.id)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03]"
              >
                {video.thumbnail ? (
                  <img
                    src={video.thumbnail}
                    alt=""
                    className="h-14 w-10 rounded object-cover"
                  />
                ) : null}
                <span className="line-clamp-2 text-sm text-gray-700 dark:text-gray-300">
                  {video.description?.trim() || "Video"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={labelModal.isOpen}
        onClose={labelModal.closeModal}
        className="max-w-lg m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {labelType === "contact" ? "Nhãn liên hệ" : "Nhãn trang thông tin"}
          </h3>
          {labelType === "contact" ? (
            <div className="mt-4">
              <Select
                options={contactOptions}
                value={contactLabelId}
                onChange={setContactLabelId}
              />
            </div>
          ) : (
            <div className="custom-scrollbar mt-4 max-h-[40vh] space-y-2 overflow-y-auto">
              {storeProducts.map((product) => {
                const id = String(product.id);
                const checked = selectedStoreIds.includes(id);
                return (
                  <label
                    key={id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-700"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setSelectedStoreIds((prev) =>
                          checked
                            ? prev.filter((item) => item !== id)
                            : [...prev, id],
                        );
                      }}
                      className="size-4 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {product.name ?? "Sản phẩm"}
                    </span>
                  </label>
                );
              })}
              {storeProducts.length === 0 && (
                <p className="text-sm text-gray-500">
                  Chưa có nội dung trang thông tin. Tạo tại mục Trang thông tin trước.
                </p>
              )}
            </div>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={labelModal.closeModal}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm dark:border-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleAddLabel()}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Đang gán…" : "Gán nhãn"}
            </button>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}