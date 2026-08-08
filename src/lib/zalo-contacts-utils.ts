import { isApiEnvelope, unwrapApiBody } from "@/lib/api-response";
import type {
  PaginatedResponse,
  ZaloFriendItem,
  ZaloGroupItem,
  ZaloGroupMember,
  ZaloSentFriendRequestItem,
} from "@/types/zalo-contacts";

type RawContact = number | string | Record<string, unknown>;

export function resolveContactId(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const record = raw as Record<string, unknown>;
  for (const key of ["id", "id_group", "id_friend", "pk"]) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

export function normalizeZaloGroupItem(raw: unknown): ZaloGroupItem | null {
  const id = resolveContactId(raw);
  if (id == null) return null;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    const profile =
      record.global_profile &&
      typeof record.global_profile === "object" &&
      !Array.isArray(record.global_profile)
        ? (record.global_profile as Record<string, unknown>)
        : null;

    const nameFromProfile =
      typeof profile?.name === "string" ? profile.name : null;
    const avatarFromProfile =
      typeof profile?.avatar === "string"
        ? profile.avatar
        : typeof profile?.avt === "string"
          ? profile.avt
          : null;

    return {
      id,
      name:
        (typeof record.name === "string" ? record.name : null) ||
        nameFromProfile,
      avatar:
        (typeof record.avatar === "string" ? record.avatar : null) ||
        avatarFromProfile,
      avt:
        (typeof record.avt === "string" ? record.avt : null) ||
        avatarFromProfile,
      total_member: (() => {
        const raw =
          record.total_member ?? record.totalMember ?? null;
        if (typeof raw === "number" && Number.isFinite(raw)) return raw;
        if (typeof raw === "string" && raw.trim()) {
          const n = Number(raw);
          return Number.isFinite(n) ? n : null;
        }
        return null;
      })(),
      link_group:
        typeof record.link_group === "string" ? record.link_group : null,
    };
  }

  return { id };
}

/** BE: gender 0 = Nam, 1 = Nữ (số). Giữ số để không mất `0` khi truthy-check. */
export function normalizeZaloFriendGender(
  value: unknown,
): ZaloFriendItem["gender"] {
  if (value === 0 || value === 1) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const trimmed = value.trim();
    if (trimmed === "0" || trimmed === "1") return Number(trimmed) as 0 | 1;
    // legacy text
    const lower = trimmed.toLowerCase();
    if (lower === "nam" || lower === "male") return 0;
    if (lower === "nữ" || lower === "nu" || lower === "female") return 1;
    const asNum = Number(trimmed);
    if (Number.isFinite(asNum)) return asNum;
    return trimmed;
  }
  return null;
}

/** Hiển thị UI: 0 → Nam, 1 → Nữ */
export function formatZaloFriendGender(
  gender?: ZaloFriendItem["gender"],
): string {
  if (gender === 0 || gender === "0") return "Nam";
  if (gender === 1 || gender === "1") return "Nữ";
  if (typeof gender === "string" && gender.trim()) return gender.trim();
  if (typeof gender === "number" && Number.isFinite(gender)) {
    return String(gender);
  }
  return "—";
}

export function normalizeZaloFriendItem(raw: unknown): ZaloFriendItem | null {
  const id = resolveContactId(raw);
  if (id == null) return null;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    const profile =
      record.global_profile &&
      typeof record.global_profile === "object" &&
      !Array.isArray(record.global_profile)
        ? (record.global_profile as Record<string, unknown>)
        : null;

    const nameFromProfile =
      typeof profile?.name === "string" ? profile.name : null;
    const avatarFromProfile =
      typeof profile?.avatar === "string"
        ? profile.avatar
        : typeof profile?.avt === "string"
          ? profile.avt
          : null;
    const uidRaw = record.uid ?? record.userId ?? record.user_id ?? profile?.uid;
    const uid =
      typeof uidRaw === "string"
        ? uidRaw
        : typeof uidRaw === "number" && Number.isFinite(uidRaw)
          ? String(uidRaw)
          : null;

    return {
      id,
      name:
        (typeof record.name === "string" ? record.name : null) ||
        (typeof record.alias_name === "string" ? record.alias_name : null) ||
        nameFromProfile,
      alias_name:
        typeof record.alias_name === "string" ? record.alias_name : null,
      uid,
      avatar:
        (typeof record.avatar === "string" ? record.avatar : null) ||
        avatarFromProfile,
      avt:
        (typeof record.avt === "string" ? record.avt : null) ||
        avatarFromProfile,
      gender: normalizeZaloFriendGender(record.gender),
      sdob:
        typeof record.sdob === "string" && record.sdob.trim()
          ? record.sdob.trim()
          : null,
    };
  }

  return { id };
}

