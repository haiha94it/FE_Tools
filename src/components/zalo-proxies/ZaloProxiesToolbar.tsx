"use client";

import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";

interface ZaloProxiesToolbarProps {
  search: string;
  selectedCount: number;
  isChecking: boolean;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onCheck: () => void;
  onDelete: () => void;
  onBuy?: () => void;
}

export default function ZaloProxiesToolbar({
  search,
  selectedCount,
  isChecking,
  onSearchChange,
  onAdd,
  onCheck,
  onDelete,
  onBuy,
}: ZaloProxiesToolbarProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      <div className="order-1 w-full sm:order-none sm:min-w-[180px] sm:max-w-[260px] sm:flex-1">
        <Input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm proxy, ghi chú, trạng thái..."
        />
      </div>

      <MobileToolbarStrip>
        <Button size="sm" className={mobileToolbarButtonClass} onClick={onAdd}>
          Thêm Proxy
        </Button>

        {onBuy && (
          <Button
            size="sm"
            variant="outline"
            className={mobileToolbarButtonClass}
            onClick={onBuy}
          >
            Mua Proxy
          </Button>
        )}

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
              <span className="hidden sm:inline">Kiểm tra Proxy</span>
            </>
          )}
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