import { isApiEnvelope, unwrapApiBody } from "@/lib/api-response";
import type {
  PaginatedResponse,
  ZaloFriendItem,
  ZaloGroupItem,
  ZaloGroupMember,
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
    return {
      id,
      name: typeof record.name === "string" ? record.name : null,
      avatar: typeof record.avatar === "string" ? record.avatar : null,
      avt: typeof record.avt === "string" ? record.avt : null,
      total_member:
        typeof record.total_member === "number"
          ? record.total_member
          : typeof record.totalMember === "number"
            ? record.totalMember
            : null,
      link_group:
        typeof record.link_group === "string" ? record.link_group : null,
    };
  }

  return { id };
}

export function normalizeZaloFriendItem(raw: unknown): ZaloFriendItem | null {
  const id = resolveContactId(raw);
  if (id == null) return null;

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    return {
      id,
      name: typeof record.name === "string" ? record.name : null,
      alias_name:
        typeof record.alias_name === "string" ? record.alias_name : null,
      uid: typeof record.uid === "string" ? record.uid : null,
      avatar: typeof record.avatar === "string" ? record.avatar : null,
      avt: typeof record.avt === "string" ? record.avt : null,
      gender: typeof record.gender === "string" ? record.gender : null,
      sdob: typeof record.sdob === "string" ? record.sdob : null,
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

/** Một số thành viên nhóm API trả `friend: null` */
export function getGroupMemberDisplay(member: ZaloGroupMember): {
  key: string | number;
  name: string;
  avatar: string | null;
} {
  const friend = member.friend;
  const name =
    friend?.name?.trim() ||
    friend?.uid?.trim() ||
    (member.id ? `Thành viên #${member.id}` : "Thành viên");

  return {
    key: member.id ?? friend?.id ?? name,
    name,
    avatar: friend ? getZaloGroupAvatar(friend) : null,
  };
}