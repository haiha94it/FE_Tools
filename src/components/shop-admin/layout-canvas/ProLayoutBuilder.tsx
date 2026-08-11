/**
 * ProLayoutBuilder — full professional shell around LayoutCanvas:
 * patterns · history · a11y · tokens · versions · export/import · preview · draft
 */

"use client";

import { toast } from "@/lib/toast";

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
  findSectionDeep,
  updateSectionDeep,
} from "@/lib/layout-canvas-nested";
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
  resolvePdpLayoutCanvas,
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
  /** Trang đang tạo: "home" | "pdp" */
  targetPage?: "home" | "pdp";
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
  targetPage = "home",
}: ProLayoutBuilderProps) {
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<LeftTab>("inserter");
  const [device, setDevice] = useState<CanvasDevice>("desktop");
  const [styleDevice, setStyleDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [versions, setVersions] = useState<LayoutCanvasVersionMeta[]>(() =>
    typeof window !== "undefined" ? listLayoutVersions(userId) : [],
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const doc = useMemo(
    () =>
      targetPage === "pdp"
        ? resolvePdpLayoutCanvas(draft)
        : resolveLayoutCanvas(draft),
    [draft, targetPage],
  );
  const sections = doc.sections;

  const [past, setPast] = useState<LayoutSection[][]>([]);
  const [future, setFuture] = useState<LayoutSection[][]>([]);
  const [historyEntries, setHistoryEntries] = useState<
    Array<{ id: string; label: string; at: number }>
  >([]);

  const pastCount = past.length;
  const futureCount = future.length;

  const [draftNote, setDraftNote] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = loadLayoutDraft(userId);
    return saved?.savedAt
      ? `Draft local: ${new Date(saved.savedAt).toLocaleString("vi-VN")}`
      : null;
  });

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
      setPast((prev) => [...prev.slice(-(HISTORY_LIMIT - 1)), sections]);
      setFuture([]);
      if (label) {
        setHistoryEntries((prev) =>
          [
            {
              id: `h_${Date.now()}`,
              label,
              at: Date.now(),
            },
            ...prev,
          ].slice(0, 30),
        );
      }
      if (targetPage === "pdp") {
        onDraftChange({
          pdpLayoutCanvas: nextDoc,
        });
      } else {
        const legacy = layoutCanvasToLegacyFields(nextDoc);
        onDraftChange({
          layoutCanvas: nextDoc,
          ...legacy,
          templateId: "custom-drag-drop",
          pageLayout: "custom-builder",
        });
      }
      onDirty?.();
    },
    [sections, onDraftChange, onDirty, targetPage],
  );

  const handleSectionsChange = useCallback(
    (next: LayoutSection[]) => {
      commitDoc({ ...doc, sections: next }, "Cập nhật sections");
    },
    [commitDoc, doc],
  );

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;
      const prev = prevPast[prevPast.length - 1];
      setFuture((prevFuture) => [sections, ...prevFuture]);
      const nextDoc = { ...doc, sections: prev };
      const legacy = layoutCanvasToLegacyFields(nextDoc);
      onDraftChange({
        layoutCanvas: nextDoc,
        ...legacy,
        templateId: "custom-drag-drop",
        pageLayout: "custom-builder",
      });
      onDirty?.();
      return prevPast.slice(0, -1);
    });
  }, [doc, sections, onDraftChange, onDirty]);

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;
      const next = prevFuture[0];
      setPast((prevPast) => [...prevPast, sections]);
      const nextDoc = { ...doc, sections: next };
      const legacy = layoutCanvasToLegacyFields(nextDoc);
      onDraftChange({
        layoutCanvas: nextDoc,
        ...legacy,
        templateId: "custom-drag-drop",
        pageLayout: "custom-builder",
      });
      onDirty?.();
      return prevFuture.slice(1);
    });
  }, [doc, sections, onDraftChange, onDirty]);

  const handleSectionUpdate = useCallback(
    (sectionId: string, update: LayoutSectionUpdate) => {
      const next = updateSectionDeep(sections, sectionId, {
        enabled: update.enabled,
        widthPreset: update.widthPreset,
        widthPresetMobile: update.widthPresetMobile,
        label: update.label,
        groupId: update.groupId,
        editorLocked: update.editorLocked,
        styling: update.styling,
        stylingMobile: update.stylingMobile,
        data: update.data,
      });
      handleSectionsChange(next);
    },
    [sections, handleSectionsChange],
  );

  const applyPattern = useCallback(
    (patternId: string) => {
      const pattern = getPatternById(patternId);
      if (!pattern) return;
      const built = pattern.build();
      handleSectionsChange([...sections, ...built]);
      if (built[0]) setActiveSectionId(built[0].id);
      toast.success(`Đã chèn mẫu “${pattern.name}” vào canvas`);
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
  /** Hỗ trợ chọn block lồng trong Container */
  const activeSection = useMemo(
    () =>
      activeSectionId
        ? findSectionDeep(sections, activeSectionId)
        : null,
    [sections, activeSectionId],
  );

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
            pastCount={pastCount}
            futureCount={futureCount}
            entries={historyEntries}
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
              const name = `Bản snapshot ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ${new Date().toLocaleDateString("vi-VN")}`;
              setVersions(pushLayoutVersion(userId, name, doc));
              toast.success(`Đã lưu ${name}`);
            }}
            onRestore={(id) => {
              const v = versions.find((x) => x.id === id);
              if (!v) return;
              commitDoc(
                {
                  ...doc,
                  sections: v.sectionsSnapshot,
                  page: v.pageSnapshot ?? doc.page,
                },
                `Khôi phục ${v.name}`,
              );
              toast.info(`Đã khôi phục “${v.name}”`);
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
                toast.error("File JSON không hợp lệ. Vui lòng kiểm tra lại!");
                return;
              }
              commitDoc(imported, "Import JSON");
              toast.success("Đã import cấu hình layout mới thành công");
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
              onSelectSection={setActiveSectionId}
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
