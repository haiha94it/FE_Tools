/**
 * LayoutCanvas — WordPress-style visual page builder.
 *
 * Layout (Gutenberg-inspired):
 * ┌──────────┬────────────────────────────┬────────────┐
 * │ Inserter │   WYSIWYG page canvas      │ (parent    │
 * │ / List   │   blue outline + toolbar   │  Inspector)│
 * └──────────┴────────────────────────────┴────────────┘
 *
 * Data model unchanged: LayoutSection[] via onSectionsChange.
 */

"use client";

import { toast } from "@/lib/toast";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DragStart,
  type DragUpdate,
  type DropResult,
  type DraggableProvided,
  type DraggableStateSnapshot,
  type DroppableProvided,
  type DroppableStateSnapshot,
} from "@hello-pangea/dnd";
import {
  deleteSectionDeep,
  findSectionDeep,
  updateSectionDeep,
} from "@/lib/layout-canvas-nested";
import {
  cloneSection,
  createSection,
  LAYOUT_SECTION_TYPE_META,
  moveSectionWithGroup,
  reorderSectionsWithGroup,
} from "@/lib/shop-layout-canvas";
import type {
  LayoutSection,
  LayoutSectionStyling,
  LayoutSectionType,
} from "@/types/shop-layout-canvas";
import type { ShopCategory, ShopProduct } from "@/types/zalo-shop";
import React, {
  Component,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiCode,
  FiCommand,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiGrid,
  FiLayers,
  FiMonitor,
  FiMoreHorizontal,
  FiPlus,
  FiRotateCcw,
  FiRotateCw,
  FiSearch,
  FiSmartphone,
  FiTrash2,
  FiZap,
} from "react-icons/fi";
import { getSectionTypeBadge, getSectionTypeLabel } from "./section-cards";
import SectionRenderer from "./renderers/SectionRenderer";
import type { LayoutRenderTheme } from "./renderers/section-style-utils";
import PageTemplateModal from "./PageTemplateModal";
import QRCodePreviewModal from "./QRCodePreviewModal";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";
import AiUiImporterModal from "./AiUiImporterModal";

/* ─────────────────────────────────────────────────────────────
 * Public API
 * ───────────────────────────────────────────────────────────── */

export type CanvasDevice = "desktop" | "tablet" | "mobile";
export type CanvasDensity = "preview" | "compact";
export type CanvasLeftPanel = "inserter" | "list";

export interface LayoutCanvasProps {
  sections: LayoutSection[];
  activeSectionId: string | null;
  onSectionsChange: (next: LayoutSection[]) => void;
  onSelectSection: (id: string | null) => void;
  onOpenSectionSettings?: (id: string) => void;
  products?: ShopProduct[];
  categories?: ShopCategory[];
  theme?: LayoutRenderTheme;
  dataLoading?: boolean;
  className?: string;
  disabled?: boolean;
  devicePreview?: CanvasDevice;
  onDevicePreviewChange?: (device: CanvasDevice) => void;
  /**
   * Khi true, canvas chiếm full height cha (builder shell).
   * @default true
   */
  fillHeight?: boolean;
}

const HISTORY_LIMIT = 50;

/** WordPress-like accent for selection chrome */
const WP_BLUE = "#3858e9";

/** HTML5 drag MIME — kéo khối từ Inserter thả vào gap */
export const LAYOUT_BLOCK_DND_MIME = "application/x-zalo-layout-block";

/* ─────────────────────────────────────────────────────────────
 * Block catalog groups (WP inserter categories)
 * ───────────────────────────────────────────────────────────── */

const BLOCK_GROUPS: {
  id: string;
  label: string;
  types: LayoutSectionType[];
}[] = [
  {
    id: "layout",
    label: "Cấu trúc trang",
    types: [
      "ANNOUNCEMENT",
      "HEADER",
      "HERO",
      "CONTAINER",
      "IMAGE_BANNER",
      "SPACER",
      "DIVIDER",
    ],
  },
  {
    id: "commerce",
    label: "Thương mại",
    types: [
      "CATEGORY_RAIL",
      "FLASH_SALE",
      "COUPONS",
      "HOT_PRODUCTS",
      "PRODUCT_CAROUSEL",
      "PRODUCT_GRID",
      "TRUST_BADGES",
    ],
  },
  {
    id: "content",
    label: "Nội dung & Media",
    types: [
      "TEXT_BLOCK",
      "EDITORIAL",
      "VIDEO_BLOCK",
      "GALLERY",
      "FEATURE_GRID",
      "STATS",
      "LOGO_CLOUD",
      "FAQ",
      "REVIEWS",
    ],
  },
  {
    id: "conversion",
    label: "Chuyển đổi",
    types: ["CTA_BANNER", "NEWSLETTER", "CONTACT_FOOTER"],
  },
];

const BLOCK_ICON: Partial<Record<LayoutSectionType, string>> = {
  ANNOUNCEMENT: "📢",
  HEADER: "☰",
  HERO: "🖼",
  TRUST_BADGES: "✓",
  CATEGORY_RAIL: "🏷",
  FLASH_SALE: "⚡",
  COUPONS: "%",
  HOT_PRODUCTS: "★",
  PRODUCT_GRID: "▦",
  PRODUCT_CAROUSEL: "⇄",
  EDITORIAL: "✎",
  REVIEWS: "💬",
  CONTACT_FOOTER: "☎",
  IMAGE_BANNER: "🌄",
  VIDEO_BLOCK: "▶",
  TEXT_BLOCK: "Aa",
  CTA_BANNER: "➤",
  FEATURE_GRID: "✦",
  STATS: "123",
  GALLERY: "▦",
  LOGO_CLOUD: "◈",
  FAQ: "?",
  NEWSLETTER: "✉",
  SPACER: "↕",
  DIVIDER: "—",
  CONTAINER: "▢",
};

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

