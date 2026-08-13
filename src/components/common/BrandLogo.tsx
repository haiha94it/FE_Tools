import { APP_NAME } from "@/constants/brand";
import Image, { type ImageProps } from "next/image";

const BRAND_WORDMARK = "/images/brand/cong-cu-nghe-wordmark.png";
const BRAND_ICON = "/images/brand/cong-cu-nghe-icon-512.png";

interface BrandLogoProps
  extends Omit<ImageProps, "src" | "alt" | "width" | "height"> {
  variant?: "wordmark" | "icon";
  /** Alias cho sidebar thu gọn. */
  compact?: boolean;
  alt?: string;
}

/** Hiển thị đúng tỷ lệ wordmark hoặc icon thương hiệu. */
export default function BrandLogo({
  variant = "wordmark",
  compact,
  alt = APP_NAME,
  className,
  ...rest
}: BrandLogoProps) {
  const mode = compact ? "icon" : variant;

  return (
    <Image
      src={mode === "icon" ? BRAND_ICON : BRAND_WORDMARK}
      alt={alt}
      width={mode === "icon" ? 512 : 1200}
      height={mode === "icon" ? 512 : 400}
      className={className ?? (mode === "icon" ? "size-8 object-contain" : "h-8 w-auto object-contain")}
      {...rest}
    />
  );
}
