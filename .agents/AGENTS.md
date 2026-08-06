# AGENTS — Hệ thống AI cho FE_ZALO_V2

> Admin dashboard Zalo · TailAdmin Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript

**Monorepo:** workspace root = `ChotCare_v2_BE/`. Path code FE trong monorepo: `FE/src/…`.  
Rule BE/cross-stack/envelope/cache/locate/caveman → **root** `.agents/AGENTS.md` (thắng file này khi conflict).

## Skill priority (FE dual tree — bắt buộc)

Không load 2 SSOT cùng topic. Thứ tự:

| # | Scope | SSOT |
|---|--------|------|
| 1 | BE / cross-stack / agent modes / API envelope monorepo | **Root** `../.agents/AGENTS.md` + `../.agents/skills/` |
| 2 | FE product TailAdmin / Zalo admin / toast / messenger UI | **`FE/.grok/skills/`** (`zalo-admin-*`, `add-admin-page`, `zalo-messenger`, …) |
| 3 | FE workflow scaffold (page, component, zustand, perf, review) | **`FE/.agents/skills/skill-*`** |
| 4 | Creative generic (`design`, `brand`, `banner-design`, `slides`, `ui-styling`, `ui-ux-pro-max`, `design-system`) | **Root** `../.agents/skills/<name>/` — bản `FE/.agents/skills/<name>` = **mirror** (sửa root rồi sync) |
| 5 | Conflict | Root AGENTS + `chotcare-agent-policy` — cấm path `~/.claude` / absolute home trong skill repo |

Chi tiết monorepo: root AGENTS § Path conventions → FE dual tree.

## Đọc trước khi làm việc

1. `.grok/skills/zalo-admin-project/SKILL.md` — stack, cấu trúc thư mục, lệnh
2. `.grok/skills/zalo-admin-ui/SKILL.md` — design tokens TailAdmin
3. `.grok/skills/zalo-standards/SKILL.md` — quy chuẩn code
4. `.grok/skills/zalo-toast-tooltip/SKILL.md` — Sonner toast + Radix tooltip
5. Skill workflow phù hợp (§ Skill priority)

## Ngôn ngữ

- **Luôn Tiếng Việt** khi hỏi, phản hồi, giải thích — ngắn gọn, dễ hiểu
- **UI người dùng**: tiếng Việt (sidebar, label, toast, empty state)
- **Comment code**: Tiếng Việt cho logic nghiệp vụ
- Giữ tên thương hiệu: Zalo, TailAdmin, CN…

## Tài liệu tham chiếu

| File | Mục đích |
| ---- | -------- |
| `README.md` | Template TailAdmin, changelog, scripts |
| `.grok/skills/zalo-admin-project/` | Context dự án, directory map |
| `.grok/skills/zalo-admin-ui/` | Tokens màu, layout admin shell |
| `.grok/skills/zalo-standards/` | TypeScript, ESLint, conventions |
| `src/app/globals.css` | `@theme` Tailwind v4 tokens |

## Vai trò Agent

```
┌─────────────────────────────────────────────────────────┐
│                 ORCHESTRATOR (mặc định)                  │
│  Đọc yêu cầu → Discovery → Chọn skill → Implement       │
└────────────┬──────────────┬──────────────┬──────────────┘
             │              │              │
     ┌───────▼──────┐ ┌─────▼─────┐ ┌──────▼──────┐
     │  Component   │ │ API +     │ │ Performance │
     │   Builder    │ │ Zustand   │ │  Optimizer  │
     └──────────────┘ └───────────┘ └─────────────┘
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                   ┌────────────────┐
                   │  Code Reviewer │
                   └────────────────┘
```

### 1. Orchestrator (mặc định)

**Trách nhiệm:**

- Phân tích yêu cầu, xác định file ảnh hưởng
- Đọc `types/` và `config/api.ts` trước khi sửa API (khi đã có)
- Kiểm tra store hiện có trước khi tạo fetch mới
- Chọn skill phù hợp, không sửa file ngoài phạm vi task

**Discovery checklist** (bắt buộc):

```
□ src/app/(admin)/.../page.tsx     — route admin
□ src/app/(full-width-pages)/      — auth, error pages
□ src/layout/                      — AppSidebar, AppHeader, shell
□ src/components/{feature}/        — view & widget
□ src/context/                     — ThemeContext, SidebarContext
□ src/hooks/                       — useModal, useGoBack
□ src/icons/                       — SVG icon components
□ src/types/                       — contracts (khi thêm API)
□ src/config/api.ts                — endpoints (khi thêm API)
□ src/services/                    — HTTP layer (khi thêm API)
□ src/stores/                      — Zustand (khi thêm API)
```

### 2. Component Builder

**Kích hoạt khi:** Tạo/sửa trang admin, form, table, chart, modal, sidebar menu.

**Skill:** `.agents/skills/skill-components/SKILL.md`

