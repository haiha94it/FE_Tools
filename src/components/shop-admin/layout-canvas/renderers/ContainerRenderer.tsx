/**
 * CONTAINER — khối rỗng chứa:
 * - widget con (text, ảnh, nút…)
 * - nested full blocks (Hero, Grid, FAQ…)
 */

"use client";

import type {
  LayoutContainerChild,
  LayoutSection,
} from "@/types/shop-layout-canvas";
import type { ShopCategory, ShopProduct } from "@/types/zalo-shop";
import { BlockEmptyState } from "./ExtraBlockRenderers";
import SectionRenderer from "./SectionRenderer";
import {
  buildSectionShellClasses,
  buildWidthFrameClass,
  type LayoutRenderTheme,
  type SectionRendererProps,
} from "./section-style-utils";

/** Depth cap — tránh lồng CONTAINER vô hạn */
export const MAX_CONTAINER_NEST_DEPTH = 3;

function childLayoutClass(
  layout: "stack" | "row" | "grid-2" | "grid-3",
  gap: "none" | "sm" | "md" | "lg" | undefined,
  align: "start" | "center" | "end" | "stretch" | undefined,
): string {
  const g =
    gap === "none"
      ? "gap-0"
      : gap === "sm"
        ? "gap-2"
        : gap === "lg"
          ? "gap-6"
          : "gap-4";
  const a =
    align === "center"
      ? "items-center"
      : align === "end"
        ? "items-end"
        : align === "start"
          ? "items-start"
          : "items-stretch";

  switch (layout) {
    case "row":
      return `flex flex-col sm:flex-row ${g} ${a}`;
    case "grid-2":
      return `grid grid-cols-1 sm:grid-cols-2 ${g}`;
    case "grid-3":
      return `grid grid-cols-1 sm:grid-cols-3 ${g}`;
    case "stack":
    default:
      return `flex flex-col ${g} ${a}`;
  }
}

function minHClass(minHeight: "sm" | "md" | "lg" | undefined): string {
  switch (minHeight) {
    case "sm":
      return "min-h-[80px]";
    case "lg":
      return "min-h-[220px]";
    case "md":
    default:
      return "min-h-[140px]";
  }
}

function aspectClass(
  aspect: "auto" | "video" | "square" | "wide" | undefined,
): string {
  switch (aspect) {
    case "video":
      return "aspect-video";
    case "square":
      return "aspect-square";
    case "wide":
      return "aspect-[21/9]";
    default:
      return "";
  }
}

function ContainerChildView({
  child,
  accent,
}: {
  child: LayoutContainerChild;
  accent: string;
}) {
  switch (child.type) {
    case "heading": {
      const Tag =
        child.data.level === 1 ? "h1" : child.data.level === 3 ? "h3" : "h2";
      const size =
        child.data.level === 1
          ? "text-2xl sm:text-3xl"
          : child.data.level === 3
            ? "text-base sm:text-lg"
            : "text-xl sm:text-2xl";
      const align =
        child.data.align === "center"
          ? "text-center"
          : child.data.align === "right"
            ? "text-right"
            : "text-left";
      return (
        <Tag className={`font-bold tracking-tight ${size} ${align}`}>
          {child.data.text}
        </Tag>
      );
    }
    case "text": {
      const align =
        child.data.align === "center"
          ? "text-center"
          : child.data.align === "right"
            ? "text-right"
            : "text-left";
      return (
        <p
          className={`text-sm leading-relaxed sm:text-base ${align} ${
            child.data.muted ? "opacity-70" : ""
          }`}
        >
          {child.data.text}
        </p>
      );
    }
    case "image":
      return (
        <div
          className={`relative w-full overflow-hidden rounded-xl bg-gray-100 ${aspectClass(child.data.aspect)}`}
        >
          {child.data.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={child.data.url}
              alt={child.data.alt || ""}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-24 items-center justify-center text-xs text-gray-400">
              Chưa có ảnh
            </div>
          )}
        </div>
      );
    case "button": {
      const variant = child.data.variant ?? "primary";
      return (
        <span
          className={`inline-flex min-h-10 items-center justify-center rounded-full px-5 text-xs font-bold ${
            variant === "secondary"
              ? "border border-current/20 bg-transparent"
              : variant === "ghost"
                ? "bg-black/5 dark:bg-white/10"
                : "text-white shadow-sm"
          }`}
          style={
            variant === "primary" ? { backgroundColor: accent } : undefined
          }
        >
          {child.data.label}
        </span>
      );
    }
    case "badge":
      return (
        <span
          className="inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {child.data.text}
        </span>
      );
    case "spacer": {
      const h =
        child.data.size === "sm"
          ? "h-4"
          : child.data.size === "lg"
            ? "h-12"
            : "h-8";
      return <div className={h} aria-hidden />;
    }
    case "divider":
      return (
        <div className="flex w-full items-center gap-3 py-1">
          <div className="h-px flex-1 bg-current/15" />
          {child.data.label ? (
            <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              {child.data.label}
            </span>
          ) : null}
          <div className="h-px flex-1 bg-current/15" />
        </div>
      );
    case "html":
      return (
        <div
          className="prose prose-sm max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: child.data.html || "" }}
        />
      );
    default:
      return null;
  }
}

