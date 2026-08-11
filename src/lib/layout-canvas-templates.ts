/**
 * Layout Canvas Page Templates — Bộ mẫu trang dựng sẵn 1-Click.
 * Dành riêng cho shop Zalo Admin.
 */

import { createSection } from "@/lib/shop-layout-canvas";
import type { LayoutSection } from "@/types/shop-layout-canvas";

export interface PageTemplateDefinition {
  id: string;
  name: string;
  subtitle: string;
  category: "fashion" | "flash" | "tech" | "lead";
  badge: string;
  description: string;
  previewGradient: string;
  build: () => LayoutSection[];
}

export const PAGE_TEMPLATES: PageTemplateDefinition[] = [
  {
    id: "fashion-beauty",
    name: "Thời Trang & Mỹ Phẩm Sang Trọng",
    subtitle: "Thiết kế tối giản, tôn vinh hình ảnh sản phẩm & cảm nhận người mua",
    category: "fashion",
    badge: "Bán chạy #1",
    description: "Header nổi (Island), Hero Minimal, danh mục Stories, dải sản phẩm Hot và Đánh giá từ khách hàng.",
    previewGradient: "from-amber-500 via-rose-500 to-pink-600",
    build: () => [
      createSection("HEADER", {
        data: { style: "island", position: "static", showSearch: true, showCart: true },
      }),
      createSection("HERO", {
        widthPreset: "CONTAINER",
        data: {
          title: "Summer Collection 2026",
          subtitle: "Phong cách tối giản — chất liệu cao cấp cho ngày hè",
          ctaText: "Khám phá ngay",
          heroVariant: "minimal-focus",
        },
        styling: { bgPreset: "gradient-brand", textTone: "light", paddingY: "spacious", radius: "2xl" },
      }),
      createSection("CATEGORY_RAIL", {
        data: { title: "Danh mục nổi bật", style: "stories" },
      }),
      createSection("HOT_PRODUCTS", {
        data: { title: "🔥 Sản phẩm bán chạy", maxItems: 8 },
        styling: { bgPreset: "surface", paddingY: "normal" },
      }),
      createSection("REVIEWS", {
        data: { title: "Khách hàng nói gì về shop", subtitle: "100% đánh giá mua thật qua Zalo" },
      }),
      createSection("CONTACT_FOOTER", {
        data: { title: "Chốt Đơn Nhanh — Hỗ Trợ 24/7" },
      }),
    ],
  },
  {
    id: "flash-sale-boost",
    name: "Trang Flash Sale Bùng Nổ",
    subtitle: "Tập trung đếm ngược, mã giảm giá & quà tặng kích thích chốt đơn",
    category: "flash",
    badge: "Tăng Sales 200%",
    description: "Ticker thông báo, Hero Bento bùng nổ, dải Flash Sale đếm ngược, mã Voucher & Vòng quay may mắn.",
    previewGradient: "from-red-600 via-orange-500 to-amber-500",
    build: () => [
      createSection("ANNOUNCEMENT", {
        widthPreset: "FULL_BLEED",
        data: { text: "⚡ ĐẠI TIỆC FLASH SALE — GIẢM TỚI 50% DUY NHẤT HÔM NAY ⚡" },
        styling: { bgPreset: "gradient-amber", textTone: "light", paddingY: "compact" },
      }),
      createSection("HEADER", {
        data: { style: "compact", position: "static", showSearch: true, showCart: true },
      }),
      createSection("HERO", {
        widthPreset: "CONTAINER",
        data: {
          title: "MEGA FLASH SALE 8.8",
          subtitle: "Săn deal giảm 50% + Freeship đơn từ 0Đ",
          ctaText: "Săn deal ngay",
          heroVariant: "bento",
        },
        styling: { bgPreset: "gradient-rose", textTone: "light", paddingY: "spacious", radius: "2xl" },
      }),
      createSection("FLASH_SALE", {
        data: { title: "⚡ GIỜ VÀNG GIÁ SỐC", subtitle: "Số lượng có hạn — Đã bán 89%", maxItems: 6 },
        styling: { bgPreset: "dark", textTone: "light", radius: "2xl" },
      }),
      createSection("COUPONS", {
        data: { title: "Mã giảm giá độc quyền" },
      }),
      createSection("SPIN_WHEEL", {
        data: { title: "Vòng Quay May Mắn 100% Trúng Quà" },
      }),
      createSection("CONTACT_FOOTER", {
        data: { title: "Chốt Đơn Trực Tiếp Qua Zalo" },
      }),
    ],
  },
  {
    id: "tech-bento",
    name: "Công Nghệ & Điện Máy Hiện Đại",
    subtitle: "Giao diện Bento Grid hiện đại, bảng thông số & so sánh tính năng",
    category: "tech",
    badge: "Công Nghệ Pro",
    description: "Hero Split công nghệ, Bento Grid tính năng, danh sách sản phẩm Carousel & FAQ câu hỏi.",
    previewGradient: "from-blue-600 via-indigo-600 to-stone-900",
    build: () => [
      createSection("HEADER", {
        data: { style: "branded", position: "sticky", showSearch: true, showCart: true },
      }),
      createSection("HERO", {
        widthPreset: "CONTAINER",
        data: {
          title: "Zalo Care AI Pro 2026",
          subtitle: "Hệ thống tự động hóa tư vấn & chốt đơn thông minh",
          ctaText: "Trải nghiệm miễn phí",
          heroVariant: "split",
        },
        styling: { bgPreset: "primary", textTone: "light", paddingY: "spacious" },
      }),
      createSection("FEATURE_GRID", {
        data: { title: "Tính năng vượt trội", columns: 4 },
      }),
      createSection("SHORT_VIDEO", {
        data: { title: "Video trải nghiệm thực tế", badge: "DEMO TRỰC TIẾP" },
      }),
      createSection("PRODUCT_CAROUSEL", {
        data: { title: "Sản phẩm công nghệ nổi bật", maxItems: 8 },
      }),
      createSection("FAQ", {
        data: { title: "Câu hỏi thường gặp" },
      }),
      createSection("CONTACT_FOOTER", {
        data: { title: "Hỗ trợ kỹ thuật & Tư vấn Zalo" },
      }),
    ],
  },
  {
    id: "lead-capture",
    name: "Trang Đăng Ký Tư Vấn & Hotline",
    subtitle: "Chuyên thu thập SĐT & thông tin tư vấn dịch vụ nhanh chóng",
    category: "lead",
    badge: "Chuyển Đổi Cao",
    description: "Hero tối giản, Form nhận tư vấn Zalo, dải cam kết uy tín và Đánh giá chứng thực.",
    previewGradient: "from-emerald-600 via-teal-600 to-cyan-600",
    build: () => [
      createSection("HEADER", {
        data: { style: "utility", position: "static", showSearch: false, showCart: false },
      }),
      createSection("HERO", {
        widthPreset: "CONTAINER",
        data: {
          title: "Tư Vấn Giải Pháp Doanh Nghiệp",
          subtitle: "Đội ngũ chuyên gia Zalo hỗ trợ thiết lập hệ thống trong 24H",
          ctaText: "Để lại thông tin",
          heroVariant: "minimal-focus",
        },
        styling: { bgPreset: "gradient-emerald", textTone: "light", paddingY: "spacious" },
      }),
      createSection("LEAD_FORM", {
        data: { title: "Nhận Báo Giá & Dùng Thử Miễn Phí", fields: ["name", "phone", "note"] },
        styling: { bgPreset: "surface", shadow: "lg", radius: "2xl" },
      }),
      createSection("STATS", {
        data: { title: "Thành tựu đạt được" },
      }),
      createSection("REVIEWS", {
        data: { title: "Khách hàng doanh nghiệp tin tưởng" },
      }),
      createSection("CONTACT_FOOTER", {
        data: { title: "Liên hệ tư vấn viên Zalo" },
      }),
    ],
  },
];
