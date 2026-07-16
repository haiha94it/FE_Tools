import { getAvatarColorClass, getAvatarInitials } from "@/lib/avatar-utils";
import React from "react";

export type AvatarTextSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AvatarTextProps {
  name: string;
  size?: AvatarTextSize;
  className?: string;
}

const sizeClasses: Record<AvatarTextSize, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
};

const AvatarText: React.FC<AvatarTextProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  const initials = getAvatarInitials(name);
  const colorClass = getAvatarColorClass(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClasses[size]} ${colorClass} ${className}`.trim()}
      aria-hidden
    >
      <span>{initials}</span>
    </div>
  );
};

export default AvatarText;