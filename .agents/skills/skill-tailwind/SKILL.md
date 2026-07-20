---
name: skill-tailwind
description: Quy ước Tailwind CSS và UI tokens cho FE_ZALO_V2 (TailAdmin). Dùng khi chỉnh layout admin, màu brand, responsive, dark mode.
---

# Skill: Tailwind & UI (FE_ZALO_V2)

## Setup

| File | Vai trò |
| ---- | ------- |
| `src/app/globals.css` | `@theme` tokens, dark variant, custom utilities |
| `tailwind-merge` | Dùng trong form components (`twMerge`) |

**Tailwind v4 CSS-first** — thêm token mới vào `@theme { }` trong `globals.css`.

## Design tokens (bắt buộc)

| Token | Class ví dụ | Mục đích |
| ----- | ----------- | -------- |
| brand-500 | `bg-brand-500`, `text-brand-500` | Primary action, link |
| brand-600 | `bg-brand-600` | Hover primary |
| gray-50–950 | `bg-gray-100`, `text-gray-700` | Surface, text |
| gray-dark | `dark:bg-gray-dark` | Dark sidebar |
| success-* | `text-success-500` | Trạng thái OK |
| error-* | `text-error-500` | Lỗi, cảnh báo |
| warning-* | `text-warning-500` | Cảnh báo nhẹ |
| orange-* | `bg-orange-500` | Accent phụ |

Font: **Plus Jakarta Sans** — set trong `layout.tsx`, class `font-jakarta` qua body.

## Dark mode

- Variant: `@custom-variant dark (&:is(.dark *));`
- Toggle: `ThemeContext` → class `dark` trên `<html>`
- Pattern card: `bg-white dark:bg-white/[0.03] dark:border-gray-800`

## Layout admin shell

```tsx
// AdminLayout — margin theo sidebar
isExpanded || isHovered → lg:ml-[290px]
collapsed            → lg:ml-[90px]
mobile open          → ml-0

// Shell — khóa viewport, tránh scroll body trên trang data
outer: h-dvh overflow-hidden
main column: flex h-dvh min-w-0 flex-1 flex-col overflow-hidden
<main>: flex h-0 min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto

// Trang data dày — bắt buộc h-0 flex-1 (không chỉ flex-1, không chỉ calc 100svh)
adminDataPageClass → flex h-0 min-h-0 flex-1 flex-col overflow-hidden
adminDataPanelClass / ComponentCard fill → cùng pattern h-0 flex-1 min-h-0
```

**Responsive checklist**

- Flex child trong toolbar/table shell: thêm `min-w-0`
- `min-w-[…]` chỉ từ `sm:` trở lên; mobile dùng `w-full min-w-0`
- Tab/button group mobile: `flex w-full` + `flex-1` từng nút; `sm:inline-flex sm:w-auto`

## Card chuẩn TailAdmin

```tsx
className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
```

## Grid dashboard

```tsx
className="grid grid-cols-12 gap-4 md:gap-6"
// col-span-12 xl:col-span-7 / xl:col-span-5
```

## Responsive — test tại

375px · 768px · 1024px · 1280px · 1536px

Breakpoints custom: `2xsm:375px`, `xsm:425px`, `3xl:2000px`

## Thứ tự ưu tiên styling

1. Token có sẵn trong `globals.css` (`brand-*`, `gray-*`)
2. Tailwind utility trên JSX
3. `globals.css` — chỉ khi cần animation/utility mới

## Không làm

- Hardcode hex ngoài tokens (trừ khi thêm vào `@theme`)
- Dynamic Tailwind: `` `text-${color}-500` ``
- Bỏ `cursor-pointer` trên clickable
- Phá layout shell sidebar/header
- Override font ngoài Plus Jakarta Sans trừ khi có lý do

## Reference

`src/app/globals.css`
`.grok/skills/zalo-admin-ui/SKILL.md`