"use client";

import Button from "@/components/ui/button/Button";
import MobileToolbarStrip, {
  mobileToolbarButtonClass,
} from "@/components/ui/toolbar/MobileToolbarStrip";
import type { GroupModal } from "@/types/zalo-contacts";

interface GroupsToolbarProps {
  activeView: NonNullable<GroupModal>;
  disabled?: boolean;
  onSelect: (view: NonNullable<GroupModal>) => void;
}

const views: {
  id: NonNullable<GroupModal>;
  label: string;
  shortLabel: string;
}[] = [
  { id: "scan", label: "Quét danh sách nhóm", shortLabel: "Quét DS" },
  { id: "label", label: "Gán nhãn", shortLabel: "Gán nhãn" },
  { id: "get-link", label: "Lấy link nhóm", shortLabel: "Lấy link" },
];

export default function GroupsToolbar({
  activeView,
  disabled,
  onSelect,
}: GroupsToolbarProps) {
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