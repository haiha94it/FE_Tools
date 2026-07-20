---
name: zalo-admin-project
description: >
  FE_ZALO_V2 project context — TailAdmin Next.js 16 admin dashboard cho quản trị Zalo.
  Use when working in this repo: setup, dev server, build, lint, architecture, file locations, conventions.
  Triggers: FE_ZALO_V2, zalo admin, tailadmin, dự án zalo, chạy dev, build project, cấu trúc dự án.
  Slash command: /zalo-admin-project
---

# FE_ZALO_V2 — Project Skill

Admin dashboard frontend cho hệ sinh thái Zalo CN, scaffold từ **TailAdmin Next.js Free v2.3.0**.

## Stack

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | React 19 |
| Styling | Tailwind CSS v4 (`@theme` in `globals.css`) |
| Charts | ApexCharts (`react-apexcharts`) |
| Calendar | FullCalendar + flatpickr |
| Icons | SVG components trong `src/icons/` |
| Font | Plus Jakarta Sans (Google Fonts, hỗ trợ tiếng Việt) |
| Toast | **Sonner** (`src/lib/toast.ts`) |
| Tooltip | **Radix** (`src/components/ui/tooltip/Tooltip.tsx`) |

## Commands

```bash
cd /home/chot-nhanh/Documents/CN_PROJECT/FE_ZALO_V2
npm install          # lần đầu
npm run dev          # http://localhost:3000
npm run build        # production build — chạy trước khi xong task
npm run start        # serve production
npm run lint         # ESLint
```

## Directory Map

```
src/
├── app/
│   ├── globals.css              # @theme tokens TailAdmin
│   ├── layout.tsx               # Root: ThemeProvider, SidebarProvider
│   ├── (admin)/                 # Admin shell (sidebar + header)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Dashboard /
│   │   ├── (others-pages)/      # calendar, profile, tables, forms, charts
│   │   └── (ui-elements)/       # alerts, buttons, modals…
│   └── (full-width-pages)/      # auth, 404
├── components/
│   ├── common/                  # ComponentCard, PageBreadCrumb, ThemeToggle
│   ├── ecommerce/               # Dashboard widgets (metrics, charts)
│   ├── form/                    # Form primitives
│   ├── tables/                  # BasicTableOne, Pagination
│   ├── charts/                  # ApexCharts wrappers
│   ├── auth/                    # SignInForm, SignUpForm
│   └── header/                  # NotificationDropdown, UserDropdown
├── context/
│   ├── ThemeContext.tsx         # Dark/light mode
│   └── SidebarContext.tsx       # Sidebar expand/collapse/mobile
├── layout/
│   ├── AppSidebar.tsx           # Navigation menu
│   ├── AppHeader.tsx            # Top bar
│   └── Backdrop.tsx             # Mobile overlay
├── hooks/                       # useModal, useGoBack
└── icons/                       # SVG icon components
.agents/
├── AGENTS.md                    # Orchestrator agent
└── skills/                      # Workflow skills
.grok/skills/                    # Project slash-command skills
public/images/                   # Static assets
```

## Route groups

| Group | URL ví dụ | Layout |
| ----- | --------- | ------ |
| `(admin)` | `/`, `/calendar`, `/profile` | Sidebar + Header |
| `(auth)` | `/signin`, `/signup` | Full-width, no sidebar |
| `(error-pages)` | `/error-404` | Full-width |

## Conventions

1. **Path alias** → `@/*` maps to `src/*`
2. **Page mỏng** → metadata + import view component
3. **Client components** → chart, form, modal, sidebar logic
4. **UI tiếng Việt** cho người dùng cuối
5. **API layer** (khi thêm): `types/` → `config/api.ts` → `services/` → `stores/`
6. **Không** phá layout shell TailAdmin trừ khi được yêu cầu

## Agent system

| File | Mục đích |
| ---- | -------- |
| `.agents/AGENTS.md` | Vai trò agent, luồng task, quy tắc CRITICAL |
| `.agents/skills/skill-*` | Workflow: components, tailwind, API, review… |
| `.grok/skills/zalo-admin-ui/` | Design tokens |
| `.grok/skills/zalo-standards/` | Coding standards |
| `.grok/skills/add-admin-page/` | Thêm trang admin |

## Liên quan dự án CN

- `MANAGE_CN` — admin panel hiện có (Zalo messenger, fanpage)
- `ZaloCN` — frontend Zalo legacy
- `FE_ZALO_V2` — admin dashboard mới trên TailAdmin

Khi tích hợp API, tham khảo pattern từ `MANAGE_CN` (`store/`, `api.tsx`, `lib/axios.ts`).