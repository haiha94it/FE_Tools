# FE: chống double / concurrent API fetch

Tài liệu ghi lại **toàn bộ chỗ đã chỉnh** để gộp request trùng (React Strict Mode, multi-mount, bootstrap gọi chồng).  
Mục đích: sau này nếu list không refresh, data “cũ”, hoặc race khi đổi nick — biết **đã đụng file nào / pattern nào** để dò.

> Doc này **không chạy runtime**. Chỉ là map tham chiếu. Sửa code mới mới ảnh hưởng hành vi.

---

## 1. Vì sao có double call?

| Nguyên nhân | Biểu hiện | Hướng xử lý trong repo |
|-------------|-----------|------------------------|
| **React Strict Mode (dev)** | `useEffect` mount → cleanup → mount lại → 2 HTTP song song | `dedupeInflight` |
| Nhiều caller cùng lúc | Auth bootstrap + layout + page đều gọi profile/accounts | `dedupeInflight` + skip-if-loaded / TTL |
| Race đổi nick (messenger) | Switch 25→21 rồi response 25 ghi đè UI / gọi API nick cũ | `accountSwitchGeneration` + `AbortController` + single owner load |
| List page/cursor | Scroll chat load nhiều `get-message` | **Cố ý** — không coi là bug |

**Không phải business double-fetch:** request Next.js RSC `?_rsc=...` khi soft-navigate giữa route (ví dụ `/guides` ↔ `/resource`).

---

## 2. Utility dùng chung

**File:** `src/lib/inflight.ts`

```ts
dedupeInflight(key, fn) → Promise
```

- Cùng `key` trong lúc Promise còn chạy → caller sau **share cùng Promise** → **1 HTTP**.
- Promise xong → xóa key → lần sau (sau mutation, reload) **gọi lại bình thường**.
- **Không abort** request đang chạy (khác AbortController). Request #1 vẫn complete; call #2 không mở socket mới.

**Khi nào cần Abort thay vì (hoặc kèm) inflight?**

- Đổi account / đổi group: response cũ không được apply → `AbortController` + generation check (messenger, group members).

---

## 3. Quy ước key & silent refresh

Pattern phổ biến trên store list:

```ts
return dedupeInflight(
  `module:fetchXxx:${silent ? "silent" : "full"}`,
  async () => { /* HTTP */ },
);
```

| Key suffix | Khi nào | Ý nghĩa |
|------------|---------|---------|
| `full` | Mount page, load có spinner | Gộp Strict Mode |
| `silent` | Sau create/edit (refresh nền) | **Tách key** để không dính promise loading đang chạy; vẫn force 1 request mới |

**Lưu ý khi sửa sau này:**

- Muốn **luôn** force network sau mutation: gọi `fetchX({ silent: true })` hoặc key có timestamp (xem team employees).
- **Đừng** reuse key `full` cho refresh sau mutate nếu lúc đó `full` vẫn inflight — có thể nhận data cũ của request mount.
- Key phải **ổn định** theo scope (system, accountId, groupId…). Key random mỗi lần = **mất dedupe**.

---

## 4. Bản đồ file đã sửa (tra cứu nhanh)

### 4.1 Core

| File | Vai trò |
|------|---------|
| `src/lib/inflight.ts` | `dedupeInflight` — Map Promise toàn app |

### 4.2 Auth / team / accounts

