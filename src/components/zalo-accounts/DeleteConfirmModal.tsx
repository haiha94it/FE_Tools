"use client";

import Button from "@/components/ui/button/Button";
import Alert from "@/components/ui/alert/Alert";
import { Modal } from "@/components/ui/modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  count: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  count,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
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
        message={`Bạn sắp xóa ${count} tài khoản. Khi xóa tài khoản khỏi hệ thống, tất cả chiến dịch, kịch bản, nhãn khách hàng và dữ liệu liên quan sẽ bị mất.`}
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
          {isDeleting ? "Đang xóa..." : "Xóa tài khoản"}
        </Button>
      </div>
    </Modal>
  );
}