"use client";

import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import type { ZaloProxyItem } from "@/types/zalo-proxy";
import { useCallback } from "react";

interface ZaloProxyFormModalProps {
  isOpen: boolean;
  editingProxy: ZaloProxyItem | null;
  proxyInput: string;
  noteInput: string;
  expirationInput: string;
  isSaving: boolean;
  onProxyInputChange: (value: string) => void;
  onNoteInputChange: (value: string) => void;
  onExpirationInputChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ZaloProxyFormModal({
  isOpen,
  editingProxy,
  proxyInput,
  noteInput,
  expirationInput,
  isSaving,
  onProxyInputChange,
  onNoteInputChange,
  onExpirationInputChange,
  onClose,
  onSave,
}: ZaloProxyFormModalProps) {
  const isEdit = Boolean(editingProxy);
  const handleExpirationChange = useCallback(
    (_: Date[], dateString: string) => onExpirationInputChange(dateString),
    [onExpirationInputChange],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[720px] p-5 lg:p-10"
      showCloseButton={!isSaving}
    >
      <h4 className="mb-2 text-lg font-medium text-gray-800 dark:text-white/90">
        {isEdit ? "Chỉnh sửa proxy" : "Thêm Proxy"}
      </h4>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {isEdit
          ? "Cập nhật proxy, hạn dùng và ghi chú rồi bấm Lưu."
          : "Mỗi dòng một proxy. Có thể nhập nhiều proxy cùng lúc."}
      </p>

      <div className="space-y-5">
        <div>
          <Label>
            Proxy <span className="text-error-500">*</span>
          </Label>
          {isEdit ? (
            <Input
              type="text"
              value={proxyInput}
              onChange={(e) => onProxyInputChange(e.target.value)}
              placeholder="host:port hoặc host:port:user:pass"
              disabled={isSaving}
            />
          ) : (
            <TextArea
              rows={6}
              value={proxyInput}
              onChange={onProxyInputChange}
              placeholder="123.123.123.123:8000:user:pass"
              disabled={isSaving}
              className="font-mono text-xs"
            />
          )}
        </div>

        <div>
          <Label>Ghi chú</Label>
          <Input
            type="text"
            value={noteInput}
            onChange={(e) => onNoteInputChange(e.target.value)}
            placeholder="Nhập ghi chú..."
            disabled={isSaving}
          />
        </div>

        <div>
          <DatePicker
            id="zalo-proxy-expiration"
            label="Ngày hết hạn"
            placeholder="Chọn ngày hết hạn"
            defaultDate={expirationInput || undefined}
            onChange={handleExpirationChange}
            disabled={isSaving}
            allowInput={false}
          />
        </div>
      </div>

      <div className="mt-6 flex w-full items-center justify-end gap-3">
        <Button size="sm" variant="outline" onClick={onClose} disabled={isSaving}>
          Hủy
        </Button>
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          {isSaving ? "Đang lưu..." : "Lưu dữ liệu"}
        </Button>
      </div>
    </Modal>
  );
}