| File | Hàm / chỗ | Inflight key (hoặc cơ chế) | API / hành vi liên quan |
|------|-----------|----------------------------|-------------------------|
| `src/stores/use-auth-store.ts` | `fetchProfile` | `auth:fetchProfile` | profile + team bootstrap |
| | lồng trong profile | `auth:fetchMe` | `GET` me |
| | `bootstrap` | `auth:bootstrap` | bootstrap app; **không** gọi `bootstrapTeamContext` lần 2 (đã nằm trong `fetchProfile`) |
| | TTL profile | `PROFILE_FETCH_TTL_MS = 2500` + `lastFetchProfileAt` | skip re-fetch profile trong ~2.5s nếu đã có user (trừ `force`) |
| `src/stores/use-team-collaboration-store.ts` | `bootstrapTeamContext` | `team:bootstrapTeamContext` | permissions + accounts |
| | | skip nếu `permissionsLoaded && accountsLoaded && campaignPermissions != null` | tránh re-bootstrap thừa |
| | `refreshCampaignPermissions` / bootstrap | `team:myCampaignPermissions` | my campaign permissions |
| | `fetchAccessibleAccounts` | `team:fetchAccessibleAccounts` | assignments / list accounts |
| `src/stores/use-zalo-account-store.ts` | `fetchAccounts` | `zalo-account:fetchAccounts` | list nick (page accounts) |
| `src/components/team/TeamEmployeesView.tsx` | `load()` | `team:listEmployees` (initial) | list employees — gộp Strict Mode |
| | `load({ background: true })` | `team:listEmployees:refresh:${Date.now()}` | **luôn** fetch mới sau create/delete |

### 4.3 Guides / Resource (popup CMS)

| File | Hàm | Inflight key | API |
|------|-----|--------------|-----|
| `src/stores/use-zalo-guide-store.ts` | `fetchGuides` | `zalo-guide:fetchGuides:${system}:full\|silent` | `/api/popup/tutorial/get?systems=...` |
| `src/stores/use-zalo-resource-store.ts` | `fetchAll` | `zalo-resource:fetchAll:full\|silent` | `/api/popup/resource/get` + `/api/popup/product-app/get` (Promise.all, 1 vòng) |

Caller UI (chỉ mount effect — **không** đổi logic UI):

- `src/components/guides/index.tsx` → `fetchGuides()`
- `src/components/resource/index.tsx` → `fetchAll()`

Sau create/edit guide/resource/product: vẫn `fetch*({ silent: true })`.

### 4.4 Campaign stores (list + accounts dropdown)

Cùng pattern: `fetchCampaigns` + `fetchAccounts` bọc `dedupeInflight`.

| Store file | Key `fetchCampaigns` | Key `fetchAccounts` |
|------------|----------------------|---------------------|
| `use-zalo-add-friend-campaign-store.ts` | `zalo-add-friend-campaign:fetchCampaigns:full\|silent` | `zalo-add-friend-campaign:fetchAccounts` |
| `use-zalo-join-group-campaign-store.ts` | `zalo-join-group-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-invite-join-group-campaign-store.ts` | `zalo-invite-join-group-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-phone-invite-group-campaign-store.ts` | `zalo-phone-invite-group-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-send-mes-fr-campaign-store.ts` | `zalo-send-mes-fr-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-send-mes-group-campaign-store.ts` | `zalo-send-mes-group-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-send-mess-member-gr-campaign-store.ts` | `zalo-send-mess-member-gr-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-send-mess-phone-campaign-store.ts` | `zalo-send-mess-phone-campaign:fetchCampaigns:...` | `...:fetchAccounts` |
| `use-zalo-birthday-campaign-store.ts` | `fetchCampaign` → `zalo-birthday-campaign:fetchCampaign:full\|silent` | `zalo-birthday-campaign:fetchAccounts` |
| | `fetchMediaLibraries` → `zalo-birthday-campaign:fetchMediaLibraries` (GET `/api/message/video` + `/album`) | |
| | `refreshResults` → `zalo-birthday-campaign:refreshResults:{page}:{perPage}:full\|silent` | |

Accounts trong campaign thường qua `fetchAccessibleAccounts()` (`src/lib/fetch-accessible-accounts.ts`) — dedupe ở **từng store action**, không bắt buộc ở lib helper.

### 4.5 Messenger (dedupe + race switch nick)

**File chính:** `src/stores/use-zalo-messenger-store.ts`

