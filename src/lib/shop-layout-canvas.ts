/**
 * Layout Canvas Builder — defaults, sample layout, migrate legacy, pure ops.
 */

import type {
  LayoutCanvasDocument,
  LayoutContainerChild,
  LayoutContainerChildType,
  LayoutSection,
  LayoutSectionStyling,
  LayoutSectionType,
  LayoutSectionTypeMeta,
  LayoutWidthPreset,
} from "@/types/shop-layout-canvas";
import type { ShopBlockConfig, ShopPersonalizationData } from "@/types/zalo-shop";

/* ─── Catalog ─── */

export const LAYOUT_SECTION_TYPE_META: LayoutSectionTypeMeta[] = [
  {
    type: "ANNOUNCEMENT",
    label: "Thanh thông báo",
    description: "Dòng announcement / flash text phía trên header",
    defaultWidthPreset: "FULL_BLEED",
    legacyId: "announcement",
  },
  {
    type: "HEADER",
    label: "Header cửa hàng",
    description: "Logo, tìm kiếm, giỏ hàng",
    defaultWidthPreset: "CONTAINER",
    lockedByDefault: true,
    legacyId: "header",
  },
  {
    type: "HERO",
    label: "Hero Banner",
    description: "Banner đỉnh trang, bento hoặc video",
    badge: "Đỉnh trang",
    defaultWidthPreset: "FULL_BLEED",
    legacyId: "hero",
  },
  {
    type: "TRUST_BADGES",
    label: "Cam kết & dịch vụ",
    description: "Giao nhanh, đổi trả, bảo hành",
    badge: "Uy tín",
    defaultWidthPreset: "CONTAINER",
    legacyId: "trust-badges",
  },
  {
    type: "CATEGORY_RAIL",
    label: "Danh mục",
    description: "Pills / story tròn / tree",
    defaultWidthPreset: "CONTAINER",
    legacyId: "category-rail",
  },
  {
    type: "FLASH_SALE",
    label: "Flash Sale",
    description: "Deal giờ vàng + countdown",
    badge: "Hot",
    defaultWidthPreset: "CONTAINER",
    legacyId: "flash-sale",
  },
  {
    type: "COUPONS",
    label: "Mã giảm giá",
    description: "Voucher / coupon rail",
    badge: "Voucher",
    defaultWidthPreset: "CONTAINER",
    legacyId: "coupons",
  },
  {
    type: "HOT_PRODUCTS",
    label: "Sản phẩm bán chạy",
    description: "Top trending / best seller",
    badge: "Bán chạy",
    defaultWidthPreset: "CONTAINER",
    legacyId: "hot-products",
  },
  {
    type: "PRODUCT_GRID",
    label: "Lưới sản phẩm",
    description: "Catalog chính — bắt buộc",
    badge: "Bắt buộc",
    defaultWidthPreset: "CONTAINER",
    lockedByDefault: true,
    legacyId: "product-feed",
  },
  {
    type: "EDITORIAL",
    label: "Editorial / Story",
    description: "Câu chuyện thương hiệu",
    defaultWidthPreset: "SPLIT_50_50",
    legacyId: "editorial",
  },
  {
    type: "REVIEWS",
    label: "Đánh giá khách hàng",
    description: "Carousel reviews",
    defaultWidthPreset: "CONTAINER",
    legacyId: "reviews",
  },
  {
    type: "CONTACT_FOOTER",
    label: "Liên hệ & chân trang",
    description: "Hotline, Zalo, địa chỉ",
    badge: "Footer",
    defaultWidthPreset: "FULL_BLEED",
    lockedByDefault: true,
    legacyId: "contact-footer",
  },
  {
    type: "PRODUCT_CAROUSEL",
    label: "Carousel sản phẩm",
    description: "Trượt ngang sản phẩm nổi bật",
    badge: "Mới",
    defaultWidthPreset: "CONTAINER",
    legacyId: "product-carousel",
  },
  {
    type: "IMAGE_BANNER",
    label: "Banner ảnh",
    description: "Ảnh full-width / banner quảng cáo",
    badge: "Mới",
    defaultWidthPreset: "FULL_BLEED",
    legacyId: "image-banner",
  },
  {
    type: "VIDEO_BLOCK",
    label: "Video",
    description: "Nhúng YouTube / video URL",
    badge: "Mới",
    defaultWidthPreset: "CONTAINER",
    legacyId: "video-block",
  },
  {
    type: "TEXT_BLOCK",
    label: "Khối văn bản",
    description: "Tiêu đề + đoạn mô tả tùy chỉnh",
    defaultWidthPreset: "NARROW",
    legacyId: "text-block",
  },
  {
    type: "CTA_BANNER",
    label: "CTA Banner",
    description: "Dải kêu gọi hành động (nút mua / liên hệ)",
    badge: "Mới",
    defaultWidthPreset: "FULL_BLEED",
    legacyId: "cta-banner",
  },
  {
    type: "FEATURE_GRID",
    label: "Tính năng / USP",
    description: "Lưới icon + tiêu đề + mô tả",
    defaultWidthPreset: "CONTAINER",
    legacyId: "feature-grid",
  },
  {
    type: "STATS",
    label: "Thống kê số liệu",
    description: "Các con số nổi bật (khách, đơn, năm…)",
    defaultWidthPreset: "CONTAINER",
    legacyId: "stats",
  },
  {
    type: "GALLERY",
    label: "Thư viện ảnh",
    description: "Lưới ảnh showcase / lookbook",
    badge: "Mới",
    defaultWidthPreset: "CONTAINER",
    legacyId: "gallery",
  },
  {
    type: "LOGO_CLOUD",
    label: "Logo đối tác",
    description: "Dải logo thương hiệu / đối tác",
    defaultWidthPreset: "CONTAINER",
    legacyId: "logo-cloud",
  },
  {
    type: "FAQ",
    label: "Câu hỏi thường gặp",
    description: "FAQ accordion Q&A",
    badge: "Mới",
    defaultWidthPreset: "NARROW",
    legacyId: "faq",
  },
  {
    type: "NEWSLETTER",
    label: "Đăng ký nhận tin",
    description: "Form email / Zalo OA CTA",
    defaultWidthPreset: "CONTAINER",
    legacyId: "newsletter",
  },
  {
    type: "SPACER",
    label: "Khoảng trống",
    description: "Chèn khoảng cách dọc giữa các khối",
    defaultWidthPreset: "FULL_BLEED",
    legacyId: "spacer",
  },
  {
    type: "LEAD_FORM",
    label: "Form tư vấn / SĐT",
    description: "Khối thu thập SĐT & thông tin nhận ưu đãi qua Zalo",
    badge: "Lead",
    defaultWidthPreset: "CONTAINER",
    legacyId: "lead_form",
  },
  {
    type: "SHORT_VIDEO",
    label: "Video Shorts / Review",
    description: "Khối video ngắn tự động chạy với nút mua ngay",
    badge: "Reel",
    defaultWidthPreset: "CONTAINER",
    legacyId: "short_video",
  },
  {
    type: "SPIN_WHEEL",
    label: "Vòng quay may mắn",
    description: "Mini-game quay số nhận mã giảm giá cho người mua",
    badge: "Game",
    defaultWidthPreset: "CONTAINER",
    legacyId: "spin_wheel",
  },
  {
    type: "DIVIDER",
    label: "Đường kẻ",
    description: "Phân tách section bằng line / dashed",
    defaultWidthPreset: "CONTAINER",
    legacyId: "divider",
  },
  {
    type: "CONTAINER",
    label: "Container (rỗng)",
    description: "Khối rỗng — thả text, ảnh, nút… vào trong",
    badge: "Nest",
    defaultWidthPreset: "CONTAINER",
    legacyId: "container",
  },
];

