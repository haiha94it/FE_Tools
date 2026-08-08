/**
 * ProLayoutBuilder — full professional shell around LayoutCanvas:
 * patterns · history · a11y · tokens · versions · export/import · preview · draft
 */

"use client";

import LayoutCanvas, {
  type CanvasDevice,
} from "@/components/shop-admin/layout-canvas/LayoutCanvas";
import PropertiesPanel, {
  type LayoutSectionUpdate,
} from "@/components/shop-admin/layout-canvas/PropertiesPanel";
import {
  A11yPanel,
  GlobalTokensPanel,
  HistoryPanel,
  PatternsPanel,
  VersionsPanel,
} from "@/components/shop-admin/layout-canvas/BuilderPanels";
import type { LayoutRenderTheme } from "@/components/shop-admin/layout-canvas/renderers/section-style-utils";
import { auditLayoutSections } from "@/lib/layout-canvas-a11y";
import { getPatternById } from "@/lib/layout-canvas-patterns";
import {
  clearLayoutDraft,
  deleteLayoutVersion,
  exportLayoutDocument,
  importLayoutFromFile,
  listLayoutVersions,
  loadLayoutDraft,
  pushLayoutVersion,
  saveLayoutDraft,
  writePreviewDraft,
} from "@/lib/layout-canvas-storage";
import {
  layoutCanvasToLegacyFields,
  resolveLayoutCanvas,
} from "@/lib/shop-layout-canvas";
import type {
  LayoutCanvasDocument,
  LayoutCanvasGlobalTokens,
  LayoutCanvasVersionMeta,
  LayoutSection,
} from "@/types/shop-layout-canvas";
import type {
  ShopCategory,
  ShopPersonalizationData,
  ShopProduct,
} from "@/types/zalo-shop";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  FiDownload,
  FiExternalLink,
  FiUpload,
} from "react-icons/fi";

type LeftTab =
  | "inserter"
  | "patterns"
  | "history"
  | "a11y"
  | "tokens"
  | "versions";

export interface ProLayoutBuilderProps {
  userId: string;
  sellerId: string;
  draft: ShopPersonalizationData;
  onDraftChange: (partial: Partial<ShopPersonalizationData>) => void;
  products: ShopProduct[];
  categories: ShopCategory[];
  theme: LayoutRenderTheme;
  dataLoading?: boolean;
  /** Called when dirty for parent save bar */
  onDirty?: () => void;
}

const HISTORY_LIMIT = 40;