| Cơ chế | Chi tiết |
|--------|----------|
| `dedupeInflight("messenger:fetchAccounts")` | List nick tin nhắn |
| Module-level Maps | `conversationsInflight`, `messagesInflight`, `selectConversationInflight` — key theo account/page/search/filter…; **append/page sau không dedupe** theo cùng rule “first page only” (xem code: chỉ set map khi `!append`) |
| `labelCategoriesInflight` + `labelCategoriesAbort` | Load nhãn theo `accountId`; abort nick cũ khi switch |
| `fastRepliesInflight` + `fastRepliesAbort` | Tin nhanh theo `accountId`; abort nick cũ |
| `accountSwitchGeneration` | `switchAccount`: tăng gen; sau `await` nếu gen lệch → **return**, không setSelected/fetch nick cũ |
| Single owner labels/fast-replies | `switchAccount` **không** tự load labels/tin nhanh; chỉ `useEffect` theo `selectedAccountId` (1 nguồn) |

Service hỗ trợ `signal?: AbortSignal` (khi đã wire):

- `src/services/zalo-messenger.service.ts`
- `src/services/zalo-label.service.ts`
- (group members) `src/services/zalo-group.service.ts`

### 4.6 Group members

**File:** `src/hooks/use-group-members.ts`

| Cơ chế | Key / hành vi |
|--------|----------------|
| `dedupeInflight` | `group:showMembers:${groupId}` |
| `AbortController` + `membersAbort` | Hủy load group trước khi mở group khác |
| `activeGroupIdRef` | Không apply state nếu user đã đổi group |
| Cache `membersCache` | Tránh re-fetch thừa khi quay lại cùng group (trong session UI) |

---

## 5. Cố ý **không** gộp / không coi là bug

| Hiện tượng | Lý do |
|------------|--------|
| Nhiều `get-message` / conversation detail khi scroll lịch sử | Phân trang / load more — **đúng** |
| `?_rsc=` trên localhost khi chuyển page | Next App Router RSC payload |
| Refresh sau create/edit/delete | Cần network mới — key `silent` hoặc `Date.now()` |
| `force: true` trên profile / team bootstrap | Bỏ qua TTL / skip-if-loaded |

---

## 6. Gom pattern như vậy có **ảnh hưởng code sau** không?

### 6.1 File doc này

- **Không** ảnh hưởng build, runtime, bundle.
- Chỉ giúp debug / onboarding.

### 6.2 Pattern `dedupeInflight` trong code — trade-off cần nhớ

| Tốt | Rủi ro nếu hiểu sai |
|-----|---------------------|
| 1 HTTP khi 2 effect Strict Mode | Nếu sau mutation gọi lại **cùng key** trong lúc request cũ còn chạy → dính Promise cũ (data chưa mutate) → dùng key `silent` / timestamp / đợi request xong |
| Bootstrap auth/team không nổ 2–3 lần me/permissions | TTL + skip-if-loaded: có thể **không** re-fetch trong vài giây nếu quên `force` |
| Messenger switch không dính nick cũ | Abort + gen: request abort có thể ném error — đã guard `aborted` / gen; sửa UI đừng “toast error” trên abort |
| Shared Map global | Key **phải unique theo domain** (`auth:…`, `zalo-guide:…`). Trùng key 2 module khác nhau = share nhầm Promise |

**Không** phải cache dài hạn: sau khi Promise settle, key bị xóa → lần vào page sau vẫn fetch (trừ chỗ có skip-if-loaded/TTL riêng: auth profile, team bootstrap, membersCache).

### 6.3 Khi thêm module list mới (checklist)

1. Store action list: bọc `dedupeInflight("module:fetchList:full|silent", …)`.
2. Mutation xong: `fetchList({ silent: true })` hoặc invalidate rõ ràng.
3. Không gọi list service trực tiếp từ 2 component mount song song mà bỏ store.
4. Nếu theo entity (accountId/groupId) + có thể switch nhanh: cân nhắc Abort + generation, không chỉ inflight.
5. Cập nhật **bảng §4** trong file này.

