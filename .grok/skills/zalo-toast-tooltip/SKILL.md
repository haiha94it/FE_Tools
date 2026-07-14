---
name: zalo-toast-tooltip
description: >
  Toast Sonner và Tooltip Radix cho FE_ZALO_V2.
  Use when thêm thông báo, toast, hint hover, chú thích button/icon, hoặc review UI feedback.
  Triggers: toast, sonner, tooltip, title, chú thích, hint, thông báo, notification.
  Slash command: /zalo-toast-tooltip
---

# Toast & Tooltip — FE_ZALO_V2

## Toast — Sonner

| File | Vai trò |
| ---- | ------- |
| `src/lib/toast.ts` | API `toast.success/error/info/warning` |
| `src/components/common/AppToaster.tsx` | `<Toaster />` global — desktop `top-right`, mobile `top-center` + offset |
| `src/lib/errors.ts` | `handleApiError()` → toast lỗi |

```ts
import { toast } from "@/lib/toast";

toast.success("Đã lưu");
toast.error("Lưu thất bại");
```

**Cấm:** `alert()`, `react-toastify`, Zustand toast tự viết.

**Responsive:** Dùng `useMediaQuery('(max-width: 639px)')` — mobile `top-center`, `mobileOffset`, class toast `!w-[calc(100vw-2rem)]`; desktop `top-right` + `offset` top ~4.5rem (dưới header).

## Tooltip — Radix

| File | Vai trò |
| ---- | ------- |
| `src/components/ui/tooltip/Tooltip.tsx` | `<Tooltip>`, `<TooltipProvider>` |
| `src/components/providers/app-providers.tsx` | `TooltipProvider` bọc app |

```tsx
import { Tooltip } from "@/components/ui/tooltip/Tooltip";

<Tooltip content="Xuất file" side="bottom">
  <button type="button" aria-label="Xuất file" className="cursor-pointer">
    <DownloadIcon />
  </button>
</Tooltip>
```

**Cấm:** `title="..."` HTML trên button, icon, link có chú thích.

**Cho phép `title`:** prop component (`ComponentCard title=`), iframe, SEO metadata.

## Checklist khi thêm UI mới

```
□ Feedback người dùng → toast từ @/lib/toast
□ Lỗi API → handleApiError() hoặc getApiErrorMessage()
□ Icon button / action không chữ → Tooltip + aria-label
□ Không title HTML cho hover hint
```

## Reference

`.grok/skills/zalo-standards/SKILL.md`
`.grok/skills/zalo-admin-ui/SKILL.md`