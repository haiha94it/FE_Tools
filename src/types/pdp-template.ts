/** PDP architectural templates — FE-owned, stored in shop personalization JSON */
export type PDPTemplateType =
  | "bento-tech"
  | "dense-deal"
  | "editorial-story"
  | "minimal-gallery";

export type PDPGalleryPosition = "left" | "right" | "top-full" | "grid-mosaic";
export type PDPGalleryAspect = "square" | "portrait" | "wide";
export type PDPBuyPanelStyle = "sticky-card" | "minimal-clean" | "sidebar-fixed";
export type PDPTabsLayout = "accordion" | "horizontal-tabs" | "stacked-sections";

export interface PDPConfig {
  templateId: PDPTemplateType;
  galleryPosition: PDPGalleryPosition;
  galleryAspect: PDPGalleryAspect;
  buyPanelStyle: PDPBuyPanelStyle;
  showCountdownTimer: boolean;
  showStockProgressBar: boolean;
  tabsLayout: PDPTabsLayout;
}

export const PDP_TEMPLATE_IDS: PDPTemplateType[] = [
  "bento-tech",
  "dense-deal",
  "editorial-story",
  "minimal-gallery",
];

export const PDP_TEMPLATE_PRESETS: {
  id: PDPTemplateType;
  name: string;
  description: string;
  inspiredBy: string;
  config: PDPConfig;
}[] = [
  {
    id: "bento-tech",
    name: "Bento Tech PDP",
    description:
      "2 cột 55/45 · gallery sticky · buy panel card · tabs ngang · premium electronics",
    inspiredBy: "Apple / Premium Electronics",
    config: {
      templateId: "bento-tech",
      galleryPosition: "left",
      galleryAspect: "portrait",
      buyPanelStyle: "sticky-card",
      showCountdownTimer: false,
      showStockProgressBar: true,
      tabsLayout: "horizontal-tabs",
    },
  },
  {
    id: "dense-deal",
    name: "Dense Deal PDP",
    description:
      "Banner flash full-width · countdown · stock bar · voucher · typography compact",
    inspiredBy: "Amazon / Shopee Flash",
    config: {
      templateId: "dense-deal",
      galleryPosition: "left",
      galleryAspect: "square",
      buyPanelStyle: "sticky-card",
      showCountdownTimer: true,
      showStockProgressBar: true,
      tabsLayout: "horizontal-tabs",
    },
  },
  {
    id: "editorial-story",
    name: "Editorial Story PDP",
    description:
      "Ảnh dọc stack full · buy panel float cố định · headline serif · luxury fashion",
    inspiredBy: "Nike / Zara Luxury",
    config: {
      templateId: "editorial-story",
      galleryPosition: "left",
      galleryAspect: "portrait",
      buyPanelStyle: "sidebar-fixed",
      showCountdownTimer: false,
      showStockProgressBar: false,
      tabsLayout: "stacked-sections",
    },
  },
  {
    id: "minimal-gallery",
    name: "Minimal Gallery PDP",
    description:
      "Grid 2×2 trên · info centered dưới · accordion specs · MUJI clean",
    inspiredBy: "MUJI / Minimal",
    config: {
      templateId: "minimal-gallery",
      galleryPosition: "top-full",
      galleryAspect: "square",
      buyPanelStyle: "minimal-clean",
      showCountdownTimer: false,
      showStockProgressBar: false,
      tabsLayout: "accordion",
    },
  },
];

export function resolvePDPConfig(
  templateId?: string | null,
): PDPConfig {
  const found = PDP_TEMPLATE_PRESETS.find((p) => p.id === templateId);
  return found?.config ?? PDP_TEMPLATE_PRESETS[0].config;
}
