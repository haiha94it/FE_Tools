"use client";

import { Tooltip } from "@/components/ui/tooltip/Tooltip";
import type { ReactNode } from "react";

interface AdminIconButtonProps {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  children: ReactNode;
}

/**
 * Nút icon có Tooltip — bọc span khi disabled để Radix vẫn hiện chú thích.
 */
export default function AdminIconButton({
  label,
  onClick,
  disabled = false,
  className = "",
  side = "top",
  children,
}: AdminIconButtonProps) {
  const button = (
    <button
      type="button"
      className={`cursor-pointer ${className}`}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );

  return (
    <Tooltip content={label} side={side}>
      {disabled ? <span className="inline-flex">{button}</span> : button}
    </Tooltip>
  );
}