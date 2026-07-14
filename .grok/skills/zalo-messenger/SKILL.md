---
name: zalo-messenger
description: >
  Module Tin nhắn Zalo FE_ZALO_V2 — REST envelope + WebSocket realtime, store, UI chat responsive.
  Use when sửa /zalo-messages, messenger store, WS new_global_update, gửi tin optimistic.
  Triggers: tin nhắn, messenger, chat zalo, new_global_update, message_ack, rerender api.
  Slash command: /zalo-messenger
---

# Zalo Messenger — FE_ZALO_V2

## Routes

```
/zalo-messages
/zalo-messages/[accountId]
/zalo-messages/[accountId]/[conversationId]
```

View: `src/components/zalo-messages/index.tsx`  
Store: `src/stores/use-zalo-messenger-store.ts`  
WS hook: `src/hooks/use-messenger-ws.ts`

## Data flow

```
Route URL → useEffect sync (route key dedup) → store.switchAccount / selectConversation
User search/filter → store.submitConversationSearch / applyConversationFilter (một nơi fetch)
WS → subscribe MỘT LẦN → getState() trong handler
```

## CRITICAL — Tránh re-render toàn layout

### Tách cột + subscribe từng slice

```
index.tsx          → shell mỏng (breadcrumb + layout)
MessengerBootstrap → route/WS, không UI
MessengerLayout    → chỉ mobilePanel + CSS ẩn/hiện
MessengerAccountColumn      → accounts slice
MessengerConversationColumn → conversations slice
MessengerChatColumn         → messages slice
```

Desktop (`lg+`): **luôn mount** 3 cột (`hidden lg:flex`), không `{cond ? <Panel/> : null}`.

### Cache khi đổi account / hội thoại

- `conversationCache` theo `accountId` — không `conversations: []` trước fetch
- `messagesCache` theo `accountId:conversationId` — `prepareConversationSwitch` restore cache, không xóa list

## CRITICAL — Tránh re-render gọi API lặp

### 1. Không inline callback vào dependency `useEffect`

```tsx
// ❌ Mỗi render tạo function mới → effect chạy lại → gọi API vòng lặp
useEffect(() => {
  onSearchChange(localSearch);
}, [localSearch, onSearchChange]);

// ✅ useStableHandler hoặc useCallback + logic trong store
const onSearchSubmit = useStableHandler((value) => {
  void submitConversationSearch(value);
});
```

### 2. Một entry point fetch list hội thoại

```ts
// ❌ useEffect([filter]) + onFilterChange cùng fetchConversations
// ✅ store.applyConversationFilter — set state + fetch một lần, skip nếu filter không đổi
```

### 3. Route sync dedup

```tsx
const routeSyncKeyRef = useRef<string | null>(null);
const routeKey = `${accountId}|${conversationId}`;
if (routeSyncKeyRef.current === routeKey) return;
```

Chỉ `router.push` từ UI — **không** gọi `selectConversation` thêm lần nữa trong handler click.

### 4. WS subscribe một lần

```ts
useEffect(() => {
  return subscribe((payload) => {
    const state = useZaloMessengerStore.getState();
    // dùng state mới nhất, KHÔNG đưa accounts/activeConversation vào deps
  });
}, [subscribe]);
```

### 5. In-flight dedup trong store

`fetchConversations` / `fetchMessages` / `selectConversation` — Map request key, return promise đang chạy nếu trùng.

### 6. fetchAccounts không auto-select

Không set `selectedAccountId` trong `fetchAccounts` — route hoặc user chọn account.

## File map

| File | Vai trò |
| ---- | ------- |
| `types/zalo-messenger.ts` | Account, Conversation, RawMessage, DisplayMessage |
| `lib/zalo-messenger-utils.ts` | sort, dedupe, belongsToOpenChat |
| `lib/zalo-messenger-message-utils.ts` | normalizeIncomingMessage |
| `services/zalo-messenger.service.ts` | REST envelope |
| `hooks/use-stable-handler.ts` | Stable callback cho effects |

## API (contract 2026)

- `GET /api/account/?scope=messenger`
- `GET /api/message/conversations?id_account=&page=`
- `GET /api/message/get-message?id_account=&id_conversation=`
- `GET /api/message/fast-reply/get?id_account=`
- `POST /api/message/note`, `POST /api/message/pin`
- `POST /api/upload/file`
- `POST /api/group/get-member/show|get-member|get-member/result`
- Gửi tin: WS `send-message` | `send-file` | `quote` | `mentions` | `mention-all` + `message_ack`

## Chat features (UI)

| Tính năng | File |
| --------- | ---- |
| Trả lời (quote) | `MessageBubble`, `ChatComposer`, store `quoteMessage` |
| Tin nhanh `/` | `ChatComposer`, `fetchFastReplies` |
| @mention / @all | `ChatComposer`, `zalo-messenger-mention-utils.ts` |
| Đính kèm ảnh/file | `ChatComposer`, `uploadAttachments` |
| Ghim + ghi chú | `ChatHeaderMenu`, `pinConversation`, `saveConversationNote` |
| Gửi lại lỗi | `MessageBubble`, `use-messenger-send.retry` |
| Preview media | `MessageMediaLightbox` |
| Thành viên nhóm | `GroupMembersPanel`, `use-group-members` |

## Checklist khi thêm tính năng messenger

```
□ Callback truyền xuống child có stable (useStableHandler / store action)
□ Không useEffect phụ thuộc object/array từ store selector không memo
□ Fetch qua store action có dedup in-flight
□ WS handler dùng getState(), không re-subscribe khi badge/merge
□ npm run build PASS
```

## Reference

`/home/chot-nhanh/Downloads/message-be-fe-contract.md`
`.agents/skills/skill-api-zustand/SKILL.md`
`.agents/skills/skill-performance/SKILL.md`