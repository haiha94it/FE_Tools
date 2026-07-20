"use client";

import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { Modal } from "@/components/ui/modal";
import {
  buildSaveAlbumPayloadFromMessage,
  buildSaveVideoPayloadFromMessage,
} from "@/lib/message-media-from-chat";
import { getApiErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { messageMediaService } from "@/services/message-media.service";
import type { DisplayMessage } from "@/types/zalo-messenger";
import { memo, useEffect, useState } from "react";

export type SaveMediaKind = "video" | "album";

interface SaveMediaFromChatDialogProps {
  open: boolean;
  kind: SaveMediaKind;
  message: DisplayMessage | null;
  onClose: () => void;
  onSaved?: () => void;
}

function SaveMediaFromChatDialog({
  open,
  kind,
  message,
  onClose,
  onSaved,
}: SaveMediaFromChatDialogProps) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
  }, [open, kind, message?.msgId]);

  const handleSave = async () => {
    if (!message) return;
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(kind === "video" ? "Nhập tên video." : "Nhập tên album.");
      return;
    }

    setSaving(true);
    try {
      if (kind === "video") {
        const payload = buildSaveVideoPayloadFromMessage(message, trimmed);
        if (!payload) {
          toast.error("Không lấy được metadata video từ tin nhắn.");
          return;
        }
        await messageMediaService.saveVideo(payload);
        toast.success("Video đã được lưu thành công");
      } else {
        const payload = buildSaveAlbumPayloadFromMessage(message, trimmed);
        if (!payload) {
          toast.error("Không lấy được metadata album từ tin nhắn.");
          return;
        }
        await messageMediaService.saveAlbum(payload);
        toast.success("Album đã được lưu thành công (đang đồng bộ ảnh…)");
        // Optional: list albums after delay — caller can refresh
      }
      onSaved?.();
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={() => !saving && onClose()}
      showCloseButton={!saving}
      className="w-full max-w-md"
      layer="top"
    >
      <div className="p-5 sm:p-6">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">
          {kind === "video" ? "Lưu video vào thư viện" : "Lưu album vào thư viện"}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Media thuộc tài khoản đăng nhập — dùng lại khi setup chiến dịch gửi tin.
        </p>
        <div className="mt-4">
          <Label htmlFor="save-media-name">
            {kind === "video" ? "Tên video" : "Tên album"}
          </Label>
          <Input
            id="save-media-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === "video" ? "QC tháng 7" : "Album sản phẩm"}
            disabled={saving}
            autoComplete="off"
          />
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={onClose}
          >
            Hủy
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || !name.trim()}
            onClick={() => void handleSave()}
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default memo(SaveMediaFromChatDialog);