export function reorderSectionsArray<T>(
  list: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= list.length ||
    toIndex >= list.length
  ) {
    return list;
  }
  const next = Array.from(list);
  const [removed] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, removed);
  return next;
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return Boolean(
    el.closest("[contenteditable='true'], input, textarea, select"),
  );
}

function sectionsShallowEqual(a: LayoutSection[], b: LayoutSection[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  return a.every((s, i) => s === b[i]);
}

/* ─────────────────────────────────────────────────────────────
 * Tiny UI atoms
 * ───────────────────────────────────────────────────────────── */

function ToolIconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
  active,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded transition disabled:cursor-not-allowed disabled:opacity-35 ${
        danger
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          : active
            ? "bg-white/15 text-white"
            : "text-inherit hover:bg-black/5 dark:hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function TopBarBtn({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded-md px-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "bg-white/15 text-white"
          : "text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Block Inserter (left panel — WP +)
 * ───────────────────────────────────────────────────────────── */

function BlockInserter({
  types,
  query,
  onQueryChange,
  onAdd,
  onClose,
}: {
  types: LayoutSectionType[];
  query: string;
  onQueryChange: (q: string) => void;
  onAdd: (type: LayoutSectionType, atIndex?: number) => void;
  onClose?: () => void;
}) {
  const q = query.trim().toLowerCase();
  const filteredGroups = BLOCK_GROUPS.map((g) => ({
    ...g,
    types: g.types.filter((t) => {
      if (!types.includes(t)) return false;
      if (!q) return true;
      const meta = LAYOUT_SECTION_TYPE_META.find((m) => m.type === t);
      const hay = `${meta?.label ?? ""} ${meta?.description ?? ""} ${t}`.toLowerCase();
      return hay.includes(q);
    }),
  })).filter((g) => g.types.length > 0);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
            Thêm khối
          </p>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
            Block Inserter
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Đóng
          </button>
        ) : null}
      </div>

      <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <label className="relative block">
          <FiSearch className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Tìm khối…"
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 text-xs text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:border-[color:var(--wp-blue)] focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            style={{ ["--wp-blue" as string]: WP_BLUE }}
          />
        </label>
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {filteredGroups.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-gray-400">
            Không có khối phù hợp
          </p>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.id} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.types.map((type) => {
                  const meta = LAYOUT_SECTION_TYPE_META.find(
                    (m) => m.type === type,
                  );
                  return (
                    <button
                      key={type}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(LAYOUT_BLOCK_DND_MIME, type);
                        e.dataTransfer.setData("text/plain", type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onAdd(type)}
                      title="Click để thêm · Kéo thả vào khe giữa các khối"
                      className="group flex cursor-grab flex-col items-start gap-1 rounded-lg border border-transparent bg-gray-50 p-2.5 text-left transition hover:border-[color:var(--wp-blue)] hover:bg-white hover:shadow-sm active:cursor-grabbing dark:bg-gray-900 dark:hover:bg-gray-800"
                      style={{ ["--wp-blue" as string]: WP_BLUE }}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-sm shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
                        {BLOCK_ICON[type] ?? "▢"}
                      </span>
                      <span className="text-[11px] font-bold leading-tight text-gray-800 dark:text-gray-100">
                        {meta?.label ?? type}
                      </span>
                      {meta?.badge ? (
                        <span className="text-[9px] font-semibold text-gray-400">
                          {meta.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * List View (WP document outline)
 * ───────────────────────────────────────────────────────────── */

function ListViewPanel({
  sections,
  activeSectionId,
  onSelect,
  onToggleEnabled,
}: {
  sections: LayoutSection[];
  activeSectionId: string | null;
  onSelect: (id: string) => void;
  onToggleEnabled: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Cấu trúc
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          List View
        </p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {sections.length === 0 ? (
          <p className="px-2 py-8 text-center text-xs text-gray-400">
            Chưa có khối nào
          </p>
        ) : (
          <ul className="space-y-0.5">
            {sections.map((s, i) => {
              const active = s.id === activeSectionId;
              return (
                <li key={s.id}>
                  <div
                    className={`flex items-center gap-1 rounded-md ${
                      active
                        ? "bg-[color:var(--wp-blue)]/10 ring-1 ring-[color:var(--wp-blue)]/40"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                    style={{ ["--wp-blue" as string]: WP_BLUE }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(s.id)}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-2 text-left"
                    >
                      <span className="w-4 shrink-0 text-[10px] font-bold tabular-nums text-gray-400">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-none">
                        {BLOCK_ICON[s.type] ?? "▢"}
                      </span>
                      <span
                        className={`min-w-0 flex-1 truncate text-xs font-semibold ${
                          active
                            ? "text-gray-900 dark:text-white"
                            : "text-gray-700 dark:text-gray-200"
                        } ${!s.enabled ? "line-through opacity-50" : ""}`}
                      >
                        {s.label?.trim() || getSectionTypeLabel(s.type)}
                      </span>
                    </button>
                    <button
                      type="button"
                      title={s.enabled ? "Ẩn" : "Hiện"}
                      onClick={() => onToggleEnabled(s.id)}
                      className="mr-1 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                    >
                      {s.enabled ? (
                        <FiEye className="h-3.5 w-3.5" />
                      ) : (
                        <FiEyeOff className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Between-block inserter (WP “+” between blocks)
 * ───────────────────────────────────────────────────────────── */

function BetweenInserter({
  types,
  onInsert,
  disabled,
}: {
  types: LayoutSectionType[];
  onInsert: (type: LayoutSectionType) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  if (disabled || types.length === 0) {
    return <div className="h-0" aria-hidden />;
  }

  return (
    <div
      className={`group/ins relative z-10 flex h-0 items-center justify-center ${
        dragOver ? "z-20" : ""
      }`}
      onDragOver={(e) => {
        if (![...e.dataTransfer.types].includes(LAYOUT_BLOCK_DND_MIME) &&
            ![...e.dataTransfer.types].includes("text/plain")) {
          return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const type =
          e.dataTransfer.getData(LAYOUT_BLOCK_DND_MIME) ||
          e.dataTransfer.getData("text/plain");
        if (type && types.includes(type as LayoutSectionType)) {
          onInsert(type as LayoutSectionType);
        }
      }}
    >
      <div
        className={`pointer-events-none absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 transition ${
          dragOver
            ? "bg-[color:var(--wp-blue)] shadow-[0_0_0_3px_rgba(56,88,233,0.2)]"
            : "bg-transparent group-hover/ins:bg-[color:var(--wp-blue)]/35"
        }`}
        style={{ ["--wp-blue" as string]: WP_BLUE }}
      />
      <div className="relative">
        <button
          type="button"
          title="Thêm khối tại đây — hoặc kéo từ Inserter thả vào"
          aria-label="Thêm khối tại đây"
          onClick={() => setOpen((v) => !v)}
          className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border-2 bg-white text-gray-500 shadow-sm transition dark:bg-gray-900 ${
            dragOver
              ? "scale-110 border-[color:var(--wp-blue)] text-[color:var(--wp-blue)] opacity-100"
              : "border-gray-300 opacity-0 hover:border-[color:var(--wp-blue)] hover:text-[color:var(--wp-blue)] group-hover/ins:opacity-100 focus-visible:opacity-100 dark:border-gray-600"
          }`}
          style={{ ["--wp-blue" as string]: WP_BLUE }}
        >
          <FiPlus className="h-3.5 w-3.5" />
        </button>
        {open ? (
          <>
            <button
              type="button"
              aria-label="Đóng"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute left-1/2 top-full z-50 mt-2 max-h-64 w-56 -translate-x-1/2 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                Thêm khối
              </p>
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onInsert(type);
                    setOpen(false);
                  }}
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <span className="text-sm">{BLOCK_ICON[type] ?? "▢"}</span>
                  {getSectionTypeLabel(type)}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Block on canvas (WYSIWYG — no admin card chrome)
 * ───────────────────────────────────────────────────────────── */

interface CanvasBlockProps {
  section: LayoutSection;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  disabled?: boolean;
  products?: ShopProduct[];
  categories?: ShopCategory[];
  theme?: LayoutRenderTheme;
  dropEdge: "above" | "below" | null;
  isFirst: boolean;
  addableTypes: LayoutSectionType[];
  onSelect: () => void;
  onHover: (hover: boolean) => void;
  onToggleEnabled: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMove: (delta: number) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpenSettings?: () => void;
  onInsertBefore: (type: LayoutSectionType) => void;
  onInsertAfter: (type: LayoutSectionType) => void;
  insertDisabled?: boolean;
  onPatchSectionData?: (
    id: string,
    partial: Record<string, unknown>,
  ) => void;
  /** Active id có thể là nested block */
  treeActiveSectionId?: string | null;
  onSelectTreeSection?: (id: string) => void;
}

class CanvasBlockErrorBoundary extends Component<
  { children: ReactNode; label: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; label: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CanvasBlockErrorBoundary error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="my-2 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          Không thể hiển thị khối "{this.props.label}".
        </div>
      );
    }
    return this.props.children;
  }
}

function CanvasBlock({
  section,
  index,
  isActive,
  isHovered,
  disabled,
  products,
  categories,
  theme,
  dropEdge,
  isFirst,
  addableTypes,
  onSelect,
  onHover,
  onToggleEnabled,
  onDelete,
  onDuplicate,
  onMove,
  canMoveUp,
  canMoveDown,
  onOpenSettings,
  onInsertBefore,
  onInsertAfter,
  insertDisabled,
  onPatchSectionData,
  treeActiveSectionId,
  onSelectTreeSection,
}: CanvasBlockProps) {
  const label = getSectionTypeLabel(section.type);
  const badge = getSectionTypeBadge(section.type);
  const showChrome = isActive || isHovered;

  return (
    <Draggable
      draggableId={section.id}
      index={index}
      isDragDisabled={disabled}
    >
      {(
        provided: DraggableProvided,
        snapshot: DraggableStateSnapshot,
      ) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          onMouseEnter={() => onHover(true)}
          onMouseLeave={() => onHover(false)}
          onClick={(e) => {
            e.stopPropagation();
            if (!snapshot.isDragging) onSelect();
          }}
          className={`group/block relative ${
            snapshot.isDragging ? "z-40 opacity-95 shadow-2xl" : "z-0"
          }`}
          style={provided.draggableProps.style}
          data-block-id={section.id}
        >
          {/* Insert BEFORE first block (inside Draggable to keep DnD tree valid) */}
          {isFirst && !snapshot.isDragging ? (
            <BetweenInserter
              types={addableTypes}
              disabled={insertDisabled || disabled}
              onInsert={onInsertBefore}
            />
          ) : null}

          {/* Drop line */}
          {dropEdge === "above" && !snapshot.isDragging ? (
            <div
              className="pointer-events-none absolute top-0 inset-x-0 z-30 h-1"
              style={{ backgroundColor: WP_BLUE }}
              aria-hidden
            />
          ) : null}
          {dropEdge === "below" && !snapshot.isDragging ? (
            <div
              className="pointer-events-none absolute bottom-0 inset-x-0 z-30 h-1"
              style={{ backgroundColor: WP_BLUE }}
              aria-hidden
            />
          ) : null}

          {/* Floating block toolbar (WordPress style) */}
          {showChrome && !snapshot.isDragging ? (
            <div
              className="absolute left-1/2 top-2 z-30 flex -translate-x-1/2 items-center gap-0.5 rounded-lg px-1 py-0.5 text-white shadow-lg"
              style={{ backgroundColor: "#1e1e1e" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                title="Kéo để di chuyển"
                aria-label={`Kéo: ${label}`}
                className={`flex h-8 w-8 cursor-grab items-center justify-center rounded text-white/80 hover:bg-white/10 active:cursor-grabbing ${
                  disabled ? "cursor-not-allowed opacity-40" : ""
                }`}
                {...provided.dragHandleProps}
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <circle cx="7" cy="5" r="1.4" />
                  <circle cx="13" cy="5" r="1.4" />
                  <circle cx="7" cy="10" r="1.4" />
                  <circle cx="13" cy="10" r="1.4" />
                  <circle cx="7" cy="15" r="1.4" />
                  <circle cx="13" cy="15" r="1.4" />
                </svg>
              </button>

              <ToolIconBtn
                label="Lên"
                disabled={!canMoveUp || disabled}
                onClick={() => onMove(-1)}
              >
                <FiChevronUp className="h-3.5 w-3.5 text-white/85" />
              </ToolIconBtn>
              <ToolIconBtn
                label="Xuống"
                disabled={!canMoveDown || disabled}
                onClick={() => onMove(1)}
              >
                <FiChevronDown className="h-3.5 w-3.5 text-white/85" />
              </ToolIconBtn>

              <span className="mx-0.5 h-4 w-px bg-white/15" />

              <span className="max-w-[120px] truncate px-1.5 text-[11px] font-semibold tracking-wide text-white/90">
                {label}
              </span>
              {badge ? (
                <span className="mr-0.5 rounded bg-white/10 px-1 py-0.5 text-[9px] font-bold text-white/70">
                  {badge}
                </span>
              ) : null}

              <span className="mx-0.5 h-4 w-px bg-white/15" />

              <ToolIconBtn label="Nhân đôi (⌘D)" onClick={onDuplicate}>
                <FiCopy className="h-3.5 w-3.5 text-white/85" />
              </ToolIconBtn>
              <ToolIconBtn
                label={section.enabled ? "Ẩn khối" : "Hiện khối"}
                onClick={onToggleEnabled}
              >
                {section.enabled ? (
                  <FiEye className="h-3.5 w-3.5 text-white/85" />
                ) : (
                  <FiEyeOff className="h-3.5 w-3.5 text-white/85" />
                )}
              </ToolIconBtn>
              {onOpenSettings ? (
                <ToolIconBtn label="Tuỳ chọn" onClick={onOpenSettings}>
                  <FiMoreHorizontal className="h-3.5 w-3.5 text-white/85" />
                </ToolIconBtn>
              ) : null}
              <ToolIconBtn
                label={
                  section.locked ? "Khối bắt buộc" : "Xóa khối (Del)"
                }
                danger
                disabled={Boolean(section.locked)}
                onClick={onDelete}
              >
                <FiTrash2 className="h-3.5 w-3.5" />
              </ToolIconBtn>
            </div>
          ) : null}

          {/* Always attach drag handle props somewhere when toolbar hidden */}
          {!showChrome ? (
            <span className="sr-only" {...provided.dragHandleProps}>
              Kéo {label}
            </span>
          ) : null}

          {/* Selection / hover outline — WP blue box */}
          <div
            className={`relative transition-[box-shadow] duration-150 ${
              !section.enabled ? "opacity-50 grayscale" : ""
            }`}
            style={
              snapshot.isDragging
                ? {
                    boxShadow: `0 0 0 2px ${WP_BLUE}, 0 16px 40px rgba(0,0,0,0.18)`,
                  }
                : isActive
                  ? {
                      boxShadow: `0 0 0 2px ${WP_BLUE}`,
                    }
                  : isHovered
                    ? {
                        boxShadow: `0 0 0 1px ${WP_BLUE}`,
                      }
                    : undefined
            }
          >
            {isActive ? (
              <div
                className="absolute left-0 top-0 z-20 rounded-br px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                style={{ backgroundColor: WP_BLUE }}
              >
                {label}
              </div>
            ) : null}

            <div
              className={
                /* Builder: luôn cho click vào nested block bên trong */
                "pointer-events-auto select-text"
              }
            >
              <CanvasBlockErrorBoundary key={section.id} label={label}>
                <SectionRenderer
                  section={{ ...section, enabled: true }}
                  products={products}
                  categories={categories}
                  theme={theme}
                  motionIndex={Math.min(index, 11)}
                  motionImmediate
                  previewMode
                  inlineEdit={
                    (treeActiveSectionId === section.id || isActive) &&
                    !section.editorLocked
                  }
                  onPatchData={(partial) =>
                    onPatchSectionData?.(
                      treeActiveSectionId &&
                        treeActiveSectionId !== section.id
                        ? treeActiveSectionId
                        : section.id,
                      partial,
                    )
                  }
                  activeSectionId={treeActiveSectionId ?? null}
                  onSelectSection={onSelectTreeSection}
                />
              </CanvasBlockErrorBoundary>
            </div>
          </div>

          {/* Insert AFTER block */}
          {!snapshot.isDragging ? (
            <BetweenInserter
              types={addableTypes}
              disabled={insertDisabled || disabled}
              onInsert={onInsertAfter}
            />
          ) : null}
        </div>
      )}
    </Draggable>
  );
}

/* ─────────────────────────────────────────────────────────────
 * Main LayoutCanvas
 * ───────────────────────────────────────────────────────────── */

export default function LayoutCanvas({
  sections,
  activeSectionId,
  onSectionsChange,
  onSelectSection,
  onOpenSectionSettings,
  products,
  categories,
  theme,
  dataLoading = false,
  className = "",
  disabled = false,
  devicePreview: deviceControlled,
  onDevicePreviewChange,
  fillHeight = true,
}: LayoutCanvasProps) {
  const reactId = useId();
  const droppableId = useMemo(
    () => `wp-canvas-${reactId.replace(/:/g, "")}`,
    [reactId],
  );
  const rootRef = useRef<HTMLDivElement>(null);

  const [leftPanel, setLeftPanel] = useState<CanvasLeftPanel>("inserter");
  const [inserterOpen, setInserterOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [deviceLocal, setDeviceLocal] = useState<CanvasDevice>("desktop");
  const device = deviceControlled ?? deviceLocal;
  const setDevice = useCallback(
    (d: CanvasDevice) => {
      onDevicePreviewChange?.(d);
      if (deviceControlled === undefined) setDeviceLocal(d);
    },
    [deviceControlled, onDevicePreviewChange],
  );

  const [copiedStyling, setCopiedStyling] = useState<LayoutSectionStyling | null>(null);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [aiImporterOpen, setAiImporterOpen] = useState(false);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [canvasExternalDragOver, setCanvasExternalDragOver] = useState(false);
  const [canvasDropTargetIndex, setCanvasDropTargetIndex] = useState<number | null>(null);

  const [past, setPast] = useState<LayoutSection[][]>([]);
  const [future, setFuture] = useState<LayoutSection[][]>([]);
  const sectionsRef = useRef(sections);

  useEffect(() => {
    sectionsRef.current = sections;
  }, [sections]);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const commit = useCallback(
    (next: LayoutSection[]) => {
      if (sectionsShallowEqual(sectionsRef.current, next)) return;
      setPast((prev) => [...prev.slice(-(HISTORY_LIMIT - 1)), sectionsRef.current]);
      setFuture([]);
      onSectionsChange(next);
    },
    [onSectionsChange],
  );

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const prev = prevPast[prevPast.length - 1];
      setFuture((prevFuture) => [sectionsRef.current, ...prevFuture]);
      onSectionsChange(prev);
      return prevPast.slice(0, -1);
    });
  }, [onSectionsChange]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((prevPast) => [...prevPast, sectionsRef.current]);
      onSectionsChange(next);
      return prevFuture.slice(1);
    });
  }, [onSectionsChange]);

  const patchSection = useCallback(
    (id: string, patch: Partial<LayoutSection>) => {
      // Deep patch — nested block trong CONTAINER cũng sửa được
      if ("data" in patch && patch.data && typeof patch.data === "object") {
        commit(
          updateSectionDeep(sectionsRef.current, id, {
            data: patch.data as Record<string, unknown>,
            enabled: patch.enabled,
            widthPreset: patch.widthPreset,
            label: patch.label,
            groupId: patch.groupId,
            editorLocked: patch.editorLocked,
            styling: patch.styling as never,
          }),
        );
        return;
      }
      commit(
        updateSectionDeep(sectionsRef.current, id, {
          enabled: patch.enabled,
          widthPreset: patch.widthPreset,
          label: patch.label,
          groupId: patch.groupId,
          editorLocked: patch.editorLocked,
          styling: patch.styling as never,
        }),
      );
    },
    [commit],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const list = sectionsRef.current;
      const target = findSectionDeep(list, id);
      if (!target || target.locked) return;
      const label = getSectionTypeLabel(target.type);
      const next = deleteSectionDeep(list, id);
      commit(next);
      if (activeSectionId === id || (activeSectionId && !findSectionDeep(next, activeSectionId))) {
        onSelectSection(null);
      }
      toast.success(`Đã xóa khối “${label}”`);
    },
    [commit, activeSectionId, onSelectSection],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      const list = sectionsRef.current;
      const index = list.findIndex((s) => s.id === id);
      if (index < 0) return;
      const copy = cloneSection(list[index]);
      const next = [...list];
      next.splice(index + 1, 0, copy);
      commit(next);
      onSelectSection(copy.id);
    },
    [commit, onSelectSection],
  );

  const handleMove = useCallback(
    (id: string, delta: number) => {
      const list = sectionsRef.current;
      const next = moveSectionWithGroup(list, id, delta);
      if (next === list) return;
      commit(next);
      onSelectSection(id);
    },
    [commit, onSelectSection],
  );

  const handleAdd = useCallback(
    (type: LayoutSectionType, atIndex?: number) => {
      const section = createSection(type);
      const list = [...sectionsRef.current];
      const index =
        typeof atIndex === "number"
          ? Math.max(0, Math.min(atIndex, list.length))
          : activeSectionId
            ? list.findIndex((s) => s.id === activeSectionId) + 1
            : list.length;
      const safeIndex =
        index < 0
          ? list.length
          : Math.max(0, Math.min(index, list.length));
      list.splice(safeIndex, 0, section);
      commit(list);
      onSelectSection(section.id);
    },
    [commit, onSelectSection, activeSectionId],
  );

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types);
    const isBlockDrag =
      types.includes(LAYOUT_BLOCK_DND_MIME) || types.includes("text/plain");
    if (!isBlockDrag) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setCanvasExternalDragOver(true);

    if (rootRef.current) {
      const blocks = Array.from(
        rootRef.current.querySelectorAll<HTMLElement>("[data-block-id]"),
      );
      if (blocks.length === 0) {
        setCanvasDropTargetIndex(0);
        return;
      }
      const mouseY = e.clientY;
      let targetIdx = blocks.length;
      for (let i = 0; i < blocks.length; i++) {
        const rect = blocks[i].getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (mouseY < midY) {
          targetIdx = i;
          break;
        }
      }
      setCanvasDropTargetIndex(targetIdx);
    }
  }, []);

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setCanvasExternalDragOver(false);
      setCanvasDropTargetIndex(null);
    }
  }, []);

  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      const type =
        e.dataTransfer.getData(LAYOUT_BLOCK_DND_MIME) ||
        e.dataTransfer.getData("text/plain");

      const targetIdx = canvasDropTargetIndex;
      setCanvasExternalDragOver(false);
      setCanvasDropTargetIndex(null);

      if (type && LAYOUT_SECTION_TYPE_META.some((m) => m.type === type)) {
        e.preventDefault();
        e.stopPropagation();
        handleAdd(type as LayoutSectionType, targetIdx ?? undefined);
      }
    },
    [canvasDropTargetIndex, handleAdd],
  );

  const handleDragStart = useCallback((start: DragStart) => {
    setDragFromIndex(start.source.index);
    setDragOverIndex(start.source.index);
  }, []);

  const handleDragUpdate = useCallback((update: DragUpdate) => {
    setDragOverIndex(update.destination?.index ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      setDragFromIndex(null);
      setDragOverIndex(null);
      const { destination, source, reason } = result;
      if (reason === "CANCEL" || !destination) return;
      if (destination.droppableId !== source.droppableId) return;
      if (destination.index === source.index) return;
      const next = reorderSectionsWithGroup(
        sectionsRef.current,
        source.index,
        destination.index,
      );
      commit(next);
      const moved =
        next.find(
          (s) => s.id === sectionsRef.current[source.index]?.id,
        ) ?? next[destination.index];
      // after reorder, find by original id
      const origId = result.draggableId;
      const found = next.find((s) => s.id === origId);
      if (found) onSelectSection(found.id);
      else if (moved) onSelectSection(moved.id);
    },
    [commit, onSelectSection],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled || isTypingTarget(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (mod && key === "s") {
        e.preventDefault();
        toast.success("Đã tự động sao lưu bản nháp!");
        return;
      }
      if (mod && e.altKey && key === "c" && activeSectionId) {
        e.preventDefault();
        const target = findSectionDeep(sectionsRef.current, activeSectionId);
        if (target) {
          setCopiedStyling(target.styling);
          toast.success(`Đã sao chép kiểu dáng khối “${getSectionTypeLabel(target.type)}”`);
        }
        return;
      }
      if (mod && e.altKey && key === "v" && activeSectionId && copiedStyling) {
        e.preventDefault();
        patchSection(activeSectionId, { styling: copiedStyling });
        toast.success("Đã dán kiểu dáng khối thành công!");
        return;
      }
      if (mod && key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && key === "d" && activeSectionId) {
        e.preventDefault();
        handleDuplicate(activeSectionId);
        return;
      }
      if (mod && e.key === "ArrowUp" && activeSectionId) {
        e.preventDefault();
        handleMove(activeSectionId, -1);
        return;
      }
      if (mod && e.key === "ArrowDown" && activeSectionId) {
        e.preventDefault();
        handleMove(activeSectionId, 1);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && activeSectionId) {
        const root = rootRef.current;
        if (
          root &&
          document.activeElement &&
          !root.contains(document.activeElement) &&
          document.activeElement !== document.body
        ) {
          return;
        }
        e.preventDefault();
        handleDelete(activeSectionId);
        return;
      }
      if (e.key === "Escape") {
        onSelectSection(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    disabled,
    undo,
    redo,
    activeSectionId,
    handleDuplicate,
    handleMove,
    handleDelete,
    onSelectSection,
  ]);

  const addableTypes = useMemo(
    () =>
      LAYOUT_SECTION_TYPE_META.filter(
        (m) => !m.lockedByDefault || !sections.some((s) => s.type === m.type),
      ).map((m) => m.type),
    [sections],
  );

  const getDropEdge = useCallback(
    (index: number): "above" | "below" | null => {
      if (dragOverIndex === null || dragFromIndex === null) return null;
      if (dragOverIndex === dragFromIndex) return null;
      if (dragOverIndex === index) {
        return dragFromIndex < index ? "below" : "above";
      }
      return null;
    },
    [dragOverIndex, dragFromIndex],
  );

  const deviceMaxW =
    device === "mobile"
      ? "max-w-[390px]"
      : device === "tablet"
        ? "max-w-[820px]"
        : "max-w-none w-full";

  const pageBg = theme?.backgroundColor || "#f9fafb";
  const showLeft = inserterOpen || leftPanel === "list";

  return (
    <div
      ref={rootRef}
      className={`flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-[#1e1e1e] shadow-sm dark:border-gray-800 ${
        fillHeight ? "h-full min-h-[520px]" : ""
      } ${className}`}
      style={{ ["--wp-blue" as string]: WP_BLUE }}
    >
      {/* ═══ Top bar (WP editor header) ═══ */}
      <header className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-1">
          <TopBarBtn
            label="Thêm khối"
            active={inserterOpen && leftPanel === "inserter"}
            onClick={() => {
              setLeftPanel("inserter");
              setInserterOpen((v) =>
                leftPanel === "inserter" ? !v : true,
              );
            }}
          >
            <FiPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Thêm</span>
          </TopBarBtn>
          <TopBarBtn
            label="List View"
            active={leftPanel === "list" && inserterOpen}
            onClick={() => {
              setLeftPanel("list");
              setInserterOpen(true);
            }}
          >
            <FiLayers className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cấu trúc</span>
          </TopBarBtn>

          <span className="mx-1 hidden h-4 w-px bg-white/15 sm:block" />

          <TopBarBtn
            label="Hoàn tác"
            onClick={undo}
            disabled={!canUndo || disabled}
          >
            <FiRotateCcw className="h-3.5 w-3.5" />
          </TopBarBtn>
          <TopBarBtn
            label="Làm lại"
            onClick={redo}
            disabled={!canRedo || disabled}
          >
            <FiRotateCw className="h-3.5 w-3.5" />
          </TopBarBtn>
        </div>

        <div className="min-w-0 text-center">
          <p className="truncate text-xs font-semibold text-white/90">
            Trình tạo trang · Visual Editor
          </p>
          <p className="hidden text-[10px] text-white/45 sm:block">
            {sections.length} khối
            {dataLoading
              ? " · Đang tải data…"
              : products && products.length > 0
                ? ` · ${products.length} SP`
                : " · Demo"}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Tạm ẩn tính năng AI Importer */}
          {/* <button
            type="button"
            onClick={() => setAiImporterOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm hover:opacity-90 active:scale-95 transition mr-1"
          >
            <FiZap className="h-3.5 w-3.5 animate-pulse text-amber-200" />
            <span className="hidden sm:inline">🪄 AI Importer</span>
          </button> */}

          <TopBarBtn
            label="Mẫu trang"
            onClick={() => setTemplateModalOpen(true)}
          >
            <FiZap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden md:inline">Mẫu trang</span>
          </TopBarBtn>

          <span className="mx-1 hidden h-4 w-px bg-white/15 sm:block" />

          <TopBarBtn
            label="Xem QR Zalo"
            onClick={() => setQrModalOpen(true)}
          >
            <FiCode className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden md:inline">Xem QR</span>
          </TopBarBtn>

          <TopBarBtn
            label="Phím tắt"
            onClick={() => setShortcutsModalOpen(true)}
          >
            <FiCommand className="h-3.5 w-3.5 text-purple-400" />
          </TopBarBtn>

          <span className="mx-1 hidden h-4 w-px bg-white/15 sm:block" />

          <TopBarBtn
            label="Desktop"
            active={device === "desktop"}
            onClick={() => setDevice("desktop")}
          >
            <FiMonitor className="h-3.5 w-3.5" />
          </TopBarBtn>
          <TopBarBtn
            label="Tablet"
            active={device === "tablet"}
            onClick={() => setDevice("tablet")}
          >
            <FiGrid className="h-3.5 w-3.5" />
          </TopBarBtn>
          <TopBarBtn
            label="Mobile"
            active={device === "mobile"}
            onClick={() => setDevice("mobile")}
          >
            <FiSmartphone className="h-3.5 w-3.5" />
          </TopBarBtn>
        </div>
      </header>

      {/* ═══ Body: inserter | canvas ═══ */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        {showLeft ? (
          <aside className="flex w-[220px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 xl:w-[240px]">
            {leftPanel === "list" ? (
              <ListViewPanel
                sections={sections}
                activeSectionId={activeSectionId}
                onSelect={onSelectSection}
                onToggleEnabled={(id) => {
                  const s = sections.find((x) => x.id === id);
                  if (s) patchSection(id, { enabled: !s.enabled });
                }}
              />
            ) : (
              <BlockInserter
                types={addableTypes}
                query={search}
                onQueryChange={setSearch}
                onAdd={(type) => handleAdd(type)}
                onClose={() => setInserterOpen(false)}
              />
            )}
          </aside>
        ) : null}

        {/* Canvas workspace */}
        <div
          className={`custom-scrollbar relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain transition-all duration-200 ${
            canvasExternalDragOver ? "ring-4 ring-inset ring-[color:var(--wp-blue)]/50 bg-blue-50/20" : ""
          }`}
          style={{ backgroundColor: "#f0f0f0" }}
          onClick={() => onSelectSection(null)}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          {canvasExternalDragOver ? (
            <div className="sticky top-3 z-50 mx-auto my-2 max-w-sm rounded-xl bg-[color:var(--wp-blue)] px-4 py-2.5 text-center text-xs font-bold text-white shadow-xl animate-pulse backdrop-blur-md">
              ✨ Thả khối vào đây để thêm vào vị trí {canvasDropTargetIndex !== null ? canvasDropTargetIndex + 1 : "cuối"}
            </div>
          ) : null}
          <div
            className={
              device === "desktop"
                ? "h-full px-0 py-0"
                : "px-3 py-5 sm:px-5 sm:py-6"
            }
          >
            <div
              className={`mx-auto transition-[max-width] duration-300 ${deviceMaxW} ${
                device === "desktop" ? "h-full" : ""
              }`}
            >
              {device !== "desktop" ? (
                <div className="mb-3 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  <span className="h-px w-8 bg-gray-300" />
                  {device === "tablet" ? "Tablet" : "Mobile"} preview
                  <span className="h-px w-8 bg-gray-300" />
                </div>
              ) : null}

              <div
                className={`overflow-hidden bg-white ${
                  device === "desktop"
                    ? "min-h-full rounded-none shadow-none"
                    : "rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_12px_40px_rgba(0,0,0,0.08)]"
                }`}
                style={{ backgroundColor: pageBg }}
                onClick={(e) => e.stopPropagation()}
              >
                <DragDropContext
                  onDragStart={handleDragStart}
                  onDragUpdate={handleDragUpdate}
                  onDragEnd={handleDragEnd}
                >
                  <Droppable droppableId={droppableId} direction="vertical">
                    {(
                      provided: DroppableProvided,
                      snapshot: DroppableStateSnapshot,
                    ) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[min(70vh,640px)] transition ${
                          snapshot.isDraggingOver
                            ? "ring-2 ring-inset ring-[color:var(--wp-blue)]/30"
                            : ""
                        }`}
                      >
                        {sections.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-4 px-6 py-24 text-center">
                            <div
                              className="flex h-16 w-16 items-center justify-center rounded-full text-2xl text-white shadow-md"
                              style={{ backgroundColor: WP_BLUE }}
                            >
                              <FiPlus className="h-7 w-7" />
                            </div>
                            <div>
                              <p className="text-base font-semibold text-gray-800">
                                Thêm khối đầu tiên
                              </p>
                              <p className="mt-1 max-w-sm text-sm text-gray-500">
                                Chọn khối từ panel bên trái — giống WordPress
                                Block Editor. Kéo thả để sắp xếp sau khi thêm.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLeftPanel("inserter");
                                setInserterOpen(true);
                              }}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm"
                              style={{ backgroundColor: WP_BLUE }}
                            >
                              <FiPlus className="h-4 w-4" />
                              Mở Block Inserter
                            </button>
                          </div>
                        ) : (
                          sections.map((section, index) => (
                            <CanvasBlock
                              key={section.id}
                              section={section}
                              index={index}
                              isActive={
                                activeSectionId === section.id ||
                                (section.type === "CONTAINER" &&
                                  !!activeSectionId &&
                                  !!findSectionDeep(
                                    section.data.nestedBlocks ?? [],
                                    activeSectionId,
                                  ))
                              }
                              isHovered={hoveredId === section.id}
                              disabled={disabled}
                              products={products}
                              categories={categories}
                              theme={theme}
                              dropEdge={getDropEdge(index)}
                              isFirst={index === 0}
                              addableTypes={addableTypes}
                              insertDisabled={
                                disabled || dragFromIndex !== null
                              }
                              onSelect={() => onSelectSection(section.id)}
                              onHover={(h) =>
                                setHoveredId(h ? section.id : null)
                              }
                              onToggleEnabled={() =>
                                patchSection(section.id, {
                                  enabled: !section.enabled,
                                })
                              }
                              onDelete={() => handleDelete(section.id)}
                              onDuplicate={() =>
                                handleDuplicate(section.id)
                              }
                              onMove={(delta) =>
                                handleMove(section.id, delta)
                              }
                              canMoveUp={index > 0}
                              canMoveDown={index < sections.length - 1}
                              onOpenSettings={
                                onOpenSectionSettings
                                  ? () => onOpenSectionSettings(section.id)
                                  : undefined
                              }
                              onInsertBefore={(type) =>
                                handleAdd(type, 0)
                              }
                              onInsertAfter={(type) =>
                                handleAdd(type, index + 1)
                              }
                              onPatchSectionData={(id, partial) => {
                                const cur = findSectionDeep(
                                  sectionsRef.current,
                                  id,
                                );
                                if (!cur || cur.editorLocked) return;
                                commit(
                                  updateSectionDeep(sectionsRef.current, id, {
                                    data: {
                                      ...cur.data,
                                      ...partial,
                                    } as Record<string, unknown>,
                                  }),
                                );
                              }}
                              treeActiveSectionId={activeSectionId}
                              onSelectTreeSection={(id) => {
                                onSelectSection(id);
                              }}
                            />
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>

              {device !== "desktop" ? (
                <p className="mt-3 text-center text-[10px] text-gray-400">
                  Click khối · Hover toolbar · Kéo grip · ⌘Z / ⌘D / Del
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Modals ═══ */}
      <PageTemplateModal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onApplyTemplate={(nextSections, tName) => {
          commit(nextSections);
          onSelectSection(nextSections[0]?.id ?? null);
          toast.success(`Đã áp dụng mẫu trang “${tName}”!`);
        }}
      />

      <QRCodePreviewModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
      />

      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
      />

      <AiUiImporterModal
        isOpen={aiImporterOpen}
        onClose={() => setAiImporterOpen(false)}
        onImportSections={(importedSections) => {
          commit(importedSections);
          onSelectSection(importedSections[0]?.id ?? null);
          toast.success(`🎉 AI đã thêm ${importedSections.length} khối mới vào Canvas!`);
        }}
      />
    </div>
  );
}
