---
name: zalo-admin-ui
description: >
  Design system TailAdmin cho FE_ZALO_V2 — colors, typography, spacing, dark mode, admin shell layout.
  Use when styling components, dashboard grid, sidebar, cards, tables, forms.
  Triggers: design system, màu sắc, typography, giao diện, UI, styling, dark mode, tailadmin, brand color.
  Slash command: /zalo-admin-ui
---

# Zalo Admin UI — Design System (TailAdmin)

## Font

- **Outfit** — `next/font/google` trong `src/app/layout.tsx`
- Body: `className={outfit.className}`

## Color tokens (`globals.css` @theme)

### Primary — Brand

| Shade | Hex | Class |
| ----- | --- | ----- |
| brand-500 | #465fff | `bg-brand-500`, `text-brand-500` |
| brand-600 | #3641f5 | `bg-brand-600` (hover) |
| brand-50 | #ecf3ff | `bg-brand-50` (light bg) |

### Neutral — Gray

| Shade | Dùng cho |
| ----- | -------- |
| gray-50–100 | Background nhạt |
| gray-200–300 | Border |
| gray-500–600 | Text phụ |
| gray-800–900 | Text chính, dark bg |
| gray-dark | #1a2231 — dark sidebar |

### Semantic

| Token | Dùng cho |
| ----- | -------- |
| success-* | Trạng thái thành công, online |
| error-* | Lỗi, disconnect |
| warning-* | Cảnh báo |
| orange-* | Accent, badge |

## Dark mode

```tsx
// Toggle via ThemeContext
document.documentElement.classList.add("dark");

// Card pattern
"rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"

// Text
"text-gray-800 dark:text-white/90"
"text-gray-500 dark:text-gray-400"
```

## Admin shell layout

```
┌──────────┬────────────────────────────────┐
│          │ AppHeader (sticky top)         │
│ AppSide  ├────────────────────────────────┤
│ bar      │                                │
│ 290px /  │ Page content                   │
│ 90px     │ p-4 md:p-6                     │
│          │ max-w-(--breakpoint-2xl)        │
└──────────┴────────────────────────────────┘
```

- Expanded sidebar: `lg:ml-[290px]`
- Collapsed: `lg:ml-[90px]`
- Mobile: `ml-0` + backdrop overlay

## Dashboard grid

```tsx
<div className="grid grid-cols-12 gap-4 md:gap-6">
  <div className="col-span-12 xl:col-span-7">...</div>
  <div className="col-span-12 xl:col-span-5">...</div>
</div>
```

## Component patterns

### Card (ComponentCard)

```
rounded-2xl border border-gray-200 bg-white
Header: px-6 py-5, title text-base font-medium
Body: p-4 sm:p-6 border-t
```

### Stat metrics — gọn, không chiếm diện tích thừa

**Nguyên tắc:** Thống kê số (tổng, hoạt động, đã chọn…) **không** dùng card lớn riêng (`rounded-2xl p-5`, icon 48px, `text-title-sm`). Gộp vào **cùng ComponentCard** với bảng/toolbar — một hàng inline, tối thiểu padding.

```tsx
// Trong body ComponentCard — trên toolbar/bảng
<div className="mb-4 border-b border-gray-100 pb-4 dark:border-gray-800">
  <ZaloAccountsMetrics ... />
</div>
```

**Pattern inline (reference: `ZaloAccountsMetrics.tsx`):**

- Layout: `flex flex-wrap items-center gap-x-3 gap-y-2`
- Icon: `size-4`, màu `text-gray-400`
- Label: `text-theme-xs text-gray-500`
- Số: `text-sm font-semibold tabular-nums` — **không** `text-title-sm` / 30px
- Phân cách: `w-px h-3.5 bg-gray-200` giữa các mục (ẩn trên mobile nếu wrap)
- **Không** grid 4 cột card riêng, **không** `h-12 w-12` icon box

| Tránh | Dùng |
| ----- | ---- |
| 4 card `p-5 md:p-6` riêng một row grid | 1 hàng stat trong card chính |
| Số cỡ title 30px | `text-sm` semibold |
| Icon box 48×48 | Icon 16px cạnh label |

