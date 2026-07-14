---
name: add-admin-page
description: >
  Thêm trang admin mới vào FE_ZALO_V2 (TailAdmin). Scaffold route, component, sidebar nav.
  Use when adding a new admin page, module, or menu item.
  Triggers: thêm trang, new page, trang admin mới, thêm menu, sidebar, route mới, module zalo.
  Slash command: /add-admin-page
---

# Add Admin Page — FE_ZALO_V2

## Input cần từ user

- Tên trang (tiếng Việt): ví dụ "Tài khoản Zalo"
- Route path: ví dụ `/zalo-accounts`
- Loại: dashboard widget | table list | form | chart | blank

## Steps

### 1. Tạo view component

```
src/components/{feature-name}/index.tsx
```

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
          <ComponentCard title="Danh sách" desc="Mô tả ngắn">
            {/* Content */}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}
```

### 2. Tạo page route

```
src/app/(admin)/(others-pages)/{route}/page.tsx
```

```tsx
import type { Metadata } from "next";
import ZaloAccountsView from "@/components/zalo-accounts";

export const metadata: Metadata = {
  title: "Tài khoản Zalo | Zalo Admin",
  description: "Quản lý tài khoản Zalo đã kết nối",
};

export default function ZaloAccountsPage() {
  return <ZaloAccountsView />;
}
```

> Route group `(others-pages)` không xuất hiện trong URL. File tại `zalo-accounts/page.tsx` → URL `/zalo-accounts`.

### 3. Cập nhật sidebar

File: `src/layout/AppSidebar.tsx`

Thêm vào `navItems` hoặc `othersItems`:

```typescript
{
  icon: <ChatIcon />,
  name: "Tài khoản Zalo",
  path: "/zalo-accounts",
},
```

Hoặc submenu:

```typescript
{
  icon: <ChatIcon />,
  name: "Zalo",
  subItems: [
    { name: "Tài khoản", path: "/zalo-accounts", pro: false },
    { name: "Tin nhắn", path: "/zalo-messages", pro: false },
  ],
},
```

### 4. Verify

```bash
npm run lint
npm run build
```

Mở `http://localhost:3000/{route}` — kiểm tra sidebar active state, dark mode.

## Loại trang — template nhanh

| Loại | Mẫu tham khảo |
| ---- | ------------- |
| Table list | `app/(admin)/(others-pages)/(tables)/basic-tables/page.tsx` |
| Form | `app/(admin)/(others-pages)/(forms)/form-elements/page.tsx` |
| Chart | `app/(admin)/(others-pages)/(chart)/line-chart/page.tsx` |
| Dashboard | `app/(admin)/page.tsx` |
| Blank | `app/(admin)/(others-pages)/blank/page.tsx` |

## Có API — thêm bước

```
types/{feature}.ts → config/api.ts → services/ → stores/ → component
```

Xem `.agents/skills/skill-api-zustand/SKILL.md`.

## Checklist

```
□ page.tsx có metadata tiếng Việt
□ View component trong components/{feature}/
□ Sidebar navItems cập nhật
□ PageBreadCrumb + ComponentCard
□ npm run lint && npm run build PASS
□ skill-code-review
```

## Reference

`.agents/skills/skill-admin-dashboard/SKILL.md`
`.agents/skills/skill-components/SKILL.md`
`src/layout/AppSidebar.tsx`