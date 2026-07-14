"use client";

import Switch from "@/components/form/switch/Switch";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";
import { useMediaQuery } from "@/hooks/use-media-query";

interface ZaloAccountsToolbarProps {
  search: string;
  showSensitiveInfo: boolean;
  isTotalMessagesOn: boolean;
  isLoadingToggleAllMessage: boolean;
  isChecking: boolean;
  selectedCount: number;
  onSearchChange: (value: string) => void;
  onToggleSensitive: (checked: boolean) => void;
  onToggleAllMessages: (checked: boolean) => void;
  onAdd: () => void;
  onCheck: () => void;
  onManageContacts: () => void;
  onManageProxy: () => void;
  onDelete: () => void;
}

export default function ZaloAccountsToolbar({
  search,
  showSensitiveInfo,
  isTotalMessagesOn,
  isLoadingToggleAllMessage,
  isChecking,
  selectedCount,
  onSearchChange,
  onToggleSensitive,
  onToggleAllMessages,
  onAdd,
  onCheck,
  onManageContacts,
  onManageProxy,
  onDelete,
}: ZaloAccountsToolbarProps) {
  const isMobile = useMediaQuery("(max-width: 639px)");

  const sensitiveLabel = isMobile
    ? showSensitiveInfo
      ? "Ẩn SĐT"
      : "Hiện SĐT"
    : showSensitiveInfo
      ? "Ẩn thông tin"
      : "Hiện thông tin";

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <div className="order-1 w-full sm:order-none sm:min-w-[150px] sm:max-w-[200px] sm:flex-1">
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm kiếm nhanh"
        />
      </div>

      <MobileToolbarStrip>
        <div className="shrink-0 max-sm:[&_label]:gap-2 max-sm:[&_label]:text-xs">
          <Switch
            label={sensitiveLabel}
            checked={showSensitiveInfo}
            onChange={onToggleSensitive}
          />
        </div>

        <div className="shrink-0 max-sm:[&_label]:gap-2 max-sm:[&_label]:text-xs">
          <Switch
            label={isMobile ? "Tin nhắn" : "Tin nhắn tổng"}
            checked={isTotalMessagesOn}
            disabled={isLoadingToggleAllMessage}
            onChange={onToggleAllMessages}
          />
        </div>

        <Button
          size="sm"
          className={mobileToolbarButtonClass}
          onClick={onAdd}
        >
          <span className="sm:hidden">Thêm</span>
          <span className="hidden sm:inline">Thêm tài khoản</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className={mobileToolbarButtonClass}
          onClick={onCheck}
          disabled={isChecking || selectedCount === 0}
        >
          {isChecking ? "Đang KT..." : (
            <>
              <span className="sm:hidden">Kiểm tra</span>
              <span className="hidden sm:inline">Kiểm tra tài khoản</span>
            </>
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className={mobileToolbarButtonClass}
          onClick={onManageContacts}
        >
          <span className="sm:hidden">Bạn bè</span>
          <span className="hidden sm:inline">Quản lý Bạn bè / Nhóm</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          className={mobileToolbarButtonClass}
          onClick={onManageProxy}
        >
          Proxy
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onDelete}
          disabled={selectedCount === 0}
          className={`${mobileToolbarButtonClass} !text-error-600 !ring-error-200 hover:!bg-error-50 dark:hover:!bg-error-500/10`}
        >
          Xóa
        </Button>
      </MobileToolbarStrip>
    </div>
  );
}