### Quản lý Bạn bè / Nhóm

Gộp **một module** bạn bè + nhóm — **trang con** của quản lý tài khoản, **không** mục sidebar riêng.

- Route: `/zalo-accounts/contacts` (không `/zalo-contacts`)
- Sidebar: chỉ **Quản lý tài khoản Zalo** (`/zalo-accounts`); route con vẫn highlight mục cha
- Breadcrumb contacts: `Home › Quản lý tài khoản Zalo › Quản lý Bạn bè / Nhóm`
- Entry: nút toolbar **Quản lý Bạn bè / Nhóm** → `/zalo-accounts/contacts?accountId=`
- Shell gọn: **không** title/desc trong `ComponentCard` (breadcrumb đủ); `AccountSelect` + tab **Bạn bè | Nhóm**; panel inline; `ContactLabelPanel`, `useScanTaskPoll`
- **Gán nhãn:** UI gọn — bỏ card/mô tả dài; step trail 1 dòng; chọn nhãn 1 hàng; **bảng chọn bạn bè/nhóm `flex-1`** chiếm phần lớn; nút Gán/Gỡ 1 hàng dưới bảng

### Button primary

```
bg-brand-500 hover:bg-brand-600 text-white rounded-lg px-4 py-2.5
```

### Table

```
Header: bg-gray-50 dark:bg-gray-800
Row hover: hover:bg-gray-50 dark:hover:bg-gray-800/50
```

#### Cuộn bên trong table (bắt buộc khi panel inline / nhiều dòng)

**Lỗi 1 — table kéo layout:** Bọc table chỉ `overflow-hidden` → cuộn cả trang.

**Lỗi 2 — 2 scroll:** Vừa `max-h` + `overflow-y-auto` trên table **vừa** nội dung trang cao hơn viewport → scrollbar body **+** scrollbar table.

**Cách đúng — một scroll duy nhất (table):**

1. Trang data dày: `adminDataPageClass` + `ComponentCard fill` + chuỗi `flex min-h-0 flex-1 overflow-hidden`
2. Panel: `adminDataPanelClass` — toolbar `shrink-0`, table `flex-1`
3. Table: `ScrollableTableContainer fill` (không dùng `max-h` calc viewport khi đã có layout fill)

```tsx
import ScrollableTableContainer, {
  adminDataPageClass,
  adminDataPanelClass,
  stickyTableHeaderClass,
} from "@/components/ui/table/ScrollableTableContainer";

<div className={adminDataPageClass}>
  <ComponentCard fill>
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className={adminDataPanelClass}>
        <div className="shrink-0">{/* toolbar */}</div>
        <ScrollableTableContainer fill>
          <Table>
            <TableHeader className={stickyTableHeaderClass}>...</TableHeader>
            <TableBody>...</TableBody>
          </Table>
        </ScrollableTableContainer>
      </div>
    </div>
  </ComponentCard>
</div>
```

- `fill`: table `h-full min-h-0 overflow-y-auto` — lấp phần còn lại, không tính `100vh` lần hai
- `adminDataPageClass`: `h-0 min-h-0 flex-1 overflow-hidden` — **không** chỉ `flex-1` (đẩy scroll body) hay chỉ `calc(100svh)` (lỗi responsive mobile)
- Header sticky: `stickyTableHeaderClass` trên `<thead>`
- **Luôn** `min-h-0` + `min-w-0` trên flex child — nếu thiếu, flex item không co và gây scroll body / tràn ngang

| Tránh | Dùng |
| ----- | ---- |
| `max-h-[calc(100vh-…)]` + layout trang không khóa chiều cao | `adminDataPageClass` + `fill` |
| `h-[calc(100svh-7rem)]` cố định trên shell trang | Flex chain từ `AdminLayout` (`min-h-dvh` → `main flex-1 min-h-0`) |
| Chỉ `overflow-hidden` trên table | `ScrollableTableContainer fill` |
| Flex child không `min-h-0` | `min-h-0 flex-1 overflow-hidden` |
| Toolbar `min-w-[200px]` trên mobile | `w-full min-w-0 sm:min-w-[12.5rem]` |
| 2 scrollbar (body + table) | Một scroll trong table |