**Nguyên tắc:**

- `page.tsx` mỏng — metadata + compose component
- Logic UI trong `src/components/{feature}/`
- `"use client"` khi cần state, event, chart, form tương tác
- Tái sử dụng `ComponentCard`, `PageBreadCrumb`, form primitives có sẵn

### 3. API + Zustand Integrator

**Kích hoạt khi:** Endpoint, store, auth, mutation, loading/error.

**Skill:** `.agents/skills/skill-api-zustand/SKILL.md`

**Nguyên tắc:**

- `types/` → `config/api.ts` → `services/` → `stores/` → component
- `import api from '@/lib/axios'` — chỉ trong `services/`

### 4. Tailwind & UI Stylist

**Kích hoạt khi:** Màu, spacing, responsive, dark mode, grid dashboard.

**Skill:** `.agents/skills/skill-tailwind/SKILL.md`

**Tham khảo:** `.grok/skills/zalo-admin-ui/SKILL.md`

### 5. Performance Optimizer

**Kích hoạt khi:** Chart nặng, bundle, lazy load, sidebar animation.

**Skill:** `.agents/skills/skill-performance/SKILL.md`

### 6. Admin Dashboard Specialist

**Kích hoạt khi:** Thêm route admin, cập nhật sidebar, scaffold dashboard Zalo.

**Skill:** `.agents/skills/skill-admin-dashboard/SKILL.md`

### 7. Code Reviewer

**Kích hoạt khi:** Hoàn thành task, trước commit.

**Skill:** `.agents/skills/skill-code-review/SKILL.md`

## Luồng xử lý task tiêu biểu

### Thêm trang admin mới

```
1. Đọc zalo-admin-project + zalo-admin-ui
2. Tạo src/components/{feature}/ — view chính
3. Tạo src/app/(admin)/(others-pages)/{route}/page.tsx
4. Cập nhật navItems trong src/layout/AppSidebar.tsx
5. npm run lint && npm run build
6. skill-code-review
```

### Thêm module Zalo (tài khoản, tin nhắn, nhóm…)

```
1. Scaffold page + component theo skill-admin-dashboard
2. types/ + config/api.ts + services/ + stores/ (skill-api-zustand)
3. UI tiếng Việt, bảng dùng BasicTableOne / Pagination làm mẫu
4. Toast feedback khi mutation
5. npm run lint && npm run build
```

### Sửa giao diện / dark mode

```
1. skill-tailwind + zalo-admin-ui
2. Dùng token brand-*, gray-*, success-*, error-* trong globals.css
3. Test light + dark tại 375px, 768px, 1280px
```

### Tích hợp API mới

```
1. types/{domain}.ts
2. config/api.ts — API_* constant
3. services/{domain}.service.ts
4. stores/use-{domain}-store.ts
5. Component gọi store — không gọi axios trực tiếp
6. npm run lint && npm run build
```

## Quy tắc CRITICAL

| # | Quy tắc |
| - | ------- |
| 1 | `npm run lint` và `npm run build` PASS trước khi xong task |
| 2 | UI user → tiếng Việt |
| 3 | `import api from '@/lib/axios'` — chỉ trong `services/` |
| 4 | Khai báo `types/` trước khi code API |
| 5 | Endpoint trong `config/api.ts` |
| 6 | Design tokens: `brand-*`, `gray-*` — không hex random |
| 7 | Không `any` |
| 8 | Icon dùng `src/icons/` — không emoji làm icon UI |
| 9 | `cursor-pointer` trên element clickable |
| 10 | Chỉ sửa file liên quan task |
| 11 | Giữ layout shell: `AppSidebar` + `AppHeader` + `AdminLayout` |
| 12 | Path alias `@/*` → `src/*` |

## Skills có sẵn

| Skill | Đường dẫn | Khi dùng |
| ----- | --------- | -------- |
| Components | `skills/skill-components/SKILL.md` | UI, form, table, modal |
| API + Zustand | `skills/skill-api-zustand/SKILL.md` | Data, auth, Zalo API |
| Tailwind & UI | `skills/skill-tailwind/SKILL.md` | CSS, tokens, responsive |
| Admin Dashboard | `skills/skill-admin-dashboard/SKILL.md` | Route, sidebar, scaffold |
| Performance | `skills/skill-performance/SKILL.md` | Chart, lazy load |
| Code Review | `skills/skill-code-review/SKILL.md` | Review trước xong |
| Project context | `.grok/skills/zalo-admin-project/` | Setup, cấu trúc |
| Design system | `.grok/skills/zalo-admin-ui/` | TailAdmin tokens |
| Add admin page | `.grok/skills/add-admin-page/` | Trang admin mới |
| Standards | `.grok/skills/zalo-standards/` | Quy chuẩn pro |

## Lệnh

```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve production
npm run lint     # ESLint
```