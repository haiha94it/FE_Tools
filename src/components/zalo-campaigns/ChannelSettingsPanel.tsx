"use client";

import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import Switch from "@/components/form/switch/Switch";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  HiOutlineInformationCircle,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { validatePhoneVN } from "@/const/getLinkFile";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { zaloVideoService } from "@/services/zalo-video.service";
import { useZaloVideoStore } from "@/stores/use-zalo-video-store";
import type { ZaloChannelInfo } from "@/types/zalo-video";
import { useCallback, useEffect, useState } from "react";

interface ChannelSettingsPanelProps {
  accountId: number;
  channelInfo: ZaloChannelInfo;
}

export default function ChannelSettingsPanel({
  accountId,
  channelInfo,
}: ChannelSettingsPanelProps) {
  const activateAccount = useZaloVideoStore((s) => s.activateAccount);
  const [phoneLoading, setPhoneLoading] = useState(true);
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addPhoneModal = useModal();
  const deleteModal = useModal();

  const loadPhoneStatus = useCallback(async () => {
    setPhoneLoading(true);
    try {
      const status = await zaloVideoService.fetchPhoneStatus(accountId);
      setPhoneEnabled(status);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
      setPhoneEnabled(false);
    } finally {
      setPhoneLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    void loadPhoneStatus();
  }, [loadPhoneStatus]);

  const handlePhoneToggle = (enabled: boolean) => {
    if (enabled) {
      setPhoneInput("");
      setPhoneError("");
      addPhoneModal.openModal();
      return;
    }
    if (channelInfo.display_name) {
      deleteModal.openModal();
    }
  };

  const handleAddPhone = async () => {
    if (!validatePhoneVN(phoneInput)) {
      setPhoneError("Số điện thoại không hợp lệ");
      return;
    }
    setSubmitting(true);
    try {
      await zaloVideoService.addPhoneContact(accountId, phoneInput);
      toast.success("Đã gửi yêu cầu liên kết Zalo");
      addPhoneModal.closeModal();
      setPhoneEnabled(true);
      await activateAccount(accountId, { force: true });
      await loadPhoneStatus();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnlinkPhone = async () => {
    setSubmitting(true);
    try {
      await zaloVideoService.deletePhoneContact(accountId);
      toast.success("Đã hủy liên kết Zalo");
      deleteModal.closeModal();
      setPhoneEnabled(false);
      await activateAccount(accountId, { force: true });
      await loadPhoneStatus();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ComponentCard
      title="Thông tin kênh"
      desc="Xem thông tin và cài đặt liên hệ trên kênh Zalo Video"
      hideDescOnMobile
    >
      <div className="space-y-5">
        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5">
          <h4 className="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">
            Thông tin kênh
          </h4>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex shrink-0 justify-center sm:justify-start">
              {channelInfo.avatar ? (
                <img
                  src={channelInfo.avatar}
                  alt=""
                  className="h-20 w-20 rounded-2xl object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
                  <HiOutlineUserCircle size={32} className="shrink-0 text-gray-400" aria-hidden />
                </span>
              )}
            </div>
            <dl className="grid flex-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Tên kênh</dt>
                <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                  {channelInfo.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">ID kênh</dt>
                <dd className="mt-0.5 font-medium text-gray-800 dark:text-white/90">
                  {channelInfo.channel_id ?? "Chưa có ID kênh"}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-gray-500 dark:text-gray-400">Giới thiệu</dt>
                <dd className="mt-0.5 text-gray-700 dark:text-gray-300">
                  {channelInfo.bio ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Video</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-gray-800 dark:text-white/90">
                  {channelInfo.videos?.toLocaleString("vi-VN") ?? "0"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500 dark:text-gray-400">Người theo dõi</dt>
                <dd className="mt-0.5 font-medium tabular-nums text-gray-800 dark:text-white/90">
                  {channelInfo.followers?.toLocaleString("vi-VN") ?? "0"}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02] sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                Nút liên hệ qua Zalo
              </h4>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Hiển thị nút Liên hệ trên trang Kênh của tôi và trong bình luận
                video.
              </p>
            </div>
            {phoneLoading ? (
              <span className="text-sm text-gray-500">Đang tải…</span>
            ) : (
              <Switch
                checked={phoneEnabled || Boolean(channelInfo.display_name)}
                onChange={handlePhoneToggle}
              />
            )}
          </div>

          {channelInfo.display_name && (
            <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/50 p-3 dark:border-brand-500/20 dark:bg-brand-500/5">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <HiOutlineInformationCircle size={16} className="mr-1 inline shrink-0 text-brand-500" aria-hidden />
                Tài khoản Zalo liên hệ:{" "}
                <span className="font-medium">{channelInfo.display_name}</span>
              </p>
              <button
                type="button"
                onClick={() => deleteModal.openModal()}
                className="mt-2 text-sm font-medium text-error-600 hover:underline dark:text-error-400"
              >
                Hủy liên kết
              </button>
            </div>
          )}
        </section>
      </div>

      <Modal
        isOpen={addPhoneModal.isOpen}
        onClose={addPhoneModal.closeModal}
        className="max-w-md m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Liên kết số Zalo
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Nhập số điện thoại Zalo để hiển thị nút liên hệ trên kênh.
          </p>
          <div className="mt-4">
            <Input
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value);
                setPhoneError("");
              }}
              placeholder="0xxx xxx xxx"
            />
            {phoneError && (
              <p className="mt-1 text-xs text-error-500">{phoneError}</p>
            )}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={addPhoneModal.closeModal}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm dark:border-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleAddPhone()}
              className="h-10 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Đang gửi…" : "Xác nhận"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.closeModal}
        className="max-w-md m-4"
      >
        <div className="p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Hủy liên kết Zalo
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Bạn có chắc muốn hủy liên kết nút liên hệ Zalo trên kênh?
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={deleteModal.closeModal}
              className="h-10 rounded-lg border border-gray-200 px-4 text-sm dark:border-gray-700"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleUnlinkPhone()}
              className="h-10 rounded-lg bg-error-500 px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {submitting ? "Đang xử lý…" : "Xác nhận"}
            </button>
          </div>
        </div>
      </Modal>
    </ComponentCard>
  );
}