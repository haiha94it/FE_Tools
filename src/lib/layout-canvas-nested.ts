/**
 * Deep find / update sections lồng trong CONTAINER.nestedBlocks
 */

import type { LayoutSection } from "@/types/shop-layout-canvas";

export type DeepSectionPatch = {
  enabled?: boolean;
  widthPreset?: LayoutSection["widthPreset"];
  widthPresetMobile?: LayoutSection["widthPresetMobile"];
  styling?: Partial<LayoutSection["styling"]>;
  stylingMobile?: Partial<NonNullable<LayoutSection["stylingMobile"]>>;
  label?: string;
  groupId?: string | null;
  editorLocked?: boolean;
  data?: Record<string, unknown>;
};

export function findSectionDeep(
  sections: LayoutSection[],
  id: string,
): LayoutSection | null {
  for (const sec of sections) {
    if (sec.id === id) return sec;
    if (sec.type === "CONTAINER") {
      const found = findSectionDeep(sec.data.nestedBlocks ?? [], id);
      if (found) return found;
    }
  }
  return null;
}

/** Parent container id nếu section nằm trong nestedBlocks (mọi tầng) */
export function findParentContainerId(
  sections: LayoutSection[],
  childId: string,
): string | null {
  for (const sec of sections) {
    if (sec.type !== "CONTAINER") continue;
    const nested = sec.data.nestedBlocks ?? [];
    if (nested.some((b) => b.id === childId)) return sec.id;
    const deeper = findParentContainerId(nested, childId);
    if (deeper) return deeper;
  }
  return null;
}

function applyPatch(sec: LayoutSection, update: DeepSectionPatch): LayoutSection {
  return {
    ...sec,
    ...(update.enabled !== undefined ? { enabled: update.enabled } : {}),
    ...(update.widthPreset ? { widthPreset: update.widthPreset } : {}),
    ...(update.widthPresetMobile !== undefined
      ? { widthPresetMobile: update.widthPresetMobile }
      : {}),
    ...(update.label !== undefined ? { label: update.label } : {}),
    ...(update.groupId !== undefined ? { groupId: update.groupId } : {}),
    ...(update.editorLocked !== undefined
      ? { editorLocked: update.editorLocked }
      : {}),
    styling: update.styling
      ? { ...sec.styling, ...update.styling }
      : sec.styling,
    stylingMobile: update.stylingMobile
      ? { ...(sec.stylingMobile ?? {}), ...update.stylingMobile }
      : sec.stylingMobile,
    data: update.data ? { ...sec.data, ...update.data } : sec.data,
  } as LayoutSection;
}

export function updateSectionDeep(
  sections: LayoutSection[],
  id: string,
  update: DeepSectionPatch,
): LayoutSection[] {
  let anyChanged = false;
  const next = sections.map((sec) => {
    if (sec.id === id) {
      anyChanged = true;
      return applyPatch(sec, update);
    }

    if (sec.type === "CONTAINER") {
      const nested = sec.data.nestedBlocks ?? [];
      if (nested.length === 0) return sec;
      const nextNested = updateSectionDeep(nested, id, update);
      if (nextNested === nested) return sec;
      // reference equality: updateSectionDeep always returns new array if changed
      const nestedChanged = nextNested.some((b, i) => b !== nested[i]) ||
        nextNested.length !== nested.length;
      if (!nestedChanged) return sec;
      anyChanged = true;
      return {
        ...sec,
        data: {
          ...sec.data,
          nestedBlocks: nextNested,
        },
      } as LayoutSection;
    }
    return sec;
  });
  return anyChanged ? next : sections;
}

export function deleteSectionDeep(
  sections: LayoutSection[],
  id: string,
): LayoutSection[] {
  const filtered = sections.filter((s) => s.id !== id);
  return filtered.map((sec) => {
    if (sec.type !== "CONTAINER") return sec;
    const nested = sec.data.nestedBlocks ?? [];
    if (nested.length === 0) return sec;
    return {
      ...sec,
      data: {
        ...sec.data,
        nestedBlocks: deleteSectionDeep(nested, id),
      },
    } as LayoutSection;
  });
}

export function isTopLevelSection(
  sections: LayoutSection[],
  id: string,
): boolean {
  return sections.some((s) => s.id === id);
}
