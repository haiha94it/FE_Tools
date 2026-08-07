/**
 * Layout form kịch bản campaign.
 * Mobile/tablet (max-lg): 1 cột, cuộn dọc — list nhóm/bạn có min-height, không chia 50/50.
 * Desktop (lg+): 2 cột cố định trong khung modal.
 */

export const campaignFormModalPanelClass = {
  md: "box-border flex h-auto max-h-[calc(100dvh-1rem)] w-full min-w-0 flex-col sm:max-w-3xl lg:max-w-4xl lg:max-h-[min(760px,calc(100dvh-2rem))]",
  lg: "box-border flex h-auto max-h-[calc(100dvh-1rem)] w-full min-w-0 flex-col sm:max-w-4xl lg:max-w-5xl lg:max-h-[min(820px,calc(100dvh-2rem))]",
  xl: "box-border flex h-auto max-h-[calc(100dvh-1rem)] w-full min-w-0 flex-col sm:max-w-4xl lg:max-w-5xl lg:max-h-[min(860px,calc(100dvh-2rem))]",
} as const;

/** Mobile wizard: chiều cao cố định (iOS flex+max-h không đủ → list không scroll) */
export const campaignFormModalPanelClassWizard =
  "box-border flex h-auto max-h-[calc(100dvh-0.75rem)] w-full min-w-0 max-w-full flex-col sm:max-w-6xl";

export const campaignFormBodyClass =
  "box-border flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden p-2.5 sm:p-5 lg:p-6";

/** Vùng nội dung cuộn trên mobile; desktop nhường scroll cho pane con */
export const campaignFormMainClass =
  "custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain max-lg:pb-1 lg:overflow-hidden";

/** Grid 2 cột desktop; mobile xếp dọc auto height (không 50/50) */
export const campaignFormGridWideClass =
  "grid gap-4 max-lg:grid-cols-1 max-lg:auto-rows-auto lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[1.4fr_1fr] lg:grid-rows-1 lg:overflow-hidden";

export const campaignFormGridEqualClass =
  "grid gap-4 max-lg:grid-cols-1 max-lg:auto-rows-auto lg:h-full lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1 lg:overflow-hidden";

/** Cột trái form — mobile flow; desktop scroll riêng */
export const campaignFormScrollPaneClass =
  "custom-scrollbar min-w-0 max-lg:overflow-visible lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1";

/** Cột phải chọn nick/nhóm/bạn */
export const campaignFormSidePaneClass =
  "flex min-w-0 flex-col gap-3 max-lg:overflow-visible lg:min-h-0 lg:flex-1 lg:overflow-hidden";

export const campaignFormAccountPaneClass =
  "flex min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 p-3 dark:border-gray-700 max-lg:min-h-[160px] lg:min-h-0";

/** Panel list chọn (nhóm / bạn) — desktop flex-1; wizard mobile dùng class riêng full step */
export const campaignFormSelectionPanelClass =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02] max-lg:h-[min(42dvh,300px)] max-lg:shrink-0 lg:min-h-0 lg:flex-1";

/**
 * Panel wizard step list — full chiều cao vùng step.
 * List scroll: max-height tường minh (calc) — iOS tin cậy hơn flex-only.
 */
export const campaignFormWizardSelectionPanelClass =
  "box-border flex h-full min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.02]";

/** Vùng list trong panel wizard — height tường minh, overflow-y auto (iOS) */
export const campaignFormWizardListScrollClass =
  "custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-1";

/**
 * Chrome gọn (title + stepper nhỏ + footer 1 hàng ~12.5rem).
 * List nhóm/bạn chiếm phần lớn màn hình.
 */
export const CAMPAIGN_WIZARD_LIST_MAX_HEIGHT = "calc(100dvh - 12.5rem)";

export const campaignFormFooterClass =
  "mt-3 flex shrink-0 flex-col-reverse gap-2 border-t border-gray-100 pt-3 dark:border-gray-800 sm:mt-4 sm:flex-row sm:justify-end sm:gap-2 sm:pt-4";