export default function ContainerRenderer({
  section,
  theme,
  className = "",
  isBuilder = false,
  nestDepth = 0,
  products,
  categories,
  getProductHref,
  onProductClick,
  activeSectionId = null,
  onSelectSection,
}: SectionRendererProps<Extract<LayoutSection, { type: "CONTAINER" }>> & {
  isBuilder?: boolean;
  nestDepth?: number;
  products?: ShopProduct[];
  categories?: ShopCategory[];
  getProductHref?: (productId: number) => string;
  onProductClick?: (productId: number) => void;
  activeSectionId?: string | null;
  onSelectSection?: (id: string) => void;
}) {
  const shell = buildSectionShellClasses(section.styling);
  const accent = theme?.accentColor ?? "#3858e9";
  const d = section.data;
  const widgets = d.children ?? [];
  const nestedBlocks = (d.nestedBlocks ?? []).filter((b) => b?.enabled !== false);
  const empty = widgets.length === 0 && nestedBlocks.length === 0;
  const canNestDeeper = nestDepth < MAX_CONTAINER_NEST_DEPTH;

  return (
    <section
      className={`${shell.className} ${className}`}
      style={shell.style}
      data-section-type="CONTAINER"
      data-section-id={section.id}
      data-nest-depth={nestDepth}
    >
      <div className={buildWidthFrameClass(section.widthPreset)}>
        {d.title?.trim() ? (
          <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {d.title}
          </p>
        ) : null}

        {empty ? (
          <div className={minHClass(d.minHeight)}>
            <BlockEmptyState
              title={
                isBuilder ? "Container trống" : "Nội dung đang được cập nhật"
              }
              hint={
                isBuilder
                  ? "Properties → Thêm thành phần (text/ảnh…) hoặc Thêm block (Hero, Grid…)"
                  : undefined
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Widgets */}
            {widgets.length > 0 ? (
              <div className={childLayoutClass(d.layout, d.gap, d.align)}>
                {widgets.map((child) => (
                  <div key={child.id} data-container-child={child.type}>
                    <ContainerChildView child={child} accent={accent} />
                  </div>
                ))}
              </div>
            ) : null}

            {/* Nested full blocks */}
            {nestedBlocks.length > 0 ? (
              <div className="flex flex-col gap-3">
                {nestedBlocks.map((block, i) => {
                  if (block.type === "CONTAINER" && !canNestDeeper) {
                    return (
                      <div
                        key={block.id}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800"
                      >
                        Đã đạt giới hạn lồng container (tối đa{" "}
                        {MAX_CONTAINER_NEST_DEPTH} tầng).
                      </div>
                    );
                  }
                  const nestedActive = activeSectionId === block.id;
                  return (
                    <div
                      key={block.id}
                      role={isBuilder ? "button" : undefined}
                      tabIndex={isBuilder ? 0 : undefined}
                      onClick={(e) => {
                        if (!isBuilder || !onSelectSection) return;
                        e.stopPropagation();
                        onSelectSection(block.id);
                      }}
                      onKeyDown={(e) => {
                        if (!isBuilder || !onSelectSection) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelectSection(block.id);
                        }
                      }}
                      className={`relative overflow-hidden rounded-xl ring-1 transition ${
                        nestedActive
                          ? "ring-2 ring-[color:var(--wp-blue,#3858e9)] ring-offset-2"
                          : "ring-black/[0.04] hover:ring-[color:var(--wp-blue,#3858e9)]/40 dark:ring-white/10"
                      } ${isBuilder ? "cursor-pointer" : ""}`}
                      data-nested-block={block.type}
                      data-nested-active={nestedActive ? "true" : undefined}
                    >
                      {isBuilder ? (
                        <div
                          className={`absolute left-2 top-2 z-10 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow ${
                            nestedActive
                              ? "bg-[color:var(--wp-blue,#3858e9)]"
                              : "bg-black/50"
                          }`}
                        >
                          {nestedActive ? "Đang chọn" : "Click để sửa"}
                        </div>
                      ) : null}
                      <div
                        className={
                          isBuilder && nestedActive
                            ? "pointer-events-auto"
                            : isBuilder
                              ? "pointer-events-none"
                              : undefined
                        }
                      >
                        <SectionRenderer
                          section={block}
                          theme={theme as LayoutRenderTheme}
                          products={products}
                          categories={categories}
                          getProductHref={getProductHref}
                          onProductClick={onProductClick}
                          motionIndex={Math.min(i, 11)}
                          motionDisabled
                          previewMode={isBuilder}
                          nestDepth={nestDepth + 1}
                          activeSectionId={activeSectionId}
                          onSelectSection={onSelectSection}
                          inlineEdit={
                            isBuilder &&
                            nestedActive &&
                            !block.editorLocked
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
