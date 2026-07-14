---
name: zalo-standards
description: >
  Professional coding standards for FE_ZALO_V2 — TypeScript, React/Next.js, Tailwind, ESLint, conventions.
  Use when writing code, reviewing, or ensuring pro quality.
  Triggers: quy chuẩn, standards, convention, best practices, code style, pro, chuẩn code, lint.
  Slash command: /zalo-standards
---

# Zalo Standards — FE_ZALO_V2

## TypeScript

- `strict: true` — không `any`, không `@ts-ignore` trừ khi bắt buộc
- Interface cho props: `interface MyComponentProps { ... }`
- Export type từ `src/types/` cho domain data
- `as const` cho constant objects (API routes, config)

## React / Next.js

- **Server Component** mặc định trong `page.tsx`
- `"use client"` chỉ khi: useState, useEffect, event handler, chart, form tương tác
- Named export cho utility, default export cho page/view chính
- `Metadata` type cho SEO trong page.tsx
- Không fetch API trực tiếp trong component — dùng services + store
- **Không** đưa inline callback vào dependency `useEffect` — dùng `useStableHandler` hoặc store action
- **Một** entry point load data theo route (dedup bằng ref key), UI click chỉ `router.push`

## File naming

| Loại | Convention | Ví dụ |
| ---- | ---------- | ----- |
| Page | `page.tsx` | `app/(admin)/calendar/page.tsx` |
| View | `index.tsx` hoặc `{Name}View.tsx` | `components/zalo-accounts/index.tsx` |
| Store | `use-{domain}-store.ts` | `stores/use-zalo-account-store.ts` |
| Service | `{domain}.service.ts` | `services/zalo-account.service.ts` |
| Types | `{domain}.ts` | `types/zalo-account.ts` |

## Import order

```tsx
// 1. React / Next
import { useState } from "react";
import type { Metadata } from "next";

// 2. Third-party
import dynamic from "next/dynamic";

// 3. Internal — absolute @/
import ComponentCard from "@/components/common/ComponentCard";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";

// 4. Types
import type { ZaloAccount } from "@/types/zalo-account";
```

## Tailwind

- Dùng tokens `brand-*`, `gray-*`, `success-*`, `error-*`
- `twMerge()` khi merge class động (form components)
- Không dynamic class string
- `cursor-pointer` trên clickable elements
- Dark mode: luôn có variant `dark:`

## API layer (khi có)

```
types/ → config/api.ts → services/ → stores/ → component
```

- `import api from '@/lib/axios'` — **chỉ** trong `services/`
- Error message hiển thị → tiếng Việt
- **Refresh token:** interceptor gọi `/api/token/refresh/` khi `isAuthTokenExpiredError()` — không chỉ HTTP 401. Backend ZaloCN có thể trả envelope HTTP 200 `{ success: false, message: "Token has expired" }` (success interceptor `normalizeApiResponse` throw → error interceptor). Dùng `unwrapAuthTokens()` cho response refresh.

## UI text

- Label, button, toast, empty state → **tiếng Việt**
- Comment logic nghiệp vụ → tiếng Việt
- Tên biến/code → tiếng Anh (camelCase)

## Toast (Sonner) — bắt buộc

- **Luôn** dùng `import { toast } from '@/lib/toast'`
- **Không** dùng `alert()`, `react-toastify`, toast Zustand tự viết
- Lỗi API → `handleApiError()` trong `src/lib/errors.ts` (đã tích hợp Sonner)
- Thành công/thông báo → `toast.success()`, `toast.info()`, `toast.warning()`

```ts
import { toast } from "@/lib/toast";
toast.success("Lưu thành công");
toast.error("Không thể lưu");
```

## Tooltip — bắt buộc

- **Luôn** dùng `<Tooltip content="...">` từ `@/components/ui/tooltip/Tooltip`
- **Không** dùng thuộc tính HTML `title=` cho button, icon, chú thích hover
- `TooltipProvider` đã bọc trong `AppProviders` — không bọc lại ở page
- Giữ `aria-label` trên button icon-only (a11y) + Tooltip cho người dùng nhìn thấy

```tsx
import { Tooltip } from "@/components/ui/tooltip/Tooltip";

<Tooltip content="Xóa mục" side="top">
  <button type="button" aria-label="Xóa mục" className="cursor-pointer">
    <TrashIcon />
  </button>
</Tooltip>
```

**Ngoại lệ `title`:** prop `title` của component nội bộ (`ComponentCard`, `Alert`, iframe YouTube…) — không phải HTML tooltip.

## Dropdown / Select — bắt buộc custom

- **Cấm** native `<select>` / `<option>` trong UI dự án
- **Luôn** dùng `CustomSelect` (`src/components/form/CustomSelect.tsx`) hoặc wrapper `Select`
- Select có avatar / layout đặc biệt: `AccountSelect`, hoặc `CustomSelect` + `renderOption` / `renderValue`
- Multi chọn: `MultiSelect` (đã custom)
- Menu header/actions: `Dropdown` + `DropdownItem` — không nhầm với form select

```tsx
import CustomSelect from "@/components/form/CustomSelect";

<CustomSelect
  value={String(id)}
  onChange={(v) => setId(v ? Number(v) : null)}
  placeholder="Chọn mục"
  options={items.map((item) => ({
    value: String(item.id),
    label: item.name,
  }))}
/>
```

Variant `inline-start` / `inline-end` cho `PhoneInput`. Controlled: truyền `value`; uncontrolled: `defaultValue`.

## Git commit (gợi ý)

```
feat(zalo-accounts): thêm trang quản lý tài khoản Zalo
fix(sidebar): sửa active state menu con
style(dashboard): cập nhật màu metric card
```

## Trạng thái tài khoản Zalo (checkpoint)

- **Hoạt động / không hoạt động** (`isZaloAccountActive`, cột Trạng thái TK, metric Đang hoạt động): **chỉ** `checkpoint === false`
- **Không** gộp `proxy.status` vào logic checkpoint
- Cột **Trạng thái proxy** vẫn dùng `getZaloProxyStatus` riêng

## Pre-commit checklist

```
□ npm run lint PASS
□ npm run build PASS
□ Không console.log debug
□ Không file thừa / dead code
□ Chỉ sửa file liên quan task
```

## Không làm

- Native `<select>` cho form UI
- `any` type
- Emoji làm icon UI
- Hardcode API URL trong component
- Sửa `globals.css` tokens không liên quan
- Refactor ngoài phạm vi task

## Reference

`.agents/AGENTS.md`
`.agents/skills/skill-code-review/SKILL.md`
`tsconfig.json`
`eslint.config.mjs`