export function normalizeZaloGroupList(items: unknown[]): ZaloGroupItem[] {
  return items
    .map((item) => normalizeZaloGroupItem(item))
    .filter((item): item is ZaloGroupItem => item != null);
}

export function normalizeZaloFriendList(items: unknown[]): ZaloFriendItem[] {
  return items
    .map((item) => normalizeZaloFriendItem(item))
    .filter((item): item is ZaloFriendItem => item != null);
}

/** List gợi ý kết bạn / lời mời recommend (raw Zalo) */
export function normalizeZaloFriendRecommendItem(
  raw: unknown,
): import("@/types/zalo-contacts").ZaloFriendRecommendItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const userIdRaw =
    record.userId ?? record.user_id ?? record.uid ?? record.fid;
  const userId =
    typeof userIdRaw === "string"
      ? userIdRaw.trim()
      : typeof userIdRaw === "number" && Number.isFinite(userIdRaw)
        ? String(userIdRaw)
        : null;
  const name =
    typeof record.zaloName === "string"
      ? record.zaloName
      : typeof record.name === "string"
        ? record.name
        : typeof record.displayName === "string"
          ? record.displayName
          : null;
  const avatar =
    typeof record.avatar === "string"
      ? record.avatar
      : typeof record.avt === "string"
        ? record.avt
        : null;
  const type =
    typeof record.type === "string"
      ? record.type
      : typeof record.recomType === "string"
        ? record.recomType
        : undefined;
  const id =
    typeof record.id === "number" && Number.isFinite(record.id)
      ? record.id
      : undefined;

  if (!userId && !name) return null;

  return {
    id,
    userId: userId || undefined,
    uid: userId || undefined,
    name,
    zaloName: name,
    avatar,
    type,
  };
}

export function normalizeZaloFriendRecommendList(
  items: unknown[],
): import("@/types/zalo-contacts").ZaloFriendRecommendItem[] {
  return items
    .map((item) => normalizeZaloFriendRecommendItem(item))
    .filter(
      (
        item,
      ): item is import("@/types/zalo-contacts").ZaloFriendRecommendItem =>
        item != null,
    );
}

export function getRecommendFriendFid(
  item: Pick<
    import("@/types/zalo-contacts").ZaloFriendRecommendItem,
    "userId" | "uid"
  >,
): string | null {
  const fid = (item.userId || item.uid || "").trim();
  return fid || null;
}

/** List lời mời đã gửi — show endpoint có gender 0/1 */
export function normalizeZaloSentFriendRequestItem(
  raw: unknown,
): ZaloSentFriendRequestItem | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const id =
    typeof record.id === "number" && Number.isFinite(record.id)
      ? record.id
      : undefined;
  const name =
    typeof record.name === "string"
      ? record.name
      : typeof record.zaloName === "string"
        ? record.zaloName
        : null;
  const uid =
    typeof record.uid === "string"
      ? record.uid
      : typeof record.userId === "string"
        ? record.userId
        : typeof record.user_id === "string"
          ? record.user_id
          : null;
  const avatar =
    typeof record.avatar === "string"
      ? record.avatar
      : typeof record.avt === "string"
        ? record.avt
        : null;

  if (id == null && !name && !uid) return null;

  return {
    id,
    name,
    uid,
    avatar,
    gender: normalizeZaloFriendGender(record.gender),
  };
}

export function normalizeZaloSentFriendRequestList(
  items: unknown[],
): ZaloSentFriendRequestItem[] {
  return items
    .map((item) => normalizeZaloSentFriendRequestItem(item))
    .filter((item): item is ZaloSentFriendRequestItem => item != null);
}

export function getZaloGroupDisplayName(group: ZaloGroupItem): string {
  return group.name?.trim() || `Nhóm #${group.id}`;
}

export function getZaloFriendDisplayName(friend: ZaloFriendItem): string {
  return (
    friend.alias_name?.trim() ||
    friend.name?.trim() ||
    friend.uid?.trim() ||
    `Bạn #${friend.id}`
  );
}

/** POST /api/group|friend/fetchs — backend nhận mảng id, không phải object */
export function buildGroupFetchPayload(items: unknown[]): number[] {
  return normalizeZaloGroupList(items).map((item) => item.id);
}