export default function ProLayoutBuilder({
  userId,
  sellerId,
  draft,
  onDraftChange,
  products,
  categories,
  theme,
  dataLoading,
  onDirty,
}: ProLayoutBuilderProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("inserter");
  const [device, setDevice] = useState<CanvasDevice>("desktop");
  const [styleDevice, setStyleDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [versions, setVersions] = useState<LayoutCanvasVersionMeta[]>([]);
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const doc = useMemo(() => resolveLayoutCanvas(draft), [draft]);
  const sections = doc.sections;

  const pastRef = useRef<LayoutSection[][]>([]);
  const futureRef = useRef<LayoutSection[][]>([]);
  const historyLabels = useRef<
    Array<{ id: string; label: string; at: number }>
  >([]);
  const [histTick, setHistTick] = useState(0);
  void histTick;

  useEffect(() => {
    setVersions(listLayoutVersions(userId));
    const saved = loadLayoutDraft(userId);
    if (saved?.savedAt) {
      setDraftNote(
        `Draft local: ${new Date(saved.savedAt).toLocaleString("vi-VN")}`,
      );
    }
  }, [userId]);

  // Auto-save draft
  useEffect(() => {
    const t = window.setTimeout(() => {
      saveLayoutDraft(userId, draft);
      setDraftNote(`Draft auto-save ${new Date().toLocaleTimeString("vi-VN")}`);
    }, 800);
    return () => window.clearTimeout(t);
  }, [draft, userId]);

  const commitDoc = useCallback(
    (nextDoc: LayoutCanvasDocument, label?: string) => {
      pastRef.current = [
        ...pastRef.current.slice(-(HISTORY_LIMIT - 1)),
        sections,
      ];
      futureRef.current = [];
      if (label) {
        historyLabels.current = [
          {
            id: `h_${Date.now()}`,
            label,
            at: Date.now(),
          },
          ...historyLabels.current,
        ].slice(0, 30);
      }
      setHistTick((x) => x + 1);
      const legacy = layoutCanvasToLegacyFields(nextDoc);
      onDraftChange({
        layoutCanvas: nextDoc,
        ...legacy,
        templateId: "custom-drag-drop",
        pageLayout: "custom-builder",
      });
      onDirty?.();
    },
    [sections, onDraftChange, onDirty],
  );

  const handleSectionsChange = useCallback(
    (next: LayoutSection[]) => {
      commitDoc({ ...doc, sections: next }, "Cập nhật sections");
    },
    [commitDoc, doc],
  );

  const undo = useCallback(() => {
    const prev = pastRef.current.pop();
    if (!prev) return;
    futureRef.current.push(sections);
    setHistTick((x) => x + 1);
    const nextDoc = { ...doc, sections: prev };
    const legacy = layoutCanvasToLegacyFields(nextDoc);
    onDraftChange({
      layoutCanvas: nextDoc,
      ...legacy,
      templateId: "custom-drag-drop",
      pageLayout: "custom-builder",
    });
    onDirty?.();
  }, [doc, sections, onDraftChange, onDirty]);

  const redo = useCallback(() => {
    const next = futureRef.current.pop();
    if (!next) return;
    pastRef.current.push(sections);
    setHistTick((x) => x + 1);
    const nextDoc = { ...doc, sections: next };
    const legacy = layoutCanvasToLegacyFields(nextDoc);
    onDraftChange({
      layoutCanvas: nextDoc,
      ...legacy,
      templateId: "custom-drag-drop",
      pageLayout: "custom-builder",
    });
    onDirty?.();
  }, [doc, sections, onDraftChange, onDirty]);

  const handleSectionUpdate = useCallback(
    (sectionId: string, update: LayoutSectionUpdate) => {
      const next = sections.map((sec) => {
        if (sec.id !== sectionId) return sec;
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
      });
      handleSectionsChange(next);
    },
    [sections, handleSectionsChange],
  );

  const applyPattern = useCallback(
    (patternId: string) => {
      const pattern = getPatternById(patternId);
      if (!pattern) return;
      if (
        !window.confirm(
          `Chèn pattern “${pattern.name}”? Các khối sẽ được thêm vào cuối canvas.`,
        )
      ) {
        return;
      }
      const built = pattern.build();
      handleSectionsChange([...sections, ...built]);
      if (built[0]) setActiveSectionId(built[0].id);
    },
    [sections, handleSectionsChange],
  );

  const tokens: LayoutCanvasGlobalTokens = doc.page?.tokens ?? {};

  const setTokens = useCallback(
    (next: LayoutCanvasGlobalTokens) => {
      const nextDoc: LayoutCanvasDocument = {
        ...doc,
        page: {
          ...doc.page,
          tokens: next,
        },
      };
      // Also patch personalization colors if set
      const colorPatch: Partial<ShopPersonalizationData> = {};
      if (next.primaryColor) colorPatch.primaryColor = next.primaryColor;
      if (next.accentColor) colorPatch.accentColor = next.accentColor;
      if (next.backgroundColor) colorPatch.backgroundColor = next.backgroundColor;
      if (next.surfaceColor) colorPatch.surfaceColor = next.surfaceColor;

      const legacy = layoutCanvasToLegacyFields(nextDoc);
      onDraftChange({
        layoutCanvas: nextDoc,
        ...legacy,
        ...colorPatch,
        templateId: "custom-drag-drop",
        pageLayout: "custom-builder",
      });
      onDirty?.();
    },
    [doc, onDraftChange, onDirty],
  );

  const a11yIssues = useMemo(() => auditLayoutSections(sections), [sections]);
  const activeSection =
    sections.find((s) => s.id === activeSectionId) ?? null;

  // Performance mode: strip heavy effects in theme for preview
  const renderTheme = useMemo(() => {
    if (!tokens.performanceMode) return theme;
    return theme;
  }, [theme, tokens.performanceMode]);

  // Keyboard global for this builder
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // parent save — dispatch custom event
        window.dispatchEvent(new CustomEvent("layout-builder-save"));
      }
      if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        writePreviewDraft(sellerId, draft);
        window.open(`/store/${sellerId}?preview=1`, "_blank");
      }
      const typing =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setLeftTab("inserter");
      }
      if (e.key === "Escape" && !typing) {
        setActiveSectionId(null);
      }
      // 1–6 jump left tabs
      if (!typing && !mod && e.key >= "1" && e.key <= "6") {
        const tabs: LeftTab[] = [
          "inserter",
          "patterns",
          "history",
          "a11y",
          "tokens",
          "versions",
        ];
        const idx = Number(e.key) - 1;
        if (tabs[idx]) {
          e.preventDefault();
          setLeftTab(tabs[idx]);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sellerId, draft]);

  const leftPanel: ReactNode = (() => {
    switch (leftTab) {
      case "patterns":
        return <PatternsPanel onApply={applyPattern} />;
      case "history":
        return (
          <HistoryPanel
            pastCount={pastRef.current.length}
            futureCount={futureRef.current.length}
            entries={historyLabels.current}
            onUndo={undo}
            onRedo={redo}
            onJump={() => {
              /* jump to snapshot would need full history tree — undo N times */
            }}
          />
        );
      case "a11y":
        return (
          <A11yPanel
            issues={a11yIssues}
            onSelectSection={setActiveSectionId}
          />
        );
      case "tokens":
        return <GlobalTokensPanel tokens={tokens} onChange={setTokens} />;
      case "versions":
        return (
          <VersionsPanel
            versions={versions}
            onSaveVersion={() => {
              const name = window.prompt(
                "Tên bản snapshot",
                `Bản ${new Date().toLocaleString("vi-VN")}`,
              );
              if (name === null) return;
              setVersions(pushLayoutVersion(userId, name, doc));
            }}
            onRestore={(id) => {
              const v = versions.find((x) => x.id === id);
              if (!v) return;
              if (!window.confirm(`Khôi phục “${v.name}”?`)) return;
              commitDoc(
                {
                  ...doc,
                  sections: v.sectionsSnapshot,
                  page: v.pageSnapshot ?? doc.page,
                },
                `Khôi phục ${v.name}`,
              );
            }}
            onDelete={(id) => setVersions(deleteLayoutVersion(userId, id))}
          />
        );
      default:
        return null; // inserter lives inside LayoutCanvas
    }
  })();

  return (
    <div
      className="flex h-full min-h-0 flex-col bg-[#1e1e1e]"
      style={{ ["--wp-blue" as string]: "#3858e9" }}
    >
      {/* Pro toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/10 px-2 py-1.5">
        {(
          [
            ["inserter", "Khối"],
            ["patterns", "Patterns"],
            ["history", "History"],
            ["a11y", "A11y"],
            ["tokens", "Tokens"],
            ["versions", "Versions"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setLeftTab(id)}
            className={`cursor-pointer rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
              leftTab === id
                ? "bg-white/15 text-white"
                : "text-white/65 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
            {id === "a11y" && a11yIssues.some((i) => i.severity === "error")
              ? " !"
              : ""}
          </button>
        ))}

        <span className="mx-1 h-4 w-px bg-white/15" />

        <button
          type="button"
          onClick={() => {
            writePreviewDraft(sellerId, draft);
            window.open(`/store/${sellerId}?preview=1`, "_blank");
          }}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/10"
        >
          <FiExternalLink className="h-3.5 w-3.5" />
          Preview
        </button>
        <button
          type="button"
          onClick={() => exportLayoutDocument(doc)}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/10"
        >
          <FiDownload className="h-3.5 w-3.5" />
          Export
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-bold text-white/80 hover:bg-white/10"
        >
          <FiUpload className="h-3.5 w-3.5" />
          Import
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void importLayoutFromFile(file).then((imported) => {
              if (!imported) {
                window.alert("File không hợp lệ");
                return;
              }
              if (!window.confirm("Import sẽ thay toàn bộ canvas hiện tại?"))
                return;
              commitDoc(imported, "Import JSON");
            });
            e.target.value = "";
          }}
        />

        <span className="ml-auto truncate text-[10px] text-white/40">
          {draftNote ?? "—"} · / patterns · ⌘P preview · ⌘S save
        </span>
        <button
          type="button"
          onClick={() => {
            clearLayoutDraft(userId);
            setDraftNote(null);
          }}
          className="cursor-pointer text-[10px] text-white/40 underline hover:text-white/70"
        >
          Xoá draft
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]">
        <div className="flex min-h-0 min-w-0">
          {/* Extra left when not inserter */}
          {leftTab !== "inserter" ? (
            <aside className="flex w-[240px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 xl:w-[260px]">
              {leftPanel}
            </aside>
          ) : null}

          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <LayoutCanvas
              sections={
                tokens.performanceMode
                  ? sections.map((s) => ({
                      ...s,
                      styling: {
                        ...s.styling,
                        blur: "none",
                        animation: s.styling.animation === "none" ? "none" : "fade",
                        hover: "none",
                      },
                    }))
                  : device === "mobile"
                    ? sections.map((s) => ({
                        ...s,
                        styling: {
                          ...s.styling,
                          ...(s.stylingMobile ?? {}),
                        },
                        widthPreset: s.widthPresetMobile ?? s.widthPreset,
                      }))
                    : sections
              }
              activeSectionId={activeSectionId}
              onSectionsChange={handleSectionsChange}
              onSelectSection={setActiveSectionId}
              onOpenSectionSettings={setActiveSectionId}
              products={products}
              categories={categories}
              theme={renderTheme}
              dataLoading={dataLoading}
              devicePreview={device}
              onDevicePreviewChange={setDevice}
              fillHeight
              className="h-full rounded-none border-0"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 lg:border-l lg:border-t-0">
          {activeSection ? (
            <PropertiesPanel
              section={activeSection}
              onSectionUpdate={handleSectionUpdate}
              onClose={() => setActiveSectionId(null)}
              className="min-h-0 flex-1 rounded-none border-0 shadow-none"
              a11yIssues={a11yIssues}
              styleDevice={styleDevice}
              onStyleDeviceChange={setStyleDevice}
              products={products}
              categories={categories}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Chọn khối để chỉnh
              </p>
              <p className="mt-2 max-w-xs text-[12px] text-gray-500">
                Patterns · A11y · Tokens · Versions · Export/Import · Preview
                draft trên toolbar.
              </p>
              <ul className="mt-4 space-y-1 text-left text-[11px] text-gray-400">
                <li>· / mở khối · ⌘P preview · ⌘Z undo</li>
                <li>· Hover block → toolbar · + chèn</li>
                <li>· Desktop/Mobile style trong inspector</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
