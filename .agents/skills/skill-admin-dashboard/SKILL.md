---
name: skill-admin-dashboard
description: Scaffold trang admin TailAdmin cho FE_ZALO_V2 — route, sidebar nav, dashboard Zalo. Kích hoạt khi thêm module quản trị Zalo.
---

# Skill: Admin Dashboard (FE_ZALO_V2)

## Kiến trúc route

```
src/app/
├── layout.tsx                          # Root: ThemeProvider, SidebarProvider
├── (admin)/
│   ├── layout.tsx                      # Admin shell: sidebar + header
│   ├── page.tsx                        # Dashboard chính (/)
│   ├── (others-pages)/
│   │   ├── calendar/page.tsx
│   │   ├── profile/page.tsx
│   │   ├── blank/page.tsx
│   │   ├── (chart)/line-chart/page.tsx
│   │   ├── (forms)/form-elements/page.tsx
│   │   └── (tables)/basic-tables/page.tsx
│   └── (ui-elements)/buttons/page.tsx …
└── (full-width-pages)/
    ├── (auth)/signin/page.tsx
    └── (error-pages)/error-404/page.tsx
```

Route group `(admin)` — URL không chứa prefix, ví dụ `/calendar`, `/profile`.

## Thêm trang admin mới — checklist

```
1. Tạo page: src/app/(admin)/(others-pages)/{route}/page.tsx
2. Tạo view: src/components/{feature}/index.tsx
3. Cập nhật navItems trong src/layout/AppSidebar.tsx
4. metadata tiếng Việt
5. npm run lint && npm run build
```

## Cập nhật sidebar

File: `src/layout/AppSidebar.tsx`

```typescript
const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    subItems: [{ name: "Tổng quan", path: "/", pro: false }],
  },
  {
    icon: <ChatIcon />,
    name: "Tin nhắn Zalo",
    path: "/zalo-messages",
  },
  // ...
];
```

- `name` → tiếng Việt cho user
- `path` → khớp route trong `app/(admin)/`
- `subItems` → menu có con, `pro: false` cho bản free

## Module Zalo gợi ý (roadmap)

| Module | Route gợi ý | Component |
| ------ | ----------- | --------- |
| Tài khoản Zalo | `/zalo-accounts` | `components/zalo-accounts/` |
| Quản lý Bạn bè / Nhóm (con) | `/zalo-accounts/contacts` | `adminDataPageClass` + `ComponentCard fill` + `ScrollableTableContainer fill` — **một scroll** trong table |
| Tin nhắn | `/zalo-messages` | `components/zalo-messages/` |
| Nhóm Zalo | `/zalo-groups` | `components/zalo-groups/` |
| Chiến dịch | `/zalo-campaigns` | `components/zalo-campaigns/` |
| Thống kê | `/` (dashboard) | `components/ecommerce/` hoặc mới |

## Dashboard Zalo — thay ecommerce

Khi customize dashboard chính (`src/app/(admin)/page.tsx`):

```tsx
export default function ZaloDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      {/* Metrics: số TK, tin nhắn hôm nay, nhóm active */}
      {/* Chart: tin nhắn theo ngày */}
      {/* Table: hoạt động gần đây */}
    </div>
  );
}
```

**Stat metrics:** Không copy `EcommerceMetrics` (card lớn 4 cột) cho trang list Zalo. Dùng **inline gọn** trong `ComponentCard` — xem `.grok/skills/zalo-admin-ui/SKILL.md` § Stat metrics và `ZaloAccountsMetrics.tsx`.

Tái sử dụng pattern chart/table từ `RecentOrders` khi cần; metrics số liệu luôn inline compact.

## Auth flow

- Sign in: `/signin` — `components/auth/SignInForm.tsx`
- Sign up: `/signup` — `components/auth/SignUpForm.tsx`
- Layout auth: `(full-width-pages)/(auth)/layout.tsx` — không có sidebar

## Context phụ thuộc

| Context | File | Dùng cho |
| ------- | ---- | -------- |
| ThemeProvider | `context/ThemeContext.tsx` | Dark/light mode |
| SidebarProvider | `context/SidebarContext.tsx` | Collapse, mobile menu |

## Reference

`.grok/skills/add-admin-page/SKILL.md`
`.agents/skills/skill-components/SKILL.md`
`src/layout/AppSidebar.tsx`