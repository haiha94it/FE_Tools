"use client";

import { APP_NAME } from "@/constants/brand";
import {
  FALLBACK_BRAND_ICON,
  FALLBACK_BRAND_LOGO,
  fetchBrandLogoUrl,
  subscribeBrandLogoUpdated,
} from "@/lib/brand-logo";
import {
  forwardRef,
  useEffect,
  useState,
  type ImgHTMLAttributes,
} from "react";

type BrandLogoVariant = "banner" | "icon";

interface BrandLogoProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  /** banner = logo full; icon = favicon thu gọn sidebar */
  variant?: BrandLogoVariant;
  alt?: string;
}

/**
 * Logo hệ thống từ API popup/logo — fallback file tĩnh nếu chưa set / lỗi mạng.
 * Kích thước do caller truyền (width/height + className); mặc định h-10 w-auto.
 */
const BrandLogo = forwardRef<HTMLImageElement, BrandLogoProps>(
  function BrandLogo(
    {
      variant = "banner",
      alt = APP_NAME,
      className,
      width,
      height,
      ...rest
    },
    ref,
  ) {
    const fallback =
      variant === "icon" ? FALLBACK_BRAND_ICON : FALLBACK_BRAND_LOGO;
    const [src, setSrc] = useState(fallback);

    useEffect(() => {
      // Icon thu gọn sidebar: giữ favicon tĩnh (logo API thường banner ngang)
      if (variant === "icon") {
        setSrc(FALLBACK_BRAND_ICON);
        return;
      }

      let cancelled = false;
      const load = (force = false) => {
        void fetchBrandLogoUrl({ force }).then((url) => {
          if (!cancelled) setSrc(url);
        });
      };

      load(false);
      const unsub = subscribeBrandLogoUpdated(() => load(true));
      return () => {
        cancelled = true;
        unsub();
      };
    }, [variant]);

    return (
      // eslint-disable-next-line @next/next/no-img-element -- URL media BE động, không optimize next/image
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width ?? (variant === "banner" ? 150 : 32)}
        height={height ?? (variant === "banner" ? 40 : 32)}
        className={
          className ??
          (variant === "banner"
            ? "h-10 w-auto object-contain"
            : "h-8 w-8 object-contain")
        }
        {...rest}
      />
    );
  },
);

export default BrandLogo;
