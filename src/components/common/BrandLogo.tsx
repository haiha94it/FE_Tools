"use client";

import { APP_NAME } from "@/constants/brand";
import { forwardRef, type ImgHTMLAttributes } from "react";

interface BrandLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  variant?: "banner" | "icon";
  /** Alias compact sidebar */
  compact?: boolean;
  alt?: string;
}

const BrandLogo = forwardRef<HTMLImageElement, BrandLogoProps>(
  function BrandLogo(
    { variant = "banner", compact, alt = APP_NAME, className, ...rest },
    ref,
  ) {
    const mode = compact ? "icon" : variant;
    return (
      <span
        ref={ref as never}
        aria-label={alt}
        className={
          className ??
          (mode === "icon"
            ? "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white"
            : "inline-flex h-8 items-center text-lg font-semibold text-brand-600 dark:text-brand-400")
        }
        {...(rest as object)}
      >
        {mode === "icon" ? "CN" : APP_NAME}
      </span>
    );
  },
);

export default BrandLogo;
