"use client";

import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";

interface ZaloProxyDeleteModalProps {
  isOpen: boolean;
  count: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ZaloProxyDeleteModal({
  isOpen,
  count,
  isDeleting,
  onClose,
  onConfirm,
}: ZaloProxyDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[584px] p-5 lg:p-10"
    >
      <h4 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
        Xác nhận xóa
      </h4>

      <Alert
        variant="warning"
        title="Cảnh báo"
        message={`Bạn sắp xóa ${count} proxy. Khi xóa proxy khỏi hệ thống, các tài khoản đang dùng proxy này có thể bị ảnh hưởng.`}
      />

      <div className="mt-6 flex w-full items-center justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose} disabled={isDeleting}>
          Hủy
        </Button>
        <Button
          size="sm"
          onClick={onConfirm}
          disabled={isDeleting}
          className="!bg-error-500 hover:!bg-error-600"
        >
          {isDeleting ? "Đang xóa..." : "Xóa proxy"}
        </Button>
      </div>
    </Modal>
  );
}