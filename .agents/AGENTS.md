# AGENTS — Công Cụ Nghề Frontend

Next.js 16 · React 19 · Tailwind CSS v4 · TypeScript.

## Path convention

- Local monorepo: `FE_Tools/src/...`.
- Server/deploy: cùng codebase được đặt tại `FE/src/...`.
- Trong file nằm bên trong FE, ưu tiên path tương đối `src/...` để dùng được ở cả local và server.
- Không coi `FE/` là legacy; chỉ khác tên thư mục deploy.
- Rule BE/cross-stack/API envelope/agent mode: root `.agents/AGENTS.md` và root `.agents/skills/`.
- Rule FE trong file này thắng skill generic khi có khác biệt product.

## Product

- Brand: **Công Cụ Nghề**.
- Public UI mobile-first; tool public không bắt đăng nhập trừ `require_login`.
- Calculator compute hybrid, ưu tiên client.
- Không thêm domain Zalo, messenger, shop hoặc WebSocket.
- UI người dùng và thông báo: tiếng Việt.

## Architecture

```text
src/types/        contract TypeScript
src/config/api.ts endpoint constants
src/lib/          axios, envelope, helper dùng chung
src/services/     HTTP theo domain
src/stores/       state dùng nhiều page hoặc flow
src/components/   UI dùng lại/feature
src/app/          route, metadata, composition
```

- API flow: `types → config/api.ts → services → stores (nếu cần) → component`.
- Chỉ `services/` gọi axios. Unwrap envelope qua `src/lib/api-response.ts`.
- `page.tsx` giữ mỏng; interactive logic trong component gần feature.
- Server Component mặc định; chỉ thêm `"use client"` cho state/event/browser API.
- Reuse component/helper hiện có trước khi tạo file hoặc abstraction mới.
- Shared component phải có ít nhất hai caller thật; ngoại lệ: calculator primitives đã được product chốt bên dưới.

## Calculator UI contract

Mọi calculator public dùng chung presentation primitives tại
`src/components/calculator/`. Cấm từng tool tự dựng layout, field, action hoặc result
khác chuẩn khi primitive chung đã đáp ứng.

Contract này chuẩn hóa UI; không tạo engine/schema renderer ép mọi công thức vào một
framework. Công thức, validation nghiệp vụ và cách làm tròn vẫn thuộc từng tool.

### Cấu trúc bắt buộc

1. `CalculatorShell`: breadcrumb → tên/mô tả → input → action → result → hướng dẫn/công thức → disclaimer → tool liên quan.
2. `CalculatorField`: label, help text, error text và đơn vị theo cùng spacing/typography.
3. `CalculatorActions`: primary `Tính kết quả`, secondary `Đặt lại`; cùng height/radius/loading/disabled state.
4. `CalculatorResult`: visual hierarchy cố định cho kết quả chính, đơn vị, cách làm tròn và ghi chú.
5. Mọi tool có đủ state: empty, calculating, success, validation error, calculation error.

Primitive dự kiến; chỉ tạo khi calculator đầu tiên dùng:

```text
src/components/calculator/
├── CalculatorShell.tsx
├── CalculatorSection.tsx
├── CalculatorField.tsx
├── CalculatorActions.tsx
├── CalculatorResult.tsx
└── CalculatorDisclaimer.tsx
```

Không tạo file rỗng hoặc component chưa có caller.

### Visual consistency

- Dùng token/class hiện có trong `src/app/globals.css`; cấm hex, font, shadow hoặc spacing riêng rải trong calculator.
- Giữ chung màu primary, width container, grid, card, radius và hierarchy typography.
- Từng tool chỉ khác icon, nội dung, field, công thức và cách biểu diễn dữ liệu chuyên ngành.
- Không đổi shell hoặc primary color theo nghề.
- Label luôn hiển thị; không dùng placeholder thay label.
- Validation nằm cạnh field; toast không thay inline error.

### Responsive và accessibility

- Mobile-first. Mobile: form trước, result sau; desktop dùng cùng breakpoint/grid chuẩn.
- Không horizontal scroll tại 320px; interactive target tối thiểu 44×44px.
- Numeric field dùng `inputMode` phù hợp bàn phím mobile.
- Input liên kết `label`; help/error liên kết bằng `aria-describedby`.
- Focus state luôn nhìn thấy; trạng thái không truyền đạt chỉ bằng màu.
- Result cập nhật dùng `aria-live="polite"`.

### Ownership

- Presentation/state primitive chung: `src/components/calculator/`.
- Formula + domain validation: module gần feature/tool.
- Shared UI component không chứa công thức nghiệp vụ.
- Logic chỉ nâng thành helper chung khi ít nhất hai calculator dùng thật.
- Ngoại lệ UI cần lý do nghiệp vụ cụ thể trong code review.

### Verify calculator

- Viewport tối thiểu: 320px, 768px, 1280px.
- Keyboard navigation + visible focus.
- Empty, invalid, calculating, success và calculation-error state.
- So sánh shell/spacing/action/result với calculator đã ship gần nhất.

## UI rules

- Tailwind v4 CSS-first; token mới đặt trong `src/app/globals.css` khi thật sự dùng chung.
- Không dynamic class kiểu ``text-${color}-500``.
- Icon dùng `src/icons/` hoặc icon library hiện có; không emoji làm icon UI.
- Clickable native/non-native phải có semantics, keyboard và focus phù hợp.
- Giữ admin shell `AppSidebar` + `AppHeader` + `AdminShell`.
- Auth/admin không đi qua public calculator shell.

## Quality gate

```bash
npm run lint
npm run build
```

- Không `any` nếu có thể khai báo type chính xác.
- Không gọi API trực tiếp trong component.
- Không sửa file ngoài scope.
- Route/API đổi phải đồng bộ `src/config/api.ts` và caller liên quan.
- Review calculator theo contract trên trước khi hoàn tất.

## Skills

- Cross-stack/path/reuse: root `code-placement`, `api-envelope`, `ponytail`.
- UI/token/accessibility: root hoặc local mirror `design-system`, `ui-styling`, `ui-ux-pro-max`.
- Creative assets: root hoặc local mirror `design`, `brand`, `banner-design`, `slides`.
- Không load đồng thời root và local mirror của cùng một skill.
