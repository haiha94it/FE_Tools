---
name: skill-performance
description: Tối ưu performance FE_ZALO_V2 — lazy load chart, bundle, sidebar transition, Zustand selective subscription.
---

# Skill: Performance (FE_ZALO_V2)

## Bắt buộc

- Chart nặng (ApexCharts) → `next/dynamic` nếu below-fold
- Ảnh → `next/image` + width/height
- Icon → import từ `src/icons/index` (tree-shake SVG)
- Sidebar transition → giữ `duration-300 ease-in-out`, tránh reflow thừa

## Dynamic import chart

```tsx
import dynamic from "next/dynamic";

const MonthlySalesChart = dynamic(
  () => import("@/components/ecommerce/MonthlySalesChart"),
  { ssr: false, loading: () => <div className="h-80 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" /> },
);
```

## ApexCharts

- `react-apexcharts` chỉ render client-side (`ssr: false`)
- Một chart per component — không mount nhiều chart ẩn
- Destroy chart khi unmount (ApexCharts tự xử lý qua React wrapper)

## Admin shell

- Sidebar margin: class toggle, không đo DOM width
- Mobile backdrop: `Backdrop` component có sẵn
- Tránh `backdrop-blur` trên shell nếu gây lag scroll

## Zustand (khi có store)

```ts
const accounts = useZaloAccountStore((s) => s.accounts);
```

## Tránh fetch API lặp do re-render

1. **Stable handlers** — `src/hooks/use-stable-handler.ts` cho debounce search, scroll load more, WS listener deps
2. **Store owns fetch** — component không `useEffect([filter, search])` song song với handler onChange
3. **WS subscribe once** — `useWebSocketStore.getState()` / `useZaloMessengerStore.getState()` trong callback, không deps `accounts` hay `messages`
4. **Request dedup** — in-flight Map theo `accountId|page|filter|search` trước khi `set({ isLoading: true })`

Chi tiết messenger: `.grok/skills/zalo-messenger/SKILL.md`

## Flatpickr / Calendar

- CSS import một lần trong `layout.tsx`: `flatpickr/dist/flatpickr.css`
- Calendar component đã client-only

## Không làm

- Import toàn bộ `apexcharts` ở layout root
- Subscribe toàn Zustand store
- Animation width trên sidebar (dùng margin/transform có sẵn)

## Reference

`.agents/skills/skill-components/SKILL.md`
`src/app/(admin)/layout.tsx`