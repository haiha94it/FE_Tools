"use client";

import {
  useEffect,
  useRef,
  type CSSProperties,
  type ElementType,
  type ReactNode,
} from "react";

export type StoreRevealVariant =
  | "up"
  | "fade"
  | "scale"
  | "left"
  | "right"
  | "blur"
  | "zoom";

const VARIANT_CLASS: Record<StoreRevealVariant, string> = {
  up: "store-reveal",
  fade: "store-reveal-fade",
  scale: "store-reveal-scale",
  left: "store-reveal-left",
  right: "store-reveal-right",
  blur: "store-reveal-blur",
  zoom: "store-reveal-zoom",
};

export function storeDelayClass(index: number): string {
  const i = Math.min(Math.max(0, index), 11);
  return `store-delay-${i}`;
}

interface StoreRevealProps {
  children: ReactNode;
  className?: string;
  variant?: StoreRevealVariant;
  /** 0–11 stagger step */
  delay?: number;
  /** Root margin for earlier/later trigger */
  rootMargin?: string;
  as?: ElementType;
  style?: CSSProperties;
  /** Animate once on mount instead of scroll (still uses CSS classes) */
  immediate?: boolean;
}

/**
 * IntersectionObserver reveal — adds `.is-visible` when in viewport.
 * Respects prefers-reduced-motion via CSS.
 */
export default function StoreReveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  rootMargin = "0px 0px -8% 0px",
  as: Tag = "div",
  style,
  immediate = false,
}: StoreRevealProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (immediate) {
      el.classList.add("is-visible");
      return;
    }

    if (typeof window !== "undefined") {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (reduced) {
        el.classList.add("is-visible");
        return;
      }
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      },
      { threshold: 0.01, rootMargin: "200px 0px 200px 0px" },
    );
    io.observe(el);
    // Fallback: đảm bảo luôn hiện sau 150ms nếu Observer không trỏ kịp
    const timer = setTimeout(() => {
      if (el) el.classList.add("is-visible");
    }, 150);
    return () => {
      clearTimeout(timer);
      io.disconnect();
    };
  }, [immediate, rootMargin]);

  const classes = [
    VARIANT_CLASS[variant],
    storeDelayClass(delay),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref} className={classes} style={style}>
      {children}
    </Tag>
  );
}