const LEGACY_ID_TO_TYPE: Record<string, LayoutSectionType> = Object.fromEntries(
  LAYOUT_SECTION_TYPE_META.map((m) => [m.legacyId, m.type]),
) as Record<string, LayoutSectionType>;

export function legacyIdToSectionType(legacyId: string): LayoutSectionType | null {
  return LEGACY_ID_TO_TYPE[legacyId] ?? null;
}

export function sectionTypeToLegacyId(type: LayoutSectionType): string {
  return (
    LAYOUT_SECTION_TYPE_META.find((m) => m.type === type)?.legacyId ??
    type.toLowerCase()
  );
}

/* ─── Defaults ─── */

export function createDefaultStyling(
  partial?: Partial<LayoutSectionStyling>,
): LayoutSectionStyling {
  return {
    bgPreset: "inherit",
    textTone: "auto",
    paddingY: "normal",
    paddingX: "normal",
    radius: "xl",
    elevation: "none",
    shadow: "none",
    blur: "none",
    hover: "none",
    border: "none",
    animation: "fade-up",
    ...partial,
  };
}

function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Tạo section mới theo type với data/styling mặc định */
export function createSection(
  type: LayoutSectionType,
  overrides?: Partial<Pick<LayoutSection, "enabled" | "widthPreset">> & {
    id?: string;
    data?: Partial<LayoutSection["data"]>;
    styling?: Partial<LayoutSectionStyling>;
    label?: string;
  },
): LayoutSection {
  const meta = LAYOUT_SECTION_TYPE_META.find((m) => m.type === type);
  const id = overrides?.id ?? newId(type.toLowerCase());
  const base = {
    id,
    enabled: overrides?.enabled ?? true,
    locked: meta?.lockedByDefault,
    widthPreset: overrides?.widthPreset ?? meta?.defaultWidthPreset ?? "CONTAINER",
    styling: createDefaultStyling(overrides?.styling),
  };

  switch (type) {
    case "ANNOUNCEMENT":
      return {
        ...base,
        type,
        styling: createDefaultStyling({
          animation: "none",
          ...overrides?.styling,
        }),
        data: {
          text: "Miễn phí ship đơn từ 299K · Đổi trả 7 ngày",
          dismissible: true,
          ...(overrides?.data as object),
        },
      };
    case "HEADER":
      return {
        ...base,
        type,
        styling: createDefaultStyling({
          animation: "none",
          ...overrides?.styling,
        }),
        data: {
          style: "island",
          showSearch: true,
          showCart: true,
          position: "static",
          ...(overrides?.data as object),
        },
      };
    case "HERO":
      return {
        ...base,
        type,
        data: {
          title: "Bộ sưu tập độc quyền 2026",
          subtitle: "Khám phá sản phẩm mới nhất — giao nhanh trong 2H nội thành",
          ctaText: "Xem sản phẩm",
          mediaType: "image",
          heroVariant: "bento",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "dark",
          textTone: "light",
          paddingY: "hero",
          ...overrides?.styling,
        }),
      };
    case "TRUST_BADGES":
      return {
        ...base,
        type,
        data: {
          items: [
            { id: "t1", label: "Giao hỏa tốc 2H", icon: "truck" },
            { id: "t2", label: "Đổi trả 7 ngày", icon: "shield" },
            { id: "t3", label: "Bảo hành chính hãng", icon: "star" },
            { id: "t4", label: "Hỗ trợ 24/7", icon: "phone" },
          ],
          ...(overrides?.data as object),
        },
      };
    case "CATEGORY_RAIL":
      return {
        ...base,
        type,
        data: {
          style: "pills",
          categoryIds: null,
          title: "Danh mục",
          ...(overrides?.data as object),
        },
      };
    case "FLASH_SALE":
      return {
        ...base,
        type,
        data: {
          title: "Flash Sale giờ vàng",
          subtitle: "Số lượng có hạn",
          endsAt: null,
          productIds: null,
          maxItems: 8,
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "gradient-rose",
          textTone: "light",
          ...overrides?.styling,
        }),
      };
    case "COUPONS":
      return {
        ...base,
        type,
        data: {
          title: "Mã giảm giá",
          couponIds: null,
          ...(overrides?.data as object),
        },
      };
    case "HOT_PRODUCTS":
      return {
        ...base,
        type,
        data: {
          title: "Bán chạy nhất",
          subtitle: "Top lựa chọn tuần này",
          productIds: null,
          maxItems: 8,
          ...(overrides?.data as object),
        },
      };
    case "PRODUCT_GRID":
      return {
        ...base,
        type,
        locked: true,
        data: {
          title: "Tất cả sản phẩm",
          density: "comfortable",
          cardStyle: "comfortable",
          productIds: null,
          categoryId: null,
          showFilters: true,
          ...(overrides?.data as object),
        },
      };
    case "EDITORIAL":
      return {
        ...base,
        type,
        widthPreset: overrides?.widthPreset ?? "SPLIT_50_50",
        data: {
          title: "Câu chuyện thương hiệu",
          body: "Chúng tôi tin vào chất lượng và trải nghiệm mua sắm tinh gọn.",
          mediaSide: "left",
          ctaText: "Tìm hiểu thêm",
          ...(overrides?.data as object),
        },
      };
    case "REVIEWS":
      return {
        ...base,
        type,
        data: {
          title: "Khách hàng nói gì",
          subtitle: "Đánh giá thật từ người mua",
          reviewSource: "demo",
          ...(overrides?.data as object),
        },
      };
    case "CONTACT_FOOTER":
      return {
        ...base,
        type,
        locked: true,
        data: {
          title: "Liên hệ",
          phone: "",
          zalo: "",
          facebook: "",
          website: "",
          address: "",
          showMap: false,
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "dark",
          textTone: "light",
          paddingY: "spacious",
          ...overrides?.styling,
        }),
      };
    case "PRODUCT_CAROUSEL":
      return {
        ...base,
        type,
        data: {
          title: "Gợi ý cho bạn",
          subtitle: "Vuốt xem thêm sản phẩm",
          productIds: null,
          maxItems: 10,
          cardStyle: "comfortable",
          ...(overrides?.data as object),
        },
      };
    case "IMAGE_BANNER":
      return {
        ...base,
        type,
        data: {
          imageUrl:
            "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80",
          alt: "Banner cửa hàng",
          href: "#products",
          height: "md",
          objectFit: "cover",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          paddingY: "none",
          paddingX: "none",
          radius: "none",
          ...overrides?.styling,
        }),
      };
    case "VIDEO_BLOCK":
      return {
        ...base,
        type,
        data: {
          title: "Video giới thiệu",
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          posterUrl: "",
          autoplay: false,
          ...(overrides?.data as object),
        },
      };
    case "TEXT_BLOCK":
      return {
        ...base,
        type,
        data: {
          eyebrow: "Về chúng tôi",
          title: "Thương hiệu vì trải nghiệm mua sắm",
          body: "Viết câu chuyện, chính sách hoặc giới thiệu ngắn gọn. Nội dung này hiển thị đúng như trên gian hàng.",
          align: "center",
          size: "md",
          ...(overrides?.data as object),
        },
      };
    case "CTA_BANNER":
      return {
        ...base,
        type,
        data: {
          title: "Sẵn sàng mua sắm?",
          subtitle: "Ưu đãi dành riêng cho khách Zalo — chốt đơn trong vài chạm",
          ctaText: "Mua ngay",
          ctaHref: "#products",
          secondaryText: "Liên hệ tư vấn",
          secondaryHref: "#contact",
          variant: "gradient",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "gradient-brand",
          textTone: "light",
          paddingY: "spacious",
          ...overrides?.styling,
        }),
      };
    case "FEATURE_GRID":
      return {
        ...base,
        type,
        data: {
          title: "Vì sao chọn chúng tôi",
          subtitle: "Cam kết dịch vụ",
          columns: 4,
          items: [
            {
              id: "f1",
              title: "Giao nhanh",
              body: "Nội thành 2H, toàn quốc 1–3 ngày",
              icon: "truck",
            },
            {
              id: "f2",
              title: "Chính hãng",
              body: "Tem mác đầy đủ, hoá đơn VAT",
              icon: "shield",
            },
            {
              id: "f3",
              title: "Đổi trả dễ",
              body: "7 ngày đổi trả nếu lỗi NSX",
              icon: "gift",
            },
            {
              id: "f4",
              title: "Hỗ trợ 24/7",
              body: "Chat Zalo bất cứ lúc nào",
              icon: "phone",
            },
          ],
          ...(overrides?.data as object),
        },
      };
    case "STATS":
      return {
        ...base,
        type,
        data: {
          title: "Con số biết nói",
          items: [
            { id: "s1", value: "10K+", label: "Khách hài lòng" },
            { id: "s2", value: "4.9★", label: "Đánh giá trung bình" },
            { id: "s3", value: "2H", label: "Giao nội thành" },
            { id: "s4", value: "5 năm", label: "Kinh nghiệm" },
          ],
          ...(overrides?.data as object),
        },
      };
    case "GALLERY":
      return {
        ...base,
        type,
        data: {
          title: "Lookbook",
          columns: 3,
          images: [
            {
              id: "g1",
              url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
              alt: "Look 1",
            },
            {
              id: "g2",
              url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
              alt: "Look 2",
            },
            {
              id: "g3",
              url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
              alt: "Look 3",
            },
          ],
          ...(overrides?.data as object),
        },
      };
    case "LOGO_CLOUD":
      return {
        ...base,
        type,
        data: {
          title: "Thương hiệu đồng hành",
          logos: [
            { id: "l1", name: "Brand A" },
            { id: "l2", name: "Brand B" },
            { id: "l3", name: "Brand C" },
            { id: "l4", name: "Brand D" },
            { id: "l5", name: "Brand E" },
          ],
          ...(overrides?.data as object),
        },
      };
    case "FAQ":
      return {
        ...base,
        type,
        data: {
          title: "Câu hỏi thường gặp",
          subtitle: "Giải đáp nhanh trước khi mua",
          items: [
            {
              id: "q1",
              question: "Thời gian giao hàng bao lâu?",
              answer:
                "Nội thành 2H (khung giờ vàng). Tỉnh thành khác 1–3 ngày làm việc tuỳ đơn vị vận chuyển.",
            },
            {
              id: "q2",
              question: "Có được kiểm hàng khi nhận không?",
              answer:
                "Có — hỗ trợ kiểm tra trước khi thanh toán COD (tuỳ khu vực).",
            },
            {
              id: "q3",
              question: "Chính sách đổi trả?",
              answer:
                "Đổi trả trong 7 ngày nếu lỗi nhà sản xuất, còn tem mác và hoá đơn.",
            },
          ],
          ...(overrides?.data as object),
        },
      };
    case "NEWSLETTER":
      return {
        ...base,
        type,
        data: {
          title: "Nhận ưu đãi sớm nhất",
          subtitle: "Để lại SĐT / email — nhận mã giảm giá cho đơn đầu",
          placeholder: "Nhập SĐT hoặc email…",
          buttonText: "Đăng ký",
          successHint: "Cảm ơn bạn! Mã giảm giá đã được gửi.",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "muted",
          paddingY: "spacious",
          ...overrides?.styling,
        }),
      };
    case "LEAD_FORM":
      return {
        ...base,
        type,
        data: {
          title: "Đăng ký nhận tư vấn & ưu đãi",
          subtitle: "Để lại SĐT, tư vấn viên Zalo sẽ liên hệ trong 5 phút",
          fields: ["name", "phone", "note"],
          buttonText: "Gửi đăng ký ngay",
          successMessage: "Đã gửi thông tin! Chúng tôi sẽ gọi tư vấn ngay.",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "surface",
          radius: "2xl",
          shadow: "md",
          ...overrides?.styling,
        }),
      };
    case "SHORT_VIDEO":
      return {
        ...base,
        type,
        data: {
          title: "Video trải nghiệm thực tế",
          subtitle: "Xem cận cảnh sản phẩm trước khi chốt đơn",
          videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-showing-clothes-41548-large.mp4",
          badge: "HOT REVIEW",
          ctaText: "Xem & Mua ngay",
          ctaHref: "#products",
          autoplay: true,
          ...(overrides?.data as object),
        },
      };
    case "SPIN_WHEEL":
      return {
        ...base,
        type,
        data: {
          title: "Vòng quay may mắn",
          subtitle: "Quay 100% trúng quà — Dành riêng cho khách mua trên Zalo",
          prizes: [
            { id: "p1", label: "Giảm 10%", code: "SALE10", color: "#F59E0B" },
            { id: "p2", label: "Freeship", code: "FREESHIP", color: "#10B981" },
            { id: "p3", label: "Giảm 50K", code: "50KOFF", color: "#EF4444" },
            { id: "p4", label: "Voucher 100K", code: "VIP100K", color: "#3B82F6" },
            { id: "p5", label: "Quà tặng kèm", code: "GIFTFREE", color: "#8B5CF6" },
            { id: "p6", label: "Giảm 5%", code: "SALE5", color: "#EC4899" },
          ],
          buttonText: "Quay ngay",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "gradient-amber",
          textTone: "light",
          radius: "2xl",
          ...overrides?.styling,
        }),
      };
    case "SPACER":
      return {
        ...base,
        type,
        data: {
          size: "md",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          paddingY: "none",
          paddingX: "none",
          animation: "none",
          ...overrides?.styling,
        }),
      };
    case "DIVIDER":
      return {
        ...base,
        type,
        data: {
          style: "line",
          label: "",
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          paddingY: "compact",
          animation: "fade",
          ...overrides?.styling,
        }),
      };
    case "CONTAINER":
      return {
        ...base,
        type,
        data: {
          title: "",
          layout: "stack",
          gap: "md",
          align: "stretch",
          minHeight: "md",
          children: [],
          nestedBlocks: [],
          ...(overrides?.data as object),
        },
        styling: createDefaultStyling({
          bgPreset: "surface",
          paddingY: "normal",
          paddingX: "normal",
          radius: "xl",
          border: "dashed",
          animation: "fade-up",
          ...overrides?.styling,
        }),
      };
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown section type: ${_exhaustive}`);
    }
  }
}

/** Tạo 1 thành phần con trong CONTAINER */
export function createContainerChild(
  type: LayoutContainerChildType,
): LayoutContainerChild {
  const id = newId(`child_${type}`);
  switch (type) {
    case "text":
      return {
        id,
        type,
        data: {
          text: "Đoạn văn bản — click để sửa trong Properties.",
          align: "left",
          muted: false,
        },
      };
    case "heading":
      return {
        id,
        type,
        data: { text: "Tiêu đề trong container", level: 2, align: "left" },
      };
    case "image":
      return {
        id,
        type,
        data: {
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
          alt: "Ảnh",
          aspect: "video",
        },
      };
    case "button":
      return {
        id,
        type,
        data: {
          label: "Nút hành động",
          href: "#products",
          variant: "primary",
        },
      };
    case "spacer":
      return { id, type, data: { size: "md" } };
    case "divider":
      return { id, type, data: { label: "" } };
    case "badge":
      return { id, type, data: { text: "Badge" } };
    case "html":
      return {
        id,
        type,
        data: { html: "<p>HTML tuỳ chỉnh</p>" },
      };
    default: {
      const _e: never = type;
      throw new Error(`Unknown child type: ${_e}`);
    }
  }
}

export const CONTAINER_CHILD_META: {
  type: LayoutContainerChildType;
  label: string;
  description: string;
}[] = [
  { type: "heading", label: "Tiêu đề", description: "Heading H1–H3" },
  { type: "text", label: "Văn bản", description: "Đoạn paragraph" },
  { type: "image", label: "Ảnh", description: "Hình ảnh / banner nhỏ" },
  { type: "button", label: "Nút", description: "CTA button" },
  { type: "badge", label: "Badge", description: "Nhãn nhỏ" },
  { type: "spacer", label: "Khoảng trống", description: "Spacing dọc" },
  { type: "divider", label: "Đường kẻ", description: "Phân tách" },
];

/**
 * Sample layout: Header + Hero + Grid (+ trust + categories)
 * Dùng cho preview builder / seed custom-drag-drop.
 */
export function createSampleLayoutCanvas(): LayoutCanvasDocument {
  return {
    schemaVersion: 1,
    page: {
      maxWidthPreset: "xl",
      sectionGap: "normal",
    },
    sections: [
      createSection("HEADER", {
        id: "sec_header_sample",
        widthPreset: "CONTAINER",
      }),
      createSection("HERO", {
        id: "sec_hero_sample",
        widthPreset: "FULL_BLEED",
        data: {
          title: "Summer Drop 2026",
          subtitle: "Phong cách tối giản — chất liệu cao cấp",
          ctaText: "Mua ngay",
          heroVariant: "bento",
        },
      }),
      createSection("TRUST_BADGES", {
        id: "sec_trust_sample",
        widthPreset: "CONTAINER",
      }),
      createSection("CATEGORY_RAIL", {
        id: "sec_cat_sample",
        widthPreset: "CONTAINER",
      }),
      createSection("FLASH_SALE", {
        id: "sec_flash_sample",
        widthPreset: "SPLIT_70_30",
        enabled: true,
      }),
      createSection("PRODUCT_GRID", {
        id: "sec_grid_sample",
        widthPreset: "GRID_3",
        data: {
          title: "Khám phá bộ sưu tập",
          density: "airy",
          cardStyle: "comfortable",
          showFilters: true,
        },
      }),
      createSection("REVIEWS", {
        id: "sec_reviews_sample",
        widthPreset: "CONTAINER",
      }),
      createSection("CONTACT_FOOTER", {
        id: "sec_footer_sample",
        widthPreset: "FULL_BLEED",
      }),
    ],
  };
}

export const DEFAULT_LAYOUT_CANVAS: LayoutCanvasDocument =
  createSampleLayoutCanvas();

/* ─── Width preset → CSS / Tailwind hints ─── */

/**
 * Gutter ngang CHUNG cho mọi boxed model.
 * Cùng preset → cùng max-width + cùng px → mép trái/phải thẳng hàng giữa các section.
 */
export const LAYOUT_PAGE_GUTTER = "px-4 sm:px-6";

/** Max content width theo Boxed model (không gồm display:grid) */
export function widthPresetMaxWidthClass(preset: LayoutWidthPreset): string {
  switch (preset) {
    case "FULL_BLEED":
      return "max-w-none";
    case "NARROW":
      return "max-w-3xl";
    case "CONTAINER":
    case "SPLIT_50_50":
    case "SPLIT_70_30":
    case "SPLIT_30_70":
    case "SPLIT_40_60":
    case "GRID_2":
    case "GRID_3":
    case "GRID_4":
    case "BENTO_FEATURE":
    case "MASONRY":
    default:
      // Mọi “Boxed” / grid / split dùng cùng max-w-7xl
      return "max-w-7xl";
  }
}

/**
 * Khung container section — CHỈ width + căn giữa + gutter.
 * Không gắn grid/columns ở đây (tránh lệch width khi 2 section cùng Boxed model).
 */
export function widthPresetToClass(preset: LayoutWidthPreset): string {
  if (preset === "FULL_BLEED") {
    return "w-full max-w-none";
  }
  // Boxed small vs Boxed: chỉ khác max-width; gutter giống hệt
  return `mx-auto box-border w-full ${widthPresetMaxWidthClass(preset)} ${LAYOUT_PAGE_GUTTER}`;
}

/**
 * Layout cột (split/grid) — áp dụng cho *nội dung bên trong* container, không phải khung width.
 */
export function widthPresetContentLayoutClass(
  preset: LayoutWidthPreset,
): string {
  switch (preset) {
    case "SPLIT_50_50":
      return "grid w-full grid-cols-1 gap-4 md:grid-cols-2";
    case "SPLIT_70_30":
      return "grid w-full grid-cols-1 gap-4 md:grid-cols-[1.4fr_0.6fr]";
    case "SPLIT_30_70":
      return "grid w-full grid-cols-1 gap-4 md:grid-cols-[0.6fr_1.4fr]";
    case "SPLIT_40_60":
      return "grid w-full grid-cols-1 gap-4 md:grid-cols-[2fr_3fr]";
    case "GRID_2":
      return "grid w-full grid-cols-1 gap-4 sm:grid-cols-2";
    case "GRID_3":
      return "grid w-full grid-cols-2 gap-3 md:grid-cols-3";
    case "GRID_4":
      return "grid w-full grid-cols-2 gap-3 md:grid-cols-4";
    case "BENTO_FEATURE":
      return "grid w-full grid-cols-2 grid-rows-2 gap-3 md:grid-cols-4";
    case "MASONRY":
      return "w-full columns-2 gap-3 md:columns-3";
    default:
      return "w-full";
  }
}

/* ─── Pure document operations ─── */

export function reorderSections(
  doc: LayoutCanvasDocument,
  fromIndex: number,
  toIndex: number,
): LayoutCanvasDocument {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= doc.sections.length ||
    toIndex >= doc.sections.length
  ) {
    return doc;
  }
  const sections = [...doc.sections];
  const [moved] = sections.splice(fromIndex, 1);
  sections.splice(toIndex, 0, moved);
  return { ...doc, sections };
}

export function patchSection(
  doc: LayoutCanvasDocument,
  sectionId: string,
  patch: Partial<
    Pick<LayoutSection, "enabled" | "widthPreset" | "styling" | "data">
  >,
): LayoutCanvasDocument {
  return {
    ...doc,
    sections: doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        ...patch,
        styling: patch.styling
          ? { ...sec.styling, ...patch.styling }
          : sec.styling,
        data: patch.data ? { ...sec.data, ...patch.data } : sec.data,
      } as LayoutSection;
    }),
  };
}

export function setSectionEnabled(
  doc: LayoutCanvasDocument,
  sectionId: string,
  enabled: boolean,
): LayoutCanvasDocument {
  return patchSection(doc, sectionId, { enabled });
}

export function removeSection(
  doc: LayoutCanvasDocument,
  sectionId: string,
): LayoutCanvasDocument {
  const target = doc.sections.find((s) => s.id === sectionId);
  if (!target || target.locked) return doc;
  return {
    ...doc,
    sections: doc.sections.filter((s) => s.id !== sectionId),
  };
}

export function addSection(
  doc: LayoutCanvasDocument,
  type: LayoutSectionType,
  atIndex?: number,
): LayoutCanvasDocument {
  const section = createSection(type);
  const sections = [...doc.sections];
  const index =
    typeof atIndex === "number"
      ? Math.max(0, Math.min(atIndex, sections.length))
      : sections.length;
  sections.splice(index, 0, section);
  return { ...doc, sections };
}

/**
 * Deep-clone 1 section với id mới.
 * Clone không kế thừa `locked` (tránh 2 section “bắt buộc” cùng lúc).
 */
export function cloneSection(section: LayoutSection): LayoutSection {
  const data = JSON.parse(JSON.stringify(section.data)) as LayoutSection["data"];
  const styling = { ...section.styling };
  return {
    ...section,
    id: newId(section.type.toLowerCase()),
    locked: false,
    enabled: section.enabled,
    widthPreset: section.widthPreset,
    styling,
    data,
  } as LayoutSection;
}

/** Nhân đôi section ngay sau vị trí gốc */
export function duplicateSection(
  doc: LayoutCanvasDocument,
  sectionId: string,
): LayoutCanvasDocument {
  const index = doc.sections.findIndex((s) => s.id === sectionId);
  if (index < 0) return doc;
  const copy = cloneSection(doc.sections[index]);
  const sections = [...doc.sections];
  sections.splice(index + 1, 0, copy);
  return { ...doc, sections };
}

/** Dịch section lên/xuống 1 bậc (keyboard / nút) */
export function moveSectionBy(
  doc: LayoutCanvasDocument,
  sectionId: string,
  delta: number,
): LayoutCanvasDocument {
  const from = doc.sections.findIndex((s) => s.id === sectionId);
  if (from < 0 || delta === 0) return doc;
  const to = from + delta;
  if (to < 0 || to >= doc.sections.length) return doc;
  return reorderSections(doc, from, to);
}

/**
 * Reorder 1 section; nếu có groupId — di chuyển cả group như 1 block.
 */
export function reorderSectionsWithGroup(
  list: LayoutSection[],
  fromIndex: number,
  toIndex: number,
): LayoutSection[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const item = list[fromIndex];
  const gid = item.groupId?.trim();
  if (!gid) {
    const next = Array.from(list);
    const [removed] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, removed);
    return next;
  }

  // Collect all members of group (preserve relative order)
  const members = list.filter((s) => s.groupId === gid);
  const memberIds = new Set(members.map((s) => s.id));
  const rest = list.filter((s) => !memberIds.has(s.id));

  // Insert group before the item currently at toIndex (in original list, adjusted)
  // Map toIndex to position in rest-based list
  let insertAt = 0;
  if (toIndex >= list.length - 1) {
    insertAt = rest.length;
  } else {
    const targetId = list[toIndex].id;
    if (memberIds.has(targetId)) {
      // dropping onto self group — no op
      return list;
    }
    const idxInRest = rest.findIndex((s) => s.id === targetId);
    insertAt = idxInRest < 0 ? rest.length : idxInRest;
    // If moving down past group, adjust
    if (fromIndex < toIndex) {
      // target is after extraction
    }
  }

  const result = [...rest];
  result.splice(insertAt, 0, ...members);
  return result;
}

export function moveSectionWithGroup(
  list: LayoutSection[],
  sectionId: string,
  delta: number,
): LayoutSection[] {
  const from = list.findIndex((s) => s.id === sectionId);
  if (from < 0 || delta === 0) return list;
  const item = list[from];
  const gid = item.groupId?.trim();
  if (!gid) {
    const to = from + delta;
    if (to < 0 || to >= list.length) return list;
    return reorderSectionsWithGroup(list, from, to);
  }
  // Move entire group by one "slot" outside the group
  const members = list.filter((s) => s.groupId === gid);
  const first = list.findIndex((s) => s.groupId === gid);
  const last = first + members.length - 1;
  if (delta < 0) {
    if (first === 0) return list;
    const swapWith = first - 1;
    return reorderSectionsWithGroup(list, first, swapWith);
  }
  if (last >= list.length - 1) return list;
  return reorderSectionsWithGroup(list, first, last + 1);
}

/** Chèn section đã tạo tại index */
export function insertSectionAt(
  doc: LayoutCanvasDocument,
  section: LayoutSection,
  atIndex: number,
): LayoutCanvasDocument {
  const sections = [...doc.sections];
  const index = Math.max(0, Math.min(atIndex, sections.length));
  sections.splice(index, 0, section);
  return { ...doc, sections };
}

/* ─── Migrate legacy parallel maps → canvas document ─── */

function mapLegacyColumnSpan(
  span?: ShopBlockConfig["columnSpan"],
): LayoutWidthPreset {
  switch (span) {
    case "half":
      return "SPLIT_50_50";
    case "third":
      return "GRID_3";
    case "full":
    default:
      return "CONTAINER";
  }
}

function mapLegacyBg(
  bg?: ShopBlockConfig["bgStyle"],
): LayoutSectionStyling["bgPreset"] {
  switch (bg) {
    case "dark":
      return "dark";
    case "gradient-amber":
      return "gradient-amber";
    case "gradient-rose":
      return "gradient-rose";
    case "gradient-emerald":
      return "gradient-emerald";
    case "white":
      return "surface";
    case "custom":
      return "custom";
    default:
      return "inherit";
  }
}

/**
 * Convert sectionOrder + sectionVisibility + blockConfigs → LayoutCanvasDocument.
 * Giữ tương thích dữ liệu đã lưu trước khi có layoutCanvas.
 */
export function migrateLegacyToLayoutCanvas(
  data: Pick<
    ShopPersonalizationData,
    | "sectionOrder"
    | "sectionVisibility"
    | "blockConfigs"
    | "heroTitle"
    | "heroSubtitle"
    | "ctaText"
    | "announcement"
    | "showHero"
    | "showAnnouncement"
    | "showFlashSale"
    | "showCategoryRail"
    | "showReviews"
    | "showTrustBadges"
    | "contactPhone"
    | "contactZalo"
    | "contactFacebook"
    | "contactWebsite"
    | "contactAddress"
    | "gridDensity"
    | "productCardStyle"
    | "categoryStyle"
  >,
): LayoutCanvasDocument {
  const order =
    data.sectionOrder && data.sectionOrder.length > 0
      ? data.sectionOrder
      : [
          "hero",
          "trust-badges",
          "category-rail",
          "flash-sale",
          "product-feed",
          "editorial",
          "reviews",
          "contact-footer",
        ];

  const visibility = data.sectionVisibility ?? {};
  const configs = data.blockConfigs ?? {};

  const defaultEnabled: Record<string, boolean> = {
    hero: data.showHero !== false,
    announcement: data.showAnnouncement === true,
    "trust-badges": data.showTrustBadges !== false,
    "category-rail": data.showCategoryRail !== false,
    "flash-sale": data.showFlashSale !== false,
    coupons: true,
    "hot-products": true,
    "product-feed": true,
    editorial: true,
    reviews: data.showReviews !== false,
    "contact-footer": true,
  };

  const sections: LayoutSection[] = [];

  // Optional announcement if text exists
  if (data.announcement?.trim()) {
    sections.push(
      createSection("ANNOUNCEMENT", {
        enabled: data.showAnnouncement !== false,
        data: { text: data.announcement },
      }),
    );
  }

  for (const legacyId of order) {
    const type = legacyIdToSectionType(legacyId);
    if (!type) continue;
    if (sections.some((s) => s.type === type)) continue;

    const cfg = configs[legacyId] ?? {};
    const enabled =
      typeof visibility[legacyId] === "boolean"
        ? visibility[legacyId]
        : (defaultEnabled[legacyId] ?? true);

    const section = createSection(type, {
      enabled,
      widthPreset: mapLegacyColumnSpan(cfg.columnSpan),
      styling: {
        bgPreset: mapLegacyBg(cfg.bgStyle),
        customBg: cfg.customBgColor,
        textTone: "auto",
        paddingY:
          cfg.padding === "compact"
            ? "compact"
            : cfg.padding === "spacious"
              ? "spacious"
              : "normal",
        paddingX: "normal",
        radius:
          cfg.borderRadius === "rounded-3xl"
            ? "2xl"
            : cfg.borderRadius === "rounded-xl"
              ? "md"
              : "xl",
      },
    });

    // Content bridges
    if (section.type === "HERO") {
      section.data = {
        ...section.data,
        title: cfg.customTitle || data.heroTitle || section.data.title,
        subtitle: cfg.customSubtitle || data.heroSubtitle || section.data.subtitle,
        ctaText: data.ctaText || section.data.ctaText,
      };
    }
    if (section.type === "FLASH_SALE" || section.type === "HOT_PRODUCTS") {
      section.data = {
        ...section.data,
        title: cfg.customTitle || section.data.title,
        subtitle: cfg.customSubtitle || section.data.subtitle,
      };
    }
    if (section.type === "PRODUCT_GRID") {
      section.data = {
        ...section.data,
        title: cfg.customTitle || section.data.title,
        density: data.gridDensity ?? section.data.density,
        cardStyle: data.productCardStyle ?? section.data.cardStyle,
      };
    }
    if (section.type === "CATEGORY_RAIL") {
      section.data = {
        ...section.data,
        style: data.categoryStyle ?? section.data.style,
        title: cfg.customTitle || section.data.title,
      };
    }
    if (section.type === "CONTACT_FOOTER") {
      section.data = {
        ...section.data,
        phone: data.contactPhone || "",
        zalo: data.contactZalo || "",
        facebook: data.contactFacebook || "",
        website: data.contactWebsite || "",
        address: data.contactAddress || "",
      };
    }
    if (section.type === "EDITORIAL" || section.type === "REVIEWS") {
      section.data = {
        ...section.data,
        title: cfg.customTitle || section.data.title,
        ...(section.type === "EDITORIAL"
          ? { body: cfg.customSubtitle || section.data.body }
          : { subtitle: cfg.customSubtitle || section.data.subtitle }),
      };
    }

    sections.push(section);
  }

  // Ensure locked essentials exist
  for (const type of ["PRODUCT_GRID", "CONTACT_FOOTER"] as LayoutSectionType[]) {
    if (!sections.some((s) => s.type === type)) {
      sections.push(createSection(type));
    }
  }

  return {
    schemaVersion: 1,
    page: { maxWidthPreset: "xl", sectionGap: "normal" },
    sections,
  };
}

/**
 * Resolve canvas document from personalization:
 * 1) layoutCanvas hợp lệ → dùng
 * 2) else migrate legacy maps
 * 3) else sample default
 */
export function resolveLayoutCanvas(
  data: ShopPersonalizationData | null | undefined,
): LayoutCanvasDocument {
  const raw = data?.layoutCanvas;
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as LayoutCanvasDocument).sections) &&
    (raw as LayoutCanvasDocument).sections.length > 0
  ) {
    const doc = raw as LayoutCanvasDocument;
    return {
      schemaVersion: 1,
      page: doc.page ?? { maxWidthPreset: "xl", sectionGap: "normal" },
      sections: doc.sections,
    };
  }

  if (
    (data?.sectionOrder && data.sectionOrder.length > 0) ||
    data?.blockConfigs ||
    data?.sectionVisibility
  ) {
    return migrateLegacyToLayoutCanvas(data ?? {});
  }

  return createSampleLayoutCanvas();
}

/**
 * Resolves LayoutCanvasDocument cho Trang Chi Tiết Sản Phẩm (PDP)
 */
export function resolvePdpLayoutCanvas(
  data: ShopPersonalizationData | null | undefined,
): LayoutCanvasDocument {
  const raw = data?.pdpLayoutCanvas;
  if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as LayoutCanvasDocument).sections) &&
    (raw as LayoutCanvasDocument).sections.length > 0
  ) {
    const doc = raw as LayoutCanvasDocument;
    return {
      schemaVersion: 1,
      page: doc.page ?? { maxWidthPreset: "xl", sectionGap: "normal" },
      sections: doc.sections,
    };
  }

  return {
    schemaVersion: 1,
    page: { maxWidthPreset: "xl", sectionGap: "normal" },
    sections: [
      createSection("TRUST_BADGES", {
        data: { title: "Cam Kết Chất Lượng & Dịch Vụ Zalo Store" },
        styling: { bgPreset: "surface", paddingY: "compact" },
      }),
      createSection("REVIEWS", {
        data: { title: "Đánh giá từ khách hàng đã mua sản phẩm" },
        styling: { bgPreset: "surface", paddingY: "normal" },
      }),
      createSection("LEAD_FORM", {
        data: {
          title: "Tư Vấn Thêm Về Sản Phẩm Trực Tiếp Qua Zalo",
          subtitle: "Để lại SĐT Zalo để nhân viên gửi ảnh thực tế & báo giá tốt nhất",
        },
        styling: { bgPreset: "gradient-brand", textTone: "light", paddingY: "spacious" },
      }),
      createSection("FAQ", {
        data: { title: "Câu hỏi thường gặp về chính sách đổi trả & vận chuyển" },
      }),
    ],
  };
}

/**
 * Sync ngược canvas → legacy fields (storefront cũ vẫn đọc sectionOrder).
 * Gọi khi save personalization để dual-write.
 */
export function layoutCanvasToLegacyFields(
  doc: LayoutCanvasDocument,
): Pick<
  ShopPersonalizationData,
  | "sectionOrder"
  | "sectionVisibility"
  | "blockConfigs"
  | "showHero"
  | "showFlashSale"
  | "showCategoryRail"
  | "showReviews"
  | "showTrustBadges"
  | "showAnnouncement"
  | "heroTitle"
  | "heroSubtitle"
  | "ctaText"
> {
  const sectionOrder: string[] = [];
  const sectionVisibility: Record<string, boolean> = {};
  const blockConfigs: Record<string, ShopBlockConfig> = {};

  let heroTitle = "";
  let heroSubtitle = "";
  let ctaText = "";
  let showHero = true;
  let showFlashSale = false;
  let showCategoryRail = true;
  let showReviews = true;
  let showTrustBadges = true;
  let showAnnouncement = false;

  for (const sec of doc.sections) {
    const legacyId = sectionTypeToLegacyId(sec.type);
    if (sec.type !== "ANNOUNCEMENT" && sec.type !== "HEADER") {
      sectionOrder.push(legacyId);
    }
    sectionVisibility[legacyId] = sec.enabled;

    const cfg: ShopBlockConfig = {
      padding:
        sec.styling.paddingY === "compact"
          ? "compact"
          : sec.styling.paddingY === "spacious" || sec.styling.paddingY === "hero"
            ? "spacious"
            : "normal",
      bgStyle:
        sec.styling.bgPreset === "dark"
          ? "dark"
          : sec.styling.bgPreset === "gradient-amber"
            ? "gradient-amber"
            : sec.styling.bgPreset === "gradient-rose"
              ? "gradient-rose"
              : sec.styling.bgPreset === "gradient-emerald"
                ? "gradient-emerald"
                : sec.styling.bgPreset === "surface"
                  ? "white"
                  : sec.styling.bgPreset === "custom"
                    ? "custom"
                    : "default",
      customBgColor: sec.styling.customBg,
      columnSpan:
        sec.widthPreset === "SPLIT_50_50" || sec.widthPreset === "SPLIT_40_60"
          ? "half"
          : sec.widthPreset === "GRID_3"
            ? "third"
            : "full",
    };

    if (sec.type === "HERO") {
      cfg.customTitle = sec.data.title;
      cfg.customSubtitle = sec.data.subtitle;
      heroTitle = sec.data.title;
      heroSubtitle = sec.data.subtitle;
      ctaText = sec.data.ctaText;
      showHero = sec.enabled;
    }
    if (sec.type === "FLASH_SALE") {
      cfg.customTitle = sec.data.title;
      showFlashSale = sec.enabled;
    }
    if (sec.type === "CATEGORY_RAIL") showCategoryRail = sec.enabled;
    if (sec.type === "REVIEWS") {
      cfg.customTitle = sec.data.title;
      showReviews = sec.enabled;
    }
    if (sec.type === "TRUST_BADGES") showTrustBadges = sec.enabled;
    if (sec.type === "ANNOUNCEMENT") showAnnouncement = sec.enabled;
    if (sec.type === "PRODUCT_GRID") {
      cfg.customTitle = sec.data.title;
    }

    blockConfigs[legacyId] = cfg;
  }

  return {
    sectionOrder,
    sectionVisibility,
    blockConfigs,
    showHero,
    showFlashSale,
    showCategoryRail,
    showReviews,
    showTrustBadges,
    showAnnouncement,
    heroTitle,
    heroSubtitle,
    ctaText,
  };
}

/** Sample JSON (plain object) — dùng docs / seed / tests */
export const SAMPLE_LAYOUT_CANVAS_JSON: LayoutCanvasDocument =
  createSampleLayoutCanvas();