export function buildFriendFetchPayload(items: unknown[]): number[] {
  return normalizeZaloFriendList(items).map((item) => item.id);
}

export function extractPaginated<T>(data: unknown): PaginatedResponse<T> {
  const body = isApiEnvelope(data) ? unwrapApiBody<unknown>(data) : data;

  if (Array.isArray(body)) {
    return { results: body as T[], count: body.length };
  }

  if (body && typeof body === "object") {
    const record = body as PaginatedResponse<T>;
    return {
      results: record.results ?? [],
      count: record.count,
      next: record.next,
      previous: record.previous,
    };
  }

  return { results: [] };
}

export function getScanTaskStatus(
  result: { task_status?: string; status?: string },
): string | undefined {
  return result.task_status ?? result.status;
}

export function isScanTaskDone(status?: string): boolean {
  return (
    status === "SUCCESS" ||
    status === "FAILURE" ||
    status === "FAILED" ||
    status === "REVOKED"
  );
}

/** API nhóm/bạn bè có thể trả `avatar` hoặc `avt` */
export function getZaloGroupAvatar(item: {
  avatar?: string | null;
  avt?: string | null;
}): string | null {
  const url = item.avatar?.trim() || item.avt?.trim();
  return url || null;
}

/** Gộp chi tiết (avatar) từ API fetchs vào danh sách simple */
export function mergeContactDetails<T extends { id: number }>(
  items: T[],
  details: T[],
): T[] {
  if (!details.length) return items;
  const detailMap = new Map(
    details
      .map((item) => {
        const id = resolveContactId(item);
        return id != null ? ([id, item] as const) : null;
      })
      .filter((entry): entry is readonly [number, T] => entry != null),
  );
  return items.map((item) => {
    const id = resolveContactId(item);
    const detail = id != null ? detailMap.get(id) : undefined;
    return detail ? { ...item, ...detail, id } : item;
  });
}

function extractContactList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const record = data as { results?: T[]; data?: T[] };
    return record.results ?? record.data ?? [];
  }
  return [];
}

/** Unwrap response POST /api/group|friend/fetchs */
export function extractFetchedContacts<T>(data: unknown): T[] {
  const body = isApiEnvelope(data) ? unwrapApiBody<unknown>(data) : data;
  return extractContactList<T>(body);
}

/**
 * Label / avatar member — living doc 2026-07-17:
 * friend.name → alias_name → uid; friend null = Tôi/Admin.
 */
export function getGroupMemberDisplay(member: ZaloGroupMember): {
  key: string | number;
  name: string;
  avatar: string | null;
  friendId: number | null;
  selectable: boolean;
} {
  const friend = member.friend;
  if (!friend) {
    const name = member.is_creator
      ? "Tôi (chủ nhóm)"
      : member.is_admin
        ? "Admin"
        : "Thành viên";
    return {
      key: member.id ?? name,
      name,
      avatar: null,
      friendId: null,
      selectable: false,
    };
  }

  const name =
    friend.name?.trim() ||
    friend.alias_name?.trim() ||
    friend.uid?.trim() ||
    `Friend #${friend.id}`;

  return {
    key: friend.id ?? member.id ?? name,
    name,
    avatar: getZaloGroupAvatar(friend),
    friendId: friend.id ?? null,
    selectable: friend.id != null,
  };
}

/** FriendModel.id — value chọn campaign / queue (không membership.id) */
export function getGroupMemberSelectId(member: ZaloGroupMember): number | null {
  return member.friend?.id ?? null;
}

export function filterSelectableGroupMembers(
  members: ZaloGroupMember[],
): ZaloGroupMember[] {
  return members.filter((member) => member.friend?.id != null);
}

