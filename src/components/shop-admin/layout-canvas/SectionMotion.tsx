/**
 * SectionMotion — scroll-reveal / mount animation cho khối layout canvas.
 * Dùng chung builder preview + storefront CustomCanvasLayout.
 */

"use client";

import "@/components/storefront/store-theme.css";
import StoreReveal, {
  storeDelayClass,
  type StoreRevealVariant,
} from "@/components/storefront/StoreReveal";
import type { LayoutAnimationPreset } from "@/types/shop-layout-canvas";
import type { ReactNode } from "react";

const ANIM_TO_VARIANT: Record<
  Exclude<LayoutAnimationPreset, "none">,
  StoreRevealVariant
> = {
  "fade-up": "up",
  fade: "fade",
  scale: "scale",
  "slide-left": "left",
  "slide-right": "right",
  "blur-in": "blur",
  "zoom-soft": "zoom",
};

export function resolveSectionAnimation(
  animation: LayoutAnimationPreset | undefined,
): LayoutAnimationPreset {
  return animation ?? "fade-up";
}

interface SectionMotionProps {
  animation?: LayoutAnimationPreset;
  /** Stagger index 0–11 */
  delay?: number;
  /** Animate on mount (builder) thay vì chờ scroll */
  immediate?: boolean;
  className?: string;
  children: ReactNode;
  /** Tắt hẳn motion (vd. reduced preference handled inside StoreReveal CSS) */
  disabled?: boolean;
}

export default function SectionMotion({
  animation,
  delay = 0,
  immediate = false,
  className = "",
  children,
  disabled = false,
}: SectionMotionProps) {
  const preset = resolveSectionAnimation(animation);

  if (disabled || preset === "none") {
    return <div className={className || undefined}>{children}</div>;
  }

  const variant = ANIM_TO_VARIANT[preset];

  return (
    <StoreReveal
      variant={variant}
      delay={delay}
      immediate={immediate}
      className={className}
      rootMargin="0px 0px -6% 0px"
    >
      {children}
    </StoreReveal>
  );
}

/** Class stagger cho con trong grid (feature / stats / gallery) */
export function staggerChildClass(index: number): string {
  return `canvas-stagger-item store-card-enter ${storeDelayClass(index)}`;
}