---

## 7. Troubleshooting — “lỡ lỗi sau này tìm ở đâu?”

| Triệu chứng | Gợi ý file / key |
|-------------|------------------|
| `/guides` double `tutorial/get` | `use-zalo-guide-store.ts` → `zalo-guide:fetchGuides:…` |
| `/resource` double resource + product-app | `use-zalo-resource-store.ts` → `zalo-resource:fetchAll:…` |
| Birthday: double category / video / album / results | `use-zalo-birthday-campaign-store.ts` — `fetchCampaign`, `fetchMediaLibraries`, `refreshResults` |
| Campaign notification ×2 | `use-zalo-campaign-notification-store.ts` → `campaign-notification:fetchAll` |
| Admin users `get-all-account` ×2 | `use-zalo-user-admin-store.ts` → `user-admin:fetchUsers:…` |
| Admin settings popup GET ×2 (mọi tab) | `admin-settings.service.ts` — `listAlerts`, `getCommunityPopup`, `getExpiration`, `getLogo`, `getRegisterPopup`, `getTermPopup`, `getDecreePopup` |
| 404 `…/message/video/show` hoặc `album/show` | Path cũ đã gỡ — dùng `GET /api/message/video` · `GET /api/message/album` (`API_MESSAGE_MEDIA`) |
| Login / F5 double me / permissions / accounts | `use-auth-store.ts`, `use-team-collaboration-store.ts` |
| List kịch bản / accounts campaign ×2 | Store campaign tương ứng §4.4 |
| Đổi nick tin nhắn vẫn gọi API nick cũ / data đè | `use-zalo-messenger-store.ts`: `accountSwitchGeneration`, abort maps labels/fast-replies |
| Mở panel thành viên nhóm 2–3 `show` | `use-group-members.ts` |
| Sau create employee list không mới | `TeamEmployeesView` — background load dùng key `refresh:${Date.now()}`; đừng đổi thành key cố định |
| Sau edit guide/resource UI không cập nhật | Kiểm tra mutation còn `fetch*({ silent: true })` không; silent key có bị gỡ không |
| Profile “không cập nhật” trong vài giây | `PROFILE_FETCH_TTL_MS` / `fetchProfile({ force: true })` |
| Tìm mọi chỗ bọc dedupe | `rg dedupeInflight src` hoặc `rg 'Inflight' src/stores` |

**Gỡ tạm để so sánh (dev):** comment `return dedupeInflight(...)` → gọi thẳng `fn` / body HTTP; xem Network có lại ×2 không. **Đừng commit** trạng thái gỡ trừ khi cố ý rollback.

---

## 8. Lệnh rà soát nhanh

```bash
# Tất cả file dùng dedupeInflight
rg -l 'dedupeInflight' src

# Key string
rg 'dedupeInflight\(' src -A 2

# Inflight map local (messenger…)
rg 'Inflight|accountSwitchGeneration|AbortController' src/stores src/hooks
```

---

## 9. Lịch sử ngắn (bối cảnh session)

Làm lần lượt theo Network curl user báo:

1. Messenger: conversation detail, category/fast-reply, race switch nick, group members.
2. Auth bootstrap: me + permissions + accounts (bỏ double `bootstrapTeamContext`).
3. Accounts page + team employees + campaign lists/accounts.
4. Guides `tutorial/get` + Resource `resource/get` + `product-app/get`.

Utility chung `src/lib/inflight.ts` ra đời để không copy Map Promise khắp nơi; messenger giữ thêm Map + Abort riêng vì lifecycle phức tạp hơn list CRUD.

---

*Cập nhật doc này mỗi khi thêm/bớt `dedupeInflight` hoặc đổi TTL/skip/generation liên quan fetch.*
