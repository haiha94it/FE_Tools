---
name: skill-api-zustand
description: Tích hợp API và Zustand cho FE_ZALO_V2. Kích hoạt khi thêm endpoint Zalo, store, auth, refresh token, xử lý lỗi.
---

# Skill: API + Zustand (FE_ZALO_V2)

> Template hiện tại chưa có API layer — skill này định nghĩa convention khi tích hợp backend Zalo.

## Khi nào dùng

- Thêm API endpoint / service mới
- Tạo/cập nhật Zustand store
- Auth login/logout/refresh
- Loading/error state + toast

## Quy trình (theo thứ tự)

```
1. src/types/{domain}.ts           — interface request/response
2. src/config/api.ts               — hằng số API_*
3. src/lib/axios.ts                — axios instance (tạo nếu chưa có)
4. src/services/{domain}.service.ts — gọi axios
5. src/stores/use-{domain}-store.ts — state + actions
6. component                       — gọi store, KHÔNG gọi api
```

## Bước 1: Types

```typescript
// src/types/zalo-account.ts
export interface ZaloAccount {
  id: string;
  phone: string;
  displayName: string;
  status: "active" | "inactive" | "error";
  connectedAt: string;
}
```

## Bước 2: API constants

```typescript
// src/config/api.ts
export const API_ZALO = {
  ACCOUNTS: "/zalo/accounts/",
  ACCOUNT_DETAIL: (id: string) => `/zalo/accounts/${id}/`,
  MESSAGES: "/zalo/messages/",
} as const;
```

## Bước 3: Axios instance

```typescript
// src/lib/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
});

// Interceptor refresh token — implement một lần tại đây
export default api;
```

## Bước 4: Service

```typescript
// src/services/zalo-account.service.ts
import api from "@/lib/axios";
import { API_ZALO } from "@/config/api";
import type { ZaloAccount } from "@/types/zalo-account";

export const zaloAccountService = {
  list: () => api.get<ZaloAccount[]>(API_ZALO.ACCOUNTS),
  getById: (id: string) => api.get<ZaloAccount>(API_ZALO.ACCOUNT_DETAIL(id)),
};
```

## Bước 5: Store

```typescript
// src/stores/use-zalo-account-store.ts
import { create } from "zustand";
import { zaloAccountService } from "@/services/zalo-account.service";
import type { ZaloAccount } from "@/types/zalo-account";

type State = {
  accounts: ZaloAccount[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
};

export const useZaloAccountStore = create<State>((set) => ({
  accounts: [],
  isLoading: false,
  error: null,
  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await zaloAccountService.list();
      set({ accounts: data, isLoading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Không tải được dữ liệu",
        isLoading: false,
      });
    }
  },
}));
```

## Bước 6: Component

```tsx
"use client";
import { useEffect } from "react";
import { useZaloAccountStore } from "@/stores/use-zalo-account-store";

export function ZaloAccountList() {
  const accounts = useZaloAccountStore((s) => s.accounts);
  const fetchAccounts = useZaloAccountStore((s) => s.fetchAccounts);

  useEffect(() => {
    void fetchAccounts();
  }, [fetchAccounts]);

  return (/* render */);
}
```

## Zustand — selective subscription

```ts
// ✅ Tránh re-render
const accounts = useZaloAccountStore((s) => s.accounts);

// ❌ Subscribe toàn store
const store = useZaloAccountStore();
```

## CRITICAL — Tránh re-render gọi API lặp

| Lỗi | Cách sửa |
| --- | -------- |
| Inline callback trong `useEffect` deps | `useStableHandler` (`src/hooks/use-stable-handler.ts`) hoặc gọi thẳng store action |
| `useEffect` + handler cùng fetch | Một entry point trong store (`switchAccount`, `applyConversationFilter`, `submitConversationSearch`) |
| WS `subscribe` deps có `accounts[]` | Subscribe một lần, đọc `useXStore.getState()` trong handler |
| `fetchAccounts` auto-select account | Route/user chọn account — không set mặc định trong fetch |
| Click + route effect double fetch | UI chỉ `router.push`; route effect gọi `selectConversation` |

**In-flight dedup** — Map request key trong store, return promise đang chạy nếu trùng key (xem `use-zalo-messenger-store.ts`).

**Messenger:** `.grok/skills/zalo-messenger/SKILL.md`

## CRITICAL — Mutation bảng: KHÔNG refresh toàn bộ

Sau **xóa / sửa / copy / start-stop** trong bảng admin, **không** set `loading: true` rồi thay cả bảng bằng "Đang tải...".

| Thao tác | Store pattern | Tham chiếu |
| -------- | ------------- | ---------- |
| **Xóa** | Gọi API → `filter` mảng local (`campaigns`, `proxies`, `accounts`…) + cập nhật `selectedIds`. **Không** gọi lại `fetch*` có `loading: true` | `use-zalo-proxy-store.ts` `deleteProxies` |
| **Sửa / copy / đổi trạng thái** | Sau API thành công → `fetch*({ silent: true })` — cập nhật data **không** bật loading toàn bảng | `use-zalo-add-friend-campaign-store.ts` |
| **WS realtime** | `fetch*({ silent: true })` — giữ bảng hiển thị, chỉ sync data nền | `add-friend/index.tsx` |

```typescript
// fetch hỗ trợ silent
fetchCampaigns: async (options?: { silent?: boolean }) => {
  const silent = options?.silent ?? false;
  if (!silent) set({ loading: true, error: null });
  // ...
};

// xóa — patch local, không refetch
deleteCampaign: async (id) => {
  await service.deleteCampaign(id);
  set((state) => ({
    campaigns: state.campaigns.filter((item) => item.id !== id),
    selectedIds: state.selectedIds.filter((item) => item !== id),
  }));
};
```

**Component bảng** — chỉ skeleton/full loading khi **lần đầu** (chưa có dữ liệu):

```tsx
{loading && items.length === 0 ? <FullLoading /> : null}
{loading && items.length > 0 ? <SmallSpinner /> : null}
{/* luôn render bảng khi đã có items */}
```

Tham chiếu UI: `ConversationPanel.tsx`, `AddFriendCampaignTable.tsx`.

## Next.js App Router

- Store dùng trong Client Component (`"use client"`)
- Persist: middleware `persist` + hydrate sau mount nếu cần SSR
- Không gọi store trong Server Component

## Xử lý lỗi (tiếng Việt)

```tsx
// Hiển thị message tiếng Việt cho user
{error && (
  <p className="text-sm text-error-500">{error}</p>
)}
```

## Env

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Reference

`.agents/skills/skill-components/SKILL.md`
`.grok/skills/zalo-standards/SKILL.md`