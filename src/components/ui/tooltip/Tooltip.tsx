"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import React from "react";

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

export function TooltipProvider({
  children,
  delayDuration = 300,
}: TooltipProviderProps) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      {children}
    </TooltipPrimitive.Provider>
  );
}

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  disabled?: boolean;
  /**
   * Mặc định true: Radix có thể lật side khi sát mép viewport.
   * false: luôn giữ `side` (vd. luôn top dù gần đáy card).
   */
  avoidCollisions?: boolean;
}

/**
 * Tooltip chuẩn dự án — dùng cho button/icon/chú thích.
 * Không dùng thuộc tính HTML `title` cho UI hint.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  disabled = false,
  avoidCollisions = true,
}: TooltipProps) {
  if (disabled || !content) {
    return children;
  }

  return (
    <TooltipPrimitive.Root delayDuration={150}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={8}
          avoidCollisions={avoidCollisions}
          className="z-[100010] max-w-xs rounded-lg bg-gray-900 px-3 py-1.5 text-xs leading-5 text-white shadow-theme-sm dark:bg-gray-700"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-gray-900 dark:fill-gray-700" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}