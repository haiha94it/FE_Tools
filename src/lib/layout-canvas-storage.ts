/**
 * Client storage for layout canvas: draft, versions, export/import.
 */

import type {
  LayoutCanvasDocument,
  LayoutCanvasVersionMeta,
  LayoutSection,
} from "@/types/shop-layout-canvas";
import type { ShopPersonalizationData } from "@/types/zalo-shop";

const DRAFT_PREFIX = "zalo_shop_layout_draft_v1:";
const VERSIONS_PREFIX = "zalo_shop_layout_versions_v1:";
const PREVIEW_KEY = "zalo_shop_layout_preview_draft";

export function draftStorageKey(userId: string): string {
  return `${DRAFT_PREFIX}${userId || "anon"}`;
}

export function versionsStorageKey(userId: string): string {
  return `${VERSIONS_PREFIX}${userId || "anon"}`;
}

export interface LayoutDraftPayload {
  savedAt: string;
  personalization: ShopPersonalizationData;
}

export function saveLayoutDraft(
  userId: string,
  personalization: ShopPersonalizationData,
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: LayoutDraftPayload = {
      savedAt: new Date().toISOString(),
      personalization,
    };
    localStorage.setItem(draftStorageKey(userId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function loadLayoutDraft(userId: string): LayoutDraftPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftStorageKey(userId));
    if (!raw) return null;
    return JSON.parse(raw) as LayoutDraftPayload;
  } catch {
    return null;
  }
}

export function clearLayoutDraft(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(draftStorageKey(userId));
  } catch {
    /* ignore */
  }
}

/** Write draft for storefront ?preview=1 */
export function writePreviewDraft(
  sellerId: string,
  personalization: ShopPersonalizationData,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      PREVIEW_KEY,
      JSON.stringify({
        sellerId,
        personalization,
        at: Date.now(),
      }),
    );
  } catch {
    /* ignore */
  }
}

export function readPreviewDraft(
  sellerId: string,
): ShopPersonalizationData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PREVIEW_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      sellerId: string;
      personalization: ShopPersonalizationData;
      at: number;
    };
    if (String(parsed.sellerId) !== String(sellerId)) return null;
    // expire 2h
    if (Date.now() - parsed.at > 2 * 60 * 60 * 1000) return null;
    return parsed.personalization;
  } catch {
    return null;
  }
}

export function clearPreviewDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PREVIEW_KEY);
  } catch {
    /* ignore */
  }
}

const MAX_VERSIONS = 12;

export function listLayoutVersions(userId: string): LayoutCanvasVersionMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(versionsStorageKey(userId));
    if (!raw) return [];
    return JSON.parse(raw) as LayoutCanvasVersionMeta[];
  } catch {
    return [];
  }
}

export function pushLayoutVersion(
  userId: string,
  name: string,
  doc: LayoutCanvasDocument,
): LayoutCanvasVersionMeta[] {
  if (typeof window === "undefined") return [];
  const next: LayoutCanvasVersionMeta = {
    id: `ver_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || `Bản ${new Date().toLocaleString("vi-VN")}`,
    createdAt: new Date().toISOString(),
    sectionsSnapshot: JSON.parse(JSON.stringify(doc.sections)) as LayoutSection[],
    pageSnapshot: doc.page ? { ...doc.page } : undefined,
  };
  const list = [next, ...listLayoutVersions(userId)].slice(0, MAX_VERSIONS);
  try {
    localStorage.setItem(versionsStorageKey(userId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

export function deleteLayoutVersion(userId: string, versionId: string): LayoutCanvasVersionMeta[] {
  const list = listLayoutVersions(userId).filter((v) => v.id !== versionId);
  try {
    localStorage.setItem(versionsStorageKey(userId), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  return list;
}

/** Export document as downloadable JSON */
export function exportLayoutDocument(doc: LayoutCanvasDocument, filename?: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(doc, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `layout-canvas-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseImportedLayout(json: string): LayoutCanvasDocument | null {
  try {
    const data = JSON.parse(json) as LayoutCanvasDocument;
    if (!data || !Array.isArray(data.sections)) return null;
    return {
      schemaVersion: 1,
      sections: data.sections,
      page: data.page,
      versions: data.versions,
    };
  } catch {
    return null;
  }
}

export async function importLayoutFromFile(
  file: File,
): Promise<LayoutCanvasDocument | null> {
  const text = await file.text();
  return parseImportedLayout(text);
}
