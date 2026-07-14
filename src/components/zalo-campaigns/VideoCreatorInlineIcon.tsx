import type { IconType } from "react-icons";

interface VideoCreatorInlineIconProps {
  icon: IconType;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX = {
  sm: 14,
  md: 16,
  lg: 20,
} as const;

/** Icon inline trong button/chip — react-icons/hi2, không méo khi scale nhỏ */
export default function VideoCreatorInlineIcon({
  icon: Icon,
  size = "md",
  className = "",
}: VideoCreatorInlineIconProps) {
  const px = SIZE_PX[size];

  return (
    <Icon
      aria-hidden
      size={px}
      className={`shrink-0 ${className}`.trim()}
      style={{ width: px, height: px, minWidth: px, minHeight: px }}
    />
  );
}