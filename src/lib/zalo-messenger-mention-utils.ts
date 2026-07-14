import { getGroupMemberDisplay } from "@/lib/zalo-contacts-utils";
import type { ZaloGroupMember } from "@/types/zalo-contacts";
import type { MessengerMentionInfo } from "@/types/zalo-messenger";

export function getGroupMemberName(member: ZaloGroupMember): string {
  return getGroupMemberDisplay(member).name;
}

export function getGroupMemberAvatar(member: ZaloGroupMember): string | null {
  return getGroupMemberDisplay(member).avatar;
}

export function getGroupMemberUid(member: ZaloGroupMember): string {
  return member.friend?.uid?.trim() || "";
}

export function filterMentionSuggestions(
  members: ZaloGroupMember[],
  query: string,
  excludedIds: number[] = [],
): ZaloGroupMember[] {
  const excluded = new Set(excludedIds);
  const normalized = query.trim().toLowerCase();

  return members
    .filter((member) => !excluded.has(member.id))
    .filter((member) => {
      if (!normalized) return true;
      return getGroupMemberName(member).toLowerCase().includes(normalized);
    });
}

function findMentionPositions(text: string, mention: string) {
  const positions: Array<{ pos: number; len: number }> = [];
  let startIndex = 0;
  while ((startIndex = text.indexOf(mention, startIndex)) !== -1) {
    positions.push({ pos: startIndex, len: mention.length });
    startIndex += mention.length;
  }
  return positions;
}

export function calculateMentionInfo(
  text: string,
  taggedMembers: ZaloGroupMember[],
): MessengerMentionInfo[] {
  if (!text || taggedMembers.length === 0) return [];

  const mentionInfo: MessengerMentionInfo[] = [];
  const words = text.split(" ");

  let index = 0;
  while (index < words.length) {
    const word = words[index];
    if (!word.startsWith("@")) {
      index += 1;
      continue;
    }

    const taggedName = word.slice(1);
    let tempIndex = index + 1;
    let matched = false;

    while (tempIndex < words.length) {
      const potentialName = words.slice(index + 1, tempIndex + 1).join(" ");
      const fullName = `${taggedName} ${potentialName}`.trim();
      const member = taggedMembers.find(
        (item) => getGroupMemberName(item) === fullName,
      );

      if (member) {
        const positions = findMentionPositions(text, `@${fullName}`);
        const position = positions[0];
        if (position) {
          mentionInfo.push({
            pos: position.pos,
            len: position.len,
            uid: getGroupMemberUid(member),
            type: 0,
          });
        }
        index = tempIndex + 1;
        matched = true;
        break;
      }
      tempIndex += 1;
    }

    if (!matched) index += 1;
  }

  return mentionInfo;
}

export function isMentionAllText(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed === "@all" || /@all\b/.test(trimmed);
}