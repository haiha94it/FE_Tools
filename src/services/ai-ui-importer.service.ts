/**
 * AI UI Importer Service — Chuyển đổi Ảnh Screenshot / HTML thành mảng khối LayoutSection.
 * Sử dụng Google Gemini REST API với cơ chế tự động khám phá Model (Dynamic Model Discovery).
 */

import { createSection } from "@/lib/shop-layout-canvas";
import type { LayoutSection } from "@/types/shop-layout-canvas";

const FALLBACK_MODELS = [
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro-latest",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

export const getStoredApiKey = (): string => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("gemini_api_key") ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ""
  );
};

export const setStoredApiKey = (key: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("gemini_api_key", key.trim());
  }
};

const SYSTEM_PROMPT = `
Bạn là Chuyên gia Kiến trúc sư UI/UX AI cao cấp cho hệ thống Zalo Storefront Page Builder.
Nhiệm vụ: Phân tích ảnh chụp màn hình UI hoặc mã HTML và tái tạo lại toàn bộ giao diện từ trên xuống dưới BÁM SÁT MẪU GỐC 95%+ bằng cách bóc tách chính xác từng chi tiết chữ, danh sách phần tử, màu sắc, bố cục, khoảng cách và loại khối.

QUY TẮC BÓC TÁCH CHI TIẾT (ULTRA-HIGH FIDELITY & TOÀN DIỆN):
1. TRÍCH XUẤT CHÍNH XÁC NỘI DUNG VĂN BẢN & DANH SÁCH THÀNH PHẦN (ITEM ARRAYS):
   - Rút đúng từng từ của Tiêu đề (title), Tiêu đề phụ (subtitle), Nút bấm (ctaText / buttonText), Badge nhãn dán, Giá tiền, Phần trăm giảm giá.
   - Trích xuất ĐẦY ĐỦ các mảng phần tử con nếu khối chứa danh sách:
     * FEATURE_GRID: Bóc tách danh sách các ô tính năng { title, desc, iconName }.
     * REVIEWS: Bóc tách danh sách nhận xét { name, comment, rating: 5, avatar }.
     * COUPONS: Bóc tách danh sách mã giảm giá { code, discount, desc, minOrder }.
     * FAQ: Bóc tách danh sách câu hỏi { q, a }.
     * STATS: Bóc tách danh sách con số { label, value }.
     * LEAD_FORM: Bóc tách danh sách các trường nhập { fields: ["name", "phone", "note"], buttonText, successMessage }.
     * SPIN_WHEEL: Bóc tách danh sách phần thưởng { prizes: [{ label: "...", code: "..." }] }.

2. TRÍCH XUẤT MÀU SẮC GỐC & STYLING TOKENS:
   - Phân tích màu nền gốc của khối:
     * Nền tối/đen/xám sẫm -> styling.bgPreset = "dark" hoặc textTone = "light"
     * Nền xám nhạt/trắng -> styling.bgPreset = "surface"
     * Nền chuyển màu Red/Rose -> styling.bgPreset = "gradient-rose"
     * Nền chuyển màu Cam/Amber -> styling.bgPreset = "gradient-amber"
     * Nền chuyển màu Xanh lá/Ngọc -> styling.bgPreset = "gradient-emerald"
     * Nền Xanh dương/Brand -> styling.bgPreset = "gradient-brand"
     * Nếu có mã màu HEX cụ thể -> styling.bgPreset = "custom", styling.customBg = "#HEX"
   - Phân tích độ rộng khối (widthPreset): "FULL_BLEED" (tràn viền) hoặc "CONTAINER" (có lề).
   - Phân tích bo góc & phủ bóng & khoảng đệm: radius ("2xl"|"xl"), shadow ("lg"|"xl"), paddingY ("spacious"|"normal"), marginY ("normal"|"compact").

3. LOẠI KHỐI & BIẾN THỂ (BLOCK TYPES & VARIANTS):
   - "ANNOUNCEMENT": Ticker chạy chữ khuyến mãi ở đầu trang.
   - "HEADER": Thanh logo, tìm kiếm, giỏ hàng (data: { style: "island"|"branded"|"compact" }).
   - "HERO": Khối Banner mở đầu chính. (heroVariant: "split"|"banner"|"bento"|"minimal-focus").
   - "CATEGORY_RAIL": Danh sách danh mục (style: "grid"|"stories").
   - "HOT_PRODUCTS": Lưới sản phẩm (title, maxItems).
   - "FLASH_SALE": Khối giảm giá giờ vàng (title, subtitle, maxItems).
   - "FEATURE_GRID": Lưới icon tính năng/cam kết (title, columns: 2|3|4, items: [{ title, desc }]).
   - "REVIEWS": Đánh giá khách hàng.
   - "COUPONS": Mã giảm giá.
   - "SPIN_WHEEL": Vòng quay may mắn.
   - "LEAD_FORM": Form đăng ký nhận tư vấn SĐT Zalo.
   - "SHORT_VIDEO": Video ngắn review 9:16.
   - "FAQ": Hỏi đáp thường gặp.
   - "STATS": Thống kê con số.
   - "CUSTOM_HTML": DÀNH CHO CÁC KHỐI UI PHỨC TẠP KHOẢNG CÁCH / BỐ CỤC ĐẶC THÙ. Hãy sinh ra mã Tailwind CSS v4 chuẩn hóa trong data.htmlContent để dựng lại CHÍNH XÁC 100% giao diện trong ảnh.

BẮT BUỘC TRẢ VỀ DUY NHẤT MỘT MẢNG JSON HỢP LỆ THEO ĐỊNH DẠNG:
[
  {
    "type": "HERO",
    "widthPreset": "CONTAINER",
    "data": {
      "title": "...",
      "subtitle": "...",
      "ctaText": "...",
      "heroVariant": "split"
    },
    "styling": {
      "bgPreset": "gradient-brand",
      "textTone": "light",
      "paddingY": "spacious",
      "radius": "2xl",
      "shadow": "xl"
    }
  }
]
Không kèm bất kỳ văn bản giải thích nào ngoài mảng JSON.
`;

export interface ParsedAiResult {
  success: boolean;
  sections: LayoutSection[];
  error?: string;
}

/**
 * Tự động truy vấn danh sách Model đang hoạt động từ Google AI Studio đối với API Key này
 */
async function discoverAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    const res = await fetch(url);
    if (!res.ok) return FALLBACK_MODELS;

    const data = await res.json();
    const rawModels = data.models || [];

    const activeModels = rawModels
      .filter((m: any) =>
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes("generateContent")
      )
      .map((m: any) => String(m.name).replace(/^models\//, ""));

    if (activeModels.length === 0) return FALLBACK_MODELS;

    // Ưu tiên các model flash -> latest -> pro
    const prioritized = activeModels.sort((a: string, b: string) => {
      if (a.includes("flash") && !b.includes("flash")) return -1;
      if (!a.includes("flash") && b.includes("flash")) return 1;
      return 0;
    });

    return prioritized;
  } catch {
    return FALLBACK_MODELS;
  }
}

/**
 * Phân tích ảnh Screenshot UI qua Gemini Vision API (Khám phá Model động)
 */
export async function parseScreenshotWithAi(
  base64Image: string,
  apiKey: string,
): Promise<ParsedAiResult> {
  if (!apiKey) {
    return { success: false, sections: [], error: "Vui lòng nhập Gemini API Key!" };
  }

  const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const candidateModels = await discoverAvailableModels(apiKey);
  let lastErrorMsg = "";

  for (const modelName of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastErrorMsg = errData.error?.message || `Model ${modelName} lỗi (${response.status})`;
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

      const parsedJson = JSON.parse(rawText);
      if (!Array.isArray(parsedJson)) {
        throw new Error("AI không trả về cấu trúc mảng khối hợp lệ!");
      }

      const sections: LayoutSection[] = parsedJson.map((item: Record<string, unknown>) => {
        const type = (item.type as string) || "TEXT_BLOCK";
        const customData = (item.data as Record<string, unknown>) || {};
        const customStyling = (item.styling as Record<string, unknown>) || {};

        return createSection(type as any, {
          widthPreset: (item.widthPreset as any) || "CONTAINER",
          data: customData,
          styling: customStyling as any,
        });
      });

      return { success: true, sections };
    } catch (err: any) {
      lastErrorMsg = err.message || "Không thể phân tích giao diện ảnh!";
    }
  }

  return {
    success: false,
    sections: [],
    error: lastErrorMsg || "Không thể kết nối Gemini API. Vui lòng kiểm tra lại API Key!",
  };
}

/**
 * Phân tích đoạn code HTML / Web content qua Gemini Text API (Khám phá Model động)
 */
export async function parseHtmlContentWithAi(
  htmlOrText: string,
  apiKey: string,
): Promise<ParsedAiResult> {
  if (!apiKey) {
    return { success: false, sections: [], error: "Vui lòng nhập Gemini API Key!" };
  }

  const candidateModels = await discoverAvailableModels(apiKey);
  let lastErrorMsg = "";

  for (const modelName of candidateModels) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey.trim()}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: SYSTEM_PROMPT },
                { text: `Nội dung mã HTML / Văn bản UI cần phân tích:\n${htmlOrText}` },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.2,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        lastErrorMsg = errData.error?.message || `Model ${modelName} lỗi (${response.status})`;
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";

      const parsedJson = JSON.parse(rawText);
      if (!Array.isArray(parsedJson)) {
        throw new Error("AI không trả về mảng khối hợp lệ!");
      }

      const sections: LayoutSection[] = parsedJson.map((item: Record<string, unknown>) => {
        const type = (item.type as string) || "TEXT_BLOCK";
        const customData = (item.data as Record<string, unknown>) || {};
        const customStyling = (item.styling as Record<string, unknown>) || {};

        return createSection(type as any, {
          widthPreset: (item.widthPreset as any) || "CONTAINER",
          data: customData,
          styling: customStyling as any,
        });
      });

      return { success: true, sections };
    } catch (err: any) {
      lastErrorMsg = err.message || "Không thể phân tích nội dung HTML!";
    }
  }

  return {
    success: false,
    sections: [],
    error: lastErrorMsg || "Không thể kết nối Gemini API. Vui lòng kiểm tra lại API Key!",
  };
}