function parseRelationStatus(raw: unknown): number | undefined {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseIsFriendFlag(
  rawIsFriend: unknown,
  relationStatus: number | undefined,
): boolean | undefined {
  if (rawIsFriend === true || rawIsFriend === 1 || rawIsFriend === "1") {
    return true;
  }
  if (rawIsFriend === false || rawIsFriend === 0 || rawIsFriend === "0") {
    return false;
  }
  if (relationStatus === 1) return true;
  if (relationStatus != null) return false;
  return undefined;
}

export function normalizeGroupMember(raw: unknown): ZaloGroupMember | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  const membershipId =
    typeof record.id === "number" && Number.isFinite(record.id)
      ? record.id
      : null;

  let friend: ZaloGroupMember["friend"] = null;
  if (record.friend && typeof record.friend === "object" && !Array.isArray(record.friend)) {
    const f = record.friend as Record<string, unknown>;
    const friendId =
      typeof f.id === "number" && Number.isFinite(f.id)
        ? f.id
        : typeof f.id === "string" && f.id.trim() && Number.isFinite(Number(f.id))
          ? Number(f.id)
          : null;
    const uidRaw = f.uid;
    const uid =
      typeof uidRaw === "string"
        ? uidRaw
        : uidRaw != null && uidRaw !== ""
          ? String(uidRaw)
          : "";

    // Có FriendModel (id) hoặc ít nhất uid — giữ payload quan hệ
    if (friendId != null || uid) {
      const profile =
        f.global_profile &&
        typeof f.global_profile === "object" &&
        !Array.isArray(f.global_profile)
          ? (f.global_profile as Record<string, unknown>)
          : null;
      const nameFromProfile =
        typeof profile?.name === "string" ? profile.name : null;
      const avatarFromProfile =
        typeof profile?.avatar === "string"
          ? profile.avatar
          : typeof profile?.avt === "string"
            ? profile.avt
            : null;

      const relation_status = parseRelationStatus(f.relation_status);
      const is_friend = parseIsFriendFlag(f.is_friend, relation_status);

      friend = {
        id: friendId,
        uid,
        name:
          (typeof f.name === "string" ? f.name : null) ||
          (typeof f.alias_name === "string" ? f.alias_name : null) ||
          nameFromProfile ||
          "",
        alias_name:
          typeof f.alias_name === "string" ? f.alias_name : undefined,
        avatar:
          (typeof f.avatar === "string" ? f.avatar : null) ||
          avatarFromProfile,
        avt:
          (typeof f.avt === "string" ? f.avt : null) || avatarFromProfile,
        phone_number:
          typeof f.phone_number === "string" ? f.phone_number : null,
        ...(relation_status !== undefined ? { relation_status } : {}),
        ...(is_friend !== undefined ? { is_friend } : {}),
      };
    }
  }

  if (membershipId == null && !friend) return null;

  return {
    id: membershipId ?? friend?.id ?? 0,
    friend,
    is_admin: Boolean(record.is_admin),
    is_creator: Boolean(record.is_creator),
  };
}

export function normalizeGroupMemberList(items: unknown[]): ZaloGroupMember[] {
  return items
    .map((item) => normalizeGroupMember(item))
    .filter((item): item is ZaloGroupMember => item != null);
}

/**
 * Unwrap get-member poll:
 * data.result.data  (Celery SUCCESS + zalo envelope lồng)
 * living doc 2026-07-17
 */
export function extractGroupMembersFromPoll(body: unknown): {
  members: ZaloGroupMember[];
  groupName?: string;
  totalMember?: number;
} {
  if (!body) return { members: [] };

  // Already array of members
  if (Array.isArray(body)) {
    return { members: normalizeGroupMemberList(body) };
  }

  if (typeof body !== "object") return { members: [] };
  const record = body as Record<string, unknown>;

  // Celery SUCCESS payload may be nested at result
  const status =
    (typeof record.task_status === "string" ? record.task_status : undefined) ??
    (typeof record.status === "string" ? record.status : undefined);

  let payload: unknown =
    status === "SUCCESS" ? (record.result ?? record.data) : record.data;
  if (payload == null && status !== "SUCCESS") {
    // show endpoint: envelope already unwrapped to zalo payload or list
    payload = "data" in record ? record.data : body;
  }

  // Nested zalo envelope: { success, data: members[], group_name, total_member }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const nested = payload as Record<string, unknown>;
    if (Array.isArray(nested.data)) {
      return {
        members: normalizeGroupMemberList(nested.data),
        groupName:
          typeof nested.group_name === "string" ? nested.group_name : undefined,
        totalMember:
          typeof nested.total_member === "number"
            ? nested.total_member
            : typeof nested.total_member === "string"
              ? Number(nested.total_member) || undefined
              : undefined,
      };
    }
    if (Array.isArray(nested.results)) {
      return { members: normalizeGroupMemberList(nested.results) };
    }
  }

  if (Array.isArray(payload)) {
    return { members: normalizeGroupMemberList(payload) };
  }

  // Fallback: body itself has data/results
  if (Array.isArray(record.data)) {
    return {
      members: normalizeGroupMemberList(record.data),
      groupName:
        typeof record.group_name === "string" ? record.group_name : undefined,
      totalMember:
        typeof record.total_member === "number"
          ? record.total_member
          : undefined,
    };
  }

  return { members: [] };
}