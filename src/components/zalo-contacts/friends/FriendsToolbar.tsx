"use client";

import Button from "@/components/ui/button/Button";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";
import type { FriendModal } from "@/types/zalo-contacts";

interface FriendsToolbarProps {
  activeView: NonNullable<FriendModal>;
  disabled?: boolean;
  onSelect: (view: NonNullable<FriendModal>) => void;
}

const views: {
  id: NonNullable<FriendModal>;
  label: string;
  shortLabel: string;
}[] = [
  { id: "scan", label: "Quét danh sách bạn bè", shortLabel: "Quét DS" },
  { id: "label", label: "Gán nhãn", shortLabel: "Gán nhãn" },
  { id: "recommend", label: "Gợi ý kết bạn", shortLabel: "Gợi ý KB" },
  { id: "sent-requests", label: "Lời mời kết bạn đã gửi", shortLabel: "Lời mời" },
];

export default function FriendsToolbar({
  activeView,
  disabled,
  onSelect,
}: FriendsToolbarProps) {
  return (
    <MobileToolbarStrip>
      {views.map((view) => (
        <Button
          key={view.id}
          size="sm"
          variant={activeView === view.id ? "primary" : "outline"}
          disabled={disabled}
          className={mobileToolbarButtonClass}
          onClick={() => onSelect(view.id)}
        >
          <span className="sm:hidden">{view.shortLabel}</span>
          <span className="hidden sm:inline">{view.label}</span>
        </Button>
      ))}
    </MobileToolbarStrip>
  );
}