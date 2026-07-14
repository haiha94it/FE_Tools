export const campaignFormModalPanelClass = {
  md: "h-[min(760px,calc(100dvh-2rem))] max-w-5xl",
  lg: "h-[min(820px,calc(100dvh-2rem))] max-w-6xl",
  xl: "h-[min(860px,calc(100dvh-2rem))] max-w-6xl",
} as const;

export const campaignFormBodyClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden p-5 sm:p-6";

export const campaignFormMainClass =
  "flex min-h-0 flex-1 flex-col overflow-hidden";

export const campaignFormGridWideClass =
  "grid h-full min-h-0 flex-1 gap-4 overflow-hidden max-lg:grid-cols-1 max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[1.4fr_1fr] lg:grid-rows-1";

export const campaignFormGridEqualClass =
  "grid h-full min-h-0 flex-1 gap-4 overflow-hidden max-lg:grid-cols-1 max-lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-1";

export const campaignFormScrollPaneClass =
  "custom-scrollbar min-h-0 overflow-y-auto overscroll-contain pr-1 max-lg:min-h-[200px]";

export const campaignFormSidePaneClass =
  "flex min-h-0 flex-col overflow-hidden max-lg:min-h-[200px]";

export const campaignFormAccountPaneClass =
  "flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 p-3 dark:border-gray-700 max-lg:min-h-[200px]";