#### Responsive — admin shell + trang data

**Lỗi 3 — calc viewport trên mobile:** `h-[calc(100svh-7.25rem)]` không tính header 2 hàng → tràn hoặc table bị cắt.

**Lỗi 4 — chỉ `flex-1` không `h-0`:** Sau khi bỏ calc, child không khóa chiều cao → **scroll cả trang**, table không cuộn.

**Cách đúng — flex chain + `h-0 flex-1`:**

1. `AdminLayout`: shell `h-dvh overflow-hidden`, cột `h-dvh flex flex-col overflow-hidden`, `<main>` `h-0 flex-1 min-h-0 overflow-y-auto`
2. Trang data: `adminDataPageClass` = `h-0 min-h-0 flex-1 flex-col overflow-hidden`
3. Panel/table: `adminDataPanelClass` + `ComponentCard fill` + `ScrollableTableContainer fill` — cùng pattern `h-0 flex-1 min-h-0`
3. Toolbar / tab: `flex-wrap`, `w-full sm:w-auto`, tránh `min-w` cứng dưới `sm`
4. Toast mobile: `top-center` + `mobileOffset` + `!w-[calc(100vw-2rem)]` (xem Toast bên dưới)

### Form input

```
rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900
focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
```

### Custom Select (dropdown form)

- Component: `CustomSelect` — **không** dùng `<select>` native
- Trigger: `h-11`, border `gray-300`, chevron xoay, panel `rounded-xl shadow-theme-lg`
- Item chọn: `bg-brand-50` + check; placeholder `text-gray-400`
- Domain có avatar: `AccountSelect` hoặc `renderOption` / `renderValue`

## Breakpoints

| Token | Value |
| ----- | ----- |
| 2xsm | 375px |
| xsm | 425px |
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |
| 3xl | 2000px |

## Typography scale

| Token | Size |
| ----- | ---- |
| text-theme-xs | 12px |
| text-theme-sm | 14px |
| text-theme-xl | 20px |
| text-title-sm | 30px |
| text-title-md | 36px |

## Icons

SVG trong `src/icons/` — size mặc định 20–24px, màu `currentColor`.

```tsx
import { ChatIcon, GridIcon } from "@/icons/index";
```

## Toast (Sonner)

- Provider: `AppToaster` trong `AppProviders`
- API: `import { toast } from '@/lib/toast'`
- Desktop: `top-right`, `offset` dưới header sticky
- Mobile (`<sm`): `top-center`, `mobileOffset`, toast `w-[calc(100vw-2rem)]` — tránh tràn mép màn hình
- Sync dark/light qua `ThemeContext`

## Tooltip (Radix)

- Component: `src/components/ui/tooltip/Tooltip.tsx`
- Style: nền `gray-900`, text trắng, `text-xs`, `rounded-lg`, arrow
- Dùng cho icon button, action không có label, chú thích ngắn
- **Cấm** `title="..."` HTML trên interactive UI

```tsx
<Tooltip content="Làm mới" side="bottom">
  <button type="button" aria-label="Làm mới" className="cursor-pointer">
    <RefreshIcon />
  </button>
</Tooltip>
```

## Không làm

- Native `<select>` trong form (dùng `CustomSelect`)
- Table dài không bọc `ScrollableTableContainer` (gây scroll layout)
- `max-h` table mà không `adminDataPageClass` + `fill` (gây **2 scroll** body + table)
- Flex layout thiếu `min-h-0` trên vùng table
- Hex random ngoài `@theme`
- Font khác Outfit (trừ khi redesign)
- Phá spacing shell (sidebar 290/90px)
- Emoji thay icon SVG
- `title` HTML cho tooltip UI
- Toast tự viết / `alert()` / `react-toastify`

## Reference

`src/app/globals.css`
`src/layout/AppSidebar.tsx`
`src/components/common/ComponentCard.tsx`
`.agents/skills/skill-tailwind/SKILL.md`