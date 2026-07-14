---
name: skill-code-review
description: Checklist review code FE_ZALO_V2. Dùng sau implement hoặc trước commit.
---

# Skill: Code Review (FE_ZALO_V2)

## CRITICAL

```
□ npm run lint PASS
□ npm run build PASS
□ Không axios/fetch trực tiếp trong component (dùng services + store)
□ Không any
□ import api from '@/lib/axios' — chỉ trong services/
□ Design tokens brand-*, gray-* — không hex random
□ cursor-pointer trên clickable
□ UI user → tiếng Việt
□ Icon từ src/icons/ — không emoji icon
□ Toast qua @/lib/toast (Sonner) — không alert/react-toastify
□ Hint hover qua Tooltip — không title HTML trên button/icon
```

## IMPORTANT

```
□ page.tsx mỏng — logic trong components/
□ "use client" chỉ khi cần state/event/chart
□ Types trước khi dùng API data
□ Sidebar navItems cập nhật khi thêm route admin
□ metadata title/description tiếng Việt
□ Dark mode hoạt động (light + dark)
□ File < 300 dòng — tách component nếu quá dài
□ Không sửa file ngoài phạm vi task
```

## Layout admin

```
□ Không phá AppSidebar / AppHeader / AdminLayout
□ Grid dashboard: grid-cols-12 gap-4 md:gap-6
□ ComponentCard cho khối nội dung có tiêu đề
```

## Performance

```
□ Chart component — dynamic import nếu below-fold
□ Zustand selective subscription
□ Image dùng next/image khi có ảnh
```

## Reference

`.agents/AGENTS.md`
`.grok/skills/zalo-standards/SKILL.md`