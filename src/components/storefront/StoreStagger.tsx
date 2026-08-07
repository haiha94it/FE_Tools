"use client";

import StoreReveal, {
  storeDelayClass,
  type StoreRevealVariant,
} from "@/components/storefront/StoreReveal";
import type { ReactNode } from "react";

interface StoreStaggerProps {
  children: ReactNode[];
  className?: string;
  itemClassName?: string;
  variant?: StoreRevealVariant;
  /** Max stagger steps (capped at 11) */
  maxDelay?: number;
}

/**
 * Wraps each child in StoreReveal with incremental delay.
 */
export default function StoreStagger({
  children,
  className = "",
  itemClassName = "",
  variant = "up",
  maxDelay = 11,
}: StoreStaggerProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <StoreReveal
          key={index}
          variant={variant}
          delay={Math.min(index, maxDelay)}
          className={itemClassName}
        >
          {child}
        </StoreReveal>
      ))}
    </div>
  );
}

/** Mount animation class for list items (no IO) */
export function storeCardEnterClass(index: number): string {
  return `store-card-enter ${storeDelayClass(Math.min(index, 11))}`;
}
