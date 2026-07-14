---
name: skill-components
description: Tạo/sửa UI component FE_ZALO_V2 — trang admin, form, table, chart, modal. Kích hoạt khi thêm trang Zalo, sửa sidebar content, form, bảng dữ liệu.
---

# Skill: Components (FE_ZALO_V2)

## Khi nào dùng

- Thêm trang admin mới (tài khoản Zalo, tin nhắn, nhóm…)
- Sửa form, table, chart, modal
- Tạo widget dashboard (metrics, recent orders…)
- Scaffold auth pages (`signin`, `signup`)

## Trước khi code

1. Xác định loại component:

| Loại | Thư mục | Client? |
| ---- | ------- | ------- |
| Trang admin | `components/{feature}/` | Thường Client |
| Widget dashboard | `components/ecommerce/` hoặc `components/{feature}/` | Client (chart) |
| Form primitive | `components/form/` | Client |
| Table | `components/tables/` | Client |
| Layout shell | `layout/` | Client |
| Auth | `components/auth/` | Client |

2. Mở file tương tự làm mẫu:
   - Dashboard: `components/ecommerce/EcommerceMetrics.tsx`
   - Table: `components/tables/BasicTableOne.tsx`
   - Form: `components/form/Form.tsx`
   - Modal: `components/example/ModalExample/DefaultModal.tsx`

3. Kiểm tra route group đúng:
   - Admin có sidebar: `src/app/(admin)/`
   - Auth full-width: `src/app/(full-width-pages)/(auth)/`

## Cấu trúc feature mới

```
src/components/zalo-accounts/
├── index.tsx              # View chính (export default)
├── ZaloAccountTable.tsx   # Bảng con
└── zaloAccountUtils.ts    # Pure helpers

src/app/(admin)/(others-pages)/zalo-accounts/page.tsx  # Page mỏng
```

## Template page admin

```tsx
import type { Metadata } from "next";
import ZaloAccountsView from "@/components/zalo-accounts";

export const metadata: Metadata = {
  title: "Tài khoản Zalo | Zalo Admin",
  description: "Quản lý tài khoản Zalo",
};

export default function ZaloAccountsPage() {
  return <ZaloAccountsView />;
}
```

## Template view component

```tsx
"use client";

import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";

export default function ZaloAccountsView() {
  return (
    <div>
      <PageBreadCrumb pageTitle="Tài khoản Zalo" />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12">
          <ComponentCard title="Danh sách tài khoản" desc="Quản lý tài khoản Zalo đã kết nối">
            {/* Nội dung */}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
```

## Grid dashboard (TailAdmin)

```tsx
<div className="grid grid-cols-12 gap-4 md:gap-6">
  <div className="col-span-12 space-y-6 xl:col-span-7">{/* Cột trái */}</div>
  <div className="col-span-12 xl:col-span-5">{/* Cột phải */}</div>
  <div className="col-span-12">{/* Full width */}</div>
</div>
```

## Ngôn ngữ UI

- Label, tiêu đề, mô tả → **tiếng Việt**
- Không hardcode tiếng Anh cho người dùng cuối
- Metadata `title`/`description` → tiếng Việt

## Component có sẵn — tái sử dụng

| Component | Path | Dùng cho |
| --------- | ---- | -------- |
| ComponentCard | `components/common/ComponentCard` | Khối nội dung có header |
| PageBreadCrumb | `components/common/PageBreadCrumb` | Tiêu đề trang |
| Tooltip | `components/ui/tooltip/Tooltip` | Chú thích hover button/icon |
| toast | `lib/toast.ts` (Sonner) | Thông báo success/error |
| BasicTableOne | `components/tables/BasicTableOne` | Bảng mẫu |
| Pagination | `components/tables/Pagination` | Phân trang |
| Form, Select, Label | `components/form/` | Form input |
| LineChartOne, BarChartOne | `components/charts/` | Biểu đồ ApexCharts |

## Toast & Tooltip — quy tắc

- Toast: `toast.success()` / `toast.error()` — **không** `alert()`
- Tooltip: bọc `<Tooltip content="...">` — **không** `title` HTML
- Button chỉ icon: `aria-label` + `Tooltip` cùng nội dung

## Bảng dữ liệu — loading sau xóa/sửa

**Không** dùng `if (loading) return <p>Đang tải...</p>` — sẽ làm cả bảng biến mất mỗi lần mutation.

```tsx
// ✅ Chỉ full loading lần đầu (chưa có dòng)
if (loading && rows.length === 0) {
  return <p className="py-16 text-center">Đang tải...</p>;
}

// ✅ Đã có dữ liệu — giữ bảng, spinner nhỏ phía trên (nếu cần)
return (
  <>
    {loading && rows.length > 0 ? <SmallSpinner /> : null}
    <Table>{/* rows */}</Table>
  </>
);
```

Store: xóa → patch local; sửa/copy → `fetch({ silent: true })`. Chi tiết: `.agents/skills/skill-api-zustand/SKILL.md`.

## Icons

```tsx
import { GridIcon, ChatIcon } from "@/icons/index";
```

SVG icons trong `src/icons/` — không dùng emoji làm icon UI.

## Client vs Server

- `page.tsx` → Server Component (metadata)
- Chart, form, modal, dropdown → `"use client"`
- Không bọc toàn page client nếu chỉ một phần cần tương tác

## Reference

`.grok/skills/zalo-admin-ui/SKILL.md`
`.grok/skills/add-admin-page/SKILL.md`
`.agents/skills/skill-admin-dashboard/SKILL.md`