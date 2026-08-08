/**
 * Side panels: Patterns, History, A11y, Global tokens, Versions.
 */

"use client";

import { LAYOUT_PATTERNS } from "@/lib/layout-canvas-patterns";
import {
  a11ySummary,
  type A11yIssue,
} from "@/lib/layout-canvas-a11y";
import type {
  LayoutCanvasGlobalTokens,
  LayoutCanvasVersionMeta,
  LayoutRadiusPreset,
} from "@/types/shop-layout-canvas";
import { FiAlertCircle, FiAlertTriangle, FiInfo } from "react-icons/fi";

export function PatternsPanel({
  onApply,
}: {
  onApply: (patternId: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Patterns
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          Bộ layout sẵn
        </p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
        {LAYOUT_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onApply(p.id)}
            className="flex w-full cursor-pointer flex-col rounded-xl border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-[color:var(--wp-blue,#3858e9)] hover:bg-white dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800"
          >
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {p.name}
            </span>
            <span className="mt-0.5 text-[11px] text-gray-500">
              {p.description}
            </span>
            <span className="mt-2 flex flex-wrap gap-1">
              {p.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-gray-200/80 px-1.5 py-0.5 text-[9px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                >
                  {t}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function HistoryPanel({
  pastCount,
  futureCount,
  entries,
  onUndo,
  onRedo,
  onJump,
}: {
  pastCount: number;
  futureCount: number;
  entries: Array<{ id: string; label: string; at: number }>;
  onUndo: () => void;
  onRedo: () => void;
  onJump: (index: number) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          History
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          {pastCount} undo · {futureCount} redo
        </p>
      </div>
      <div className="flex gap-1 border-b border-gray-100 p-2 dark:border-gray-800">
        <button
          type="button"
          disabled={pastCount === 0}
          onClick={onUndo}
          className="flex-1 cursor-pointer rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold disabled:opacity-40 dark:bg-gray-800"
        >
          Undo
        </button>
        <button
          type="button"
          disabled={futureCount === 0}
          onClick={onRedo}
          className="flex-1 cursor-pointer rounded-lg bg-gray-100 py-1.5 text-[11px] font-bold disabled:opacity-40 dark:bg-gray-800"
        >
          Redo
        </button>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <p className="px-2 py-6 text-center text-[11px] text-gray-400">
            Chưa có thao tác
          </p>
        ) : (
          <ul className="space-y-0.5">
            {entries.map((e, i) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className="flex w-full cursor-pointer flex-col rounded-lg px-2 py-1.5 text-left text-[11px] hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {e.label}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(e.at).toLocaleTimeString("vi-VN")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function A11yPanel({
  issues,
  onSelectSection,
}: {
  issues: A11yIssue[];
  onSelectSection: (id: string) => void;
}) {
  const sum = a11ySummary(issues);
  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Accessibility
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          {sum.errors} lỗi · {sum.warns} cảnh báo · {sum.infos} gợi ý
        </p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {issues.length === 0 ? (
          <p className="px-2 py-8 text-center text-[11px] text-emerald-600">
            Không phát hiện vấn đề a11y cơ bản.
          </p>
        ) : (
          issues.map((issue) => (
            <button
              key={issue.id}
              type="button"
              onClick={() => issue.sectionId && onSelectSection(issue.sectionId)}
              className="flex w-full cursor-pointer gap-2 rounded-lg border border-gray-100 px-2 py-2 text-left dark:border-gray-800"
            >
              <span className="mt-0.5 shrink-0">
                {issue.severity === "error" ? (
                  <FiAlertCircle className="h-3.5 w-3.5 text-rose-500" />
                ) : issue.severity === "warn" ? (
                  <FiAlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                ) : (
                  <FiInfo className="h-3.5 w-3.5 text-sky-500" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-bold text-gray-500">
                  {issue.sectionLabel || "Trang"}
                </span>
                <span className="block text-[11px] text-gray-800 dark:text-gray-200">
                  {issue.message}
                </span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function GlobalTokensPanel({
  tokens,
  onChange,
}: {
  tokens: LayoutCanvasGlobalTokens;
  onChange: (next: LayoutCanvasGlobalTokens) => void;
}) {
  const set = (partial: Partial<LayoutCanvasGlobalTokens>) =>
    onChange({ ...tokens, ...partial });

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Tokens
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          Design toàn trang
        </p>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {(
          [
            ["primaryColor", "Primary"],
            ["accentColor", "Accent"],
            ["backgroundColor", "Background"],
            ["surfaceColor", "Surface"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase text-gray-400">
              {label}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tokens[key] || "#3858e9"}
                onChange={(e) => set({ [key]: e.target.value })}
                className="h-9 w-10 cursor-pointer rounded border border-gray-200 bg-white p-0.5 dark:border-gray-700"
              />
              <input
                type="text"
                value={tokens[key] || ""}
                onChange={(e) => set({ [key]: e.target.value })}
                placeholder="#hex"
                className="h-9 min-w-0 flex-1 rounded-lg border border-gray-200 px-2 text-xs dark:border-gray-700 dark:bg-gray-900"
              />
            </div>
          </label>
        ))}
        <div>
          <span className="text-[10px] font-bold uppercase text-gray-400">
            Radius mặc định
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {(
              [
                "none",
                "md",
                "xl",
                "2xl",
                "pill",
              ] as LayoutRadiusPreset[]
            ).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set({ radius: r })}
                className={`cursor-pointer rounded-lg border px-2 py-1 text-[10px] font-bold ${
                  tokens.radius === r
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-gray-200 text-gray-600 dark:border-gray-700"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
            Performance mode
          </span>
          <input
            type="checkbox"
            checked={Boolean(tokens.performanceMode)}
            onChange={(e) => set({ performanceMode: e.target.checked })}
            className="h-4 w-4 cursor-pointer"
          />
        </label>
        <p className="text-[10px] text-gray-400">
          Performance mode tắt blur nặng / giảm animation khi nhiều section.
        </p>
      </div>
    </div>
  );
}

export function VersionsPanel({
  versions,
  onSaveVersion,
  onRestore,
  onDelete,
}: {
  versions: LayoutCanvasVersionMeta[];
  onSaveVersion: () => void;
  onRestore: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-gray-950">
      <div className="border-b border-gray-200 px-3 py-2.5 dark:border-gray-800">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">
          Versions
        </p>
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-100">
          Snapshot local
        </p>
      </div>
      <div className="p-2">
        <button
          type="button"
          onClick={onSaveVersion}
          className="w-full cursor-pointer rounded-lg bg-[color:var(--wp-blue,#3858e9)] py-2 text-xs font-bold text-white"
        >
          Lưu bản hiện tại
        </button>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
        {versions.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-gray-400">
            Chưa có snapshot
          </p>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className="rounded-lg border border-gray-200 p-2 dark:border-gray-700"
            >
              <p className="text-[11px] font-bold text-gray-800 dark:text-gray-100">
                {v.name}
              </p>
              <p className="text-[10px] text-gray-400">
                {new Date(v.createdAt).toLocaleString("vi-VN")} ·{" "}
                {v.sectionsSnapshot.length} khối
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => onRestore(v.id)}
                  className="flex-1 cursor-pointer rounded bg-gray-100 py-1 text-[10px] font-bold dark:bg-gray-800"
                >
                  Khôi phục
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(v.id)}
                  className="cursor-pointer rounded px-2 py-1 text-[10px] font-bold text-rose-600"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
