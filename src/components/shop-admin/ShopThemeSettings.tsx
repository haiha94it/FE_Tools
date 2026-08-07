"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { adminDataPanelClass } from "@/components/ui/table/ScrollableTableContainer";
import {
  applyTemplateToData,
  DEFAULT_SHOP_PERSONALIZATION,
  groupTemplatesByCategory,
  resolveArchetypeId,
  resolvePersonalization,
  SHOP_TEMPLATE_PRESETS,
  toSavePayload,
  type ShopTemplatePreset,
} from "@/lib/shop-personalization";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import { useAuthStore } from "@/stores/use-auth-store";
import {
  PDP_TEMPLATE_PRESETS,
  resolvePDPConfig,
  type PDPTemplateType,
} from "@/types/pdp-template";
import type {
  ShopArchetypeId,
  ShopPersonalizationData,
  ShopTemplateId,
} from "@/types/zalo-shop";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type TabId = "templates" | "pdp" | "colors" | "content";

const TABS: { id: TabId; label: string }[] = [
  { id: "templates", label: "Kiến trúc layout" },
  { id: "pdp", label: "Trang chi tiết SP" },
  { id: "colors", label: "Màu sắc" },
  { id: "content", label: "Nội dung" },
];

/** Wireframe silhouettes — unique per archetype structure */
function ArchetypeWireframe({ id, colors }: { id: ShopArchetypeId; colors: ShopTemplatePreset["preview"] }) {
  const { bg, surface, primary, accent } = colors;
  const box = (extra: string, fill = surface, label?: string) => (
    <div
      className={`flex items-center justify-center rounded-[2px] text-[7px] font-bold uppercase ${extra}`}
      style={{ background: fill, color: fill === accent || fill === primary ? "#fff" : primary }}
    >
      {label}
    </div>
  );

  switch (id) {
    case "bento-grid-tech":
      return (
        <div className="flex h-full flex-col gap-1 p-2" style={{ background: bg }}>
          <div className="mx-auto h-2.5 w-3/4 rounded-full" style={{ background: surface }} />
          <div className="grid flex-1 grid-cols-4 grid-rows-2 gap-1">
            {box("col-span-2 row-span-2", primary, "2×2")}
            {box("", accent, "s")}
            {box("")}
            {box("col-span-2")}
          </div>
        </div>
      );
    case "deal-wall-flash":
      return (
        <div className="flex h-full flex-col gap-0.5 p-1.5" style={{ background: bg }}>
          <div className="h-2 rounded" style={{ background: surface }} />
          <div className="grid flex-1 grid-cols-5 gap-0.5">
            {box("col-span-3", primary, "60%")}
            <div className="col-span-2 flex flex-col gap-0.5">
              {box("flex-1", accent, "Flash")}
              {box("flex-1")}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-3 rounded-sm" style={{ background: surface }} />
            ))}
          </div>
        </div>
      );
    case "catalog-first-masonry":
      return (
        <div className="flex h-full flex-col gap-1 p-2" style={{ background: bg }}>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-4 w-4 rounded-full" style={{ background: n === 1 ? primary : surface }} />
            ))}
          </div>
          <div className="grid flex-1 grid-cols-3 gap-0.5">
            {box("row-span-2 min-h-[28px]", primary)}
            {box("min-h-[12px]")}
            {box("row-span-2", accent)}
            {box("")}
            {box("col-span-2")}
          </div>
        </div>
      );
    case "split-storyteller":
      return (
        <div className="flex h-full flex-col" style={{ background: primary }}>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 p-2">
            <div className="h-1.5 w-16 rounded" style={{ background: "rgba(255,255,255,0.5)" }} />
            <div className="h-2 w-24 rounded" style={{ background: accent }} />
            <div className="mt-1 flex gap-1">
              <div className="h-2 w-8 rounded-full" style={{ background: accent }} />
              <div className="h-2 w-8 rounded-full border border-white/40" />
            </div>
          </div>
          <div className="grid h-10 grid-cols-2">
            <div style={{ background: "rgba(0,0,0,0.3)" }} />
            <div className="grid grid-cols-2 gap-px bg-black/20 p-0.5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ background: surface }} />
              ))}
            </div>
          </div>
        </div>
      );
    case "sidebar-commerce":
      return (
        <div className="grid h-full grid-cols-[30%_1fr] gap-0.5 p-1" style={{ background: bg }}>
          <div className="flex flex-col gap-0.5 rounded p-1" style={{ background: surface }}>
            <div className="h-2 rounded" style={{ background: primary }} />
            <div className="h-1.5 rounded" style={{ background: bg }} />
            <div className="h-1.5 rounded" style={{ background: bg }} />
            <div className="h-1.5 rounded" style={{ background: bg }} />
            <div className="mt-auto h-1.5 rounded" style={{ background: accent }} />
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="h-3 rounded" style={{ background: surface }} />
            <div className="grid flex-1 grid-cols-2 gap-0.5">
              {box("")}
              {box("")}
              {box("")}
              {box("")}
            </div>
          </div>
        </div>
      );
    case "mobile-native":
      return (
        <div className="mx-auto flex h-full w-[55%] flex-col border border-black/10" style={{ background: bg }}>
          <div className="h-2" style={{ background: surface }} />
          <div className="aspect-video" style={{ background: primary }} />
          <div className="grid flex-1 grid-cols-2 gap-0.5 p-0.5">
            {box("min-h-[14px]")}
            {box("min-h-[14px]")}
            {box("min-h-[14px]")}
            {box("min-h-[14px]")}
          </div>
          <div className="grid h-3 grid-cols-5 gap-px" style={{ background: surface }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} style={{ background: n === 1 ? accent : bg }} />
            ))}
          </div>
        </div>
      );
    case "magazine-editorial":
      return (
        <div className="flex h-full flex-col gap-1 p-2" style={{ background: bg }}>
          <div className="mx-auto h-2 w-4/5 rounded" style={{ background: primary }} />
          <div className="mx-auto h-1 w-2/3 rounded" style={{ background: surface }} />
          <div className="grid flex-1 grid-cols-2 gap-1">
            {box("", primary)}
            {box("", accent)}
          </div>
          <div className="h-2 rounded" style={{ background: surface }} />
          <div className="grid grid-cols-3 gap-0.5">
            {box("h-4")}
            {box("h-4")}
            {box("h-4")}
          </div>
        </div>
      );
    case "minimalist-essential":
    default:
      return (
        <div className="flex h-full flex-col gap-1 p-2" style={{ background: bg }}>
          <div
            className="mx-auto flex w-4/5 flex-1 flex-col items-center justify-center gap-1 rounded border"
            style={{ borderColor: `${primary}22`, background: surface }}
          >
            <div className="h-8 w-8 rounded-sm" style={{ background: `${primary}15` }} />
            <div className="h-1 w-12 rounded" style={{ background: primary }} />
          </div>
          <div className="grid grid-cols-3 divide-x border" style={{ borderColor: `${primary}18` }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-6" style={{ background: surface }} />
            ))}
          </div>
        </div>
      );
  }
}

function PDPWireframe({ id }: { id: PDPTemplateType }) {
  if (id === "dense-deal") {
    return (
      <div className="flex h-full flex-col gap-0.5 p-1.5">
        <div className="h-2 rounded bg-orange-500" />
        <div className="grid flex-1 grid-cols-2 gap-0.5">
          <div className="rounded bg-slate-300" />
          <div className="flex flex-col gap-0.5">
            <div className="h-2 rounded bg-rose-400" />
            <div className="flex-1 rounded bg-white" />
          </div>
        </div>
      </div>
    );
  }
  if (id === "editorial-story") {
    return (
      <div className="grid h-full grid-cols-[1.2fr_0.8fr] gap-0.5 p-1.5">
        <div className="flex flex-col gap-0.5">
          <div className="flex-1 rounded bg-slate-700" />
          <div className="flex-1 rounded bg-slate-500" />
        </div>
        <div className="rounded bg-white shadow-sm" />
      </div>
    );
  }
  if (id === "minimal-gallery") {
    return (
      <div className="flex h-full flex-col gap-0.5 p-1.5">
        <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-0.5">
          <div className="rounded bg-slate-200" />
          <div className="rounded bg-slate-300" />
          <div className="rounded bg-slate-300" />
          <div className="rounded bg-slate-200" />
        </div>
        <div className="h-3 rounded bg-white" />
      </div>
    );
  }
  // bento-tech
  return (
    <div className="grid h-full grid-cols-[1.1fr_0.9fr] gap-0.5 p-1.5">
      <div className="flex gap-0.5">
        <div className="w-2 rounded bg-slate-200" />
        <div className="flex-1 rounded bg-slate-300" />
      </div>
      <div className="rounded bg-white shadow-sm" />
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-gray-200 bg-white p-0.5 dark:border-gray-700"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 font-mono text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />
      </div>
    </label>
  );
}

function ThemePreview({ data }: { data: Required<ShopPersonalizationData> }) {
  const archetype = resolveArchetypeId(data.templateId);
  const preset = SHOP_TEMPLATE_PRESETS.find((p) => p.id === archetype);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm dark:border-gray-700">
      <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
        <p className="text-xs font-bold text-gray-900 dark:text-white">
          {preset?.name ?? archetype}
        </p>
        <p className="text-[10px] text-gray-500">{preset?.inspiredBy}</p>
      </div>
      <div className="h-36">
        <ArchetypeWireframe
          id={archetype}
          colors={{
            bg: data.backgroundColor,
            surface: data.surfaceColor,
            primary: data.primaryColor,
            accent: data.accentColor,
          }}
        />
      </div>
      <div className="space-y-1 border-t border-gray-100 px-3 py-2 text-[10px] text-gray-500 dark:border-gray-800">
        <p>
          <span className="font-semibold text-gray-700 dark:text-gray-300">DOM:</span>{" "}
          {preset?.pageLayoutLabel}
        </p>
        <p>
          <span className="font-semibold text-gray-700 dark:text-gray-300">UX:</span>{" "}
          {preset?.tags.join(" · ")}
        </p>
        <p className="line-clamp-2 italic">{preset?.philosophy}</p>
      </div>
    </div>
  );
}

export default function ShopThemeSettings() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id ?? "";

  const [tab, setTab] = useState<TabId>("templates");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ShopPersonalizationData>({
    ...DEFAULT_SHOP_PERSONALIZATION,
  });
  const [dirty, setDirty] = useState(false);

  const resolved = useMemo(() => resolvePersonalization(draft), [draft]);
  const archetype = resolveArchetypeId(resolved.templateId);

  const patch = useCallback((partial: Partial<ShopPersonalizationData>) => {
    setDraft((prev) => ({ ...prev, ...partial }));
    setDirty(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      try {
        const record = await zaloShopService.getPersonalization();
        if (cancelled) return;
        setRecordId(record.id);
        setDraft(
          resolvePersonalization(record.data as ShopPersonalizationData),
        );
        setDirty(false);
      } catch {
        if (!cancelled) {
          toast.error("Không tải được cấu hình theme");
          setDraft({ ...DEFAULT_SHOP_PERSONALIZATION });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectTemplate = (id: ShopTemplateId) => {
    setDraft((prev) => applyTemplateToData(prev, id, { keepCopy: true }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = toSavePayload(draft);
      const saved = await zaloShopService.savePersonalization(payload);
      setRecordId(saved.id);
      setDraft(resolvePersonalization(saved.data as ShopPersonalizationData));
      setDirty(false);
      toast.success("Đã lưu kiến trúc storefront");
    } catch {
      toast.error("Lưu thất bại. Kiểm tra đăng nhập và thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !window.confirm(
        "Xóa personalization và về Bento Grid Tech mặc định?",
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      await zaloShopService.deletePersonalization();
      setRecordId(null);
      setDraft({ ...DEFAULT_SHOP_PERSONALIZATION });
      setDirty(false);
      toast.success("Đã đặt lại mặc định");
    } catch {
      toast.error("Không thể xóa cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-hidden">
      <PageBreadcrumb
        pageTitle="Theme & Architecture"
        parents={[{ label: "Cửa hàng", href: "/shop" }]}
      />

      <div className={`${adminDataPanelClass} flex min-h-0 flex-1 flex-col gap-4`}>
        <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              8 kiến trúc storefront
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Mỗi template = DOM hierarchy + grid + UX flow khác hẳn (không chỉ đổi màu). Áp
              dụng cho{" "}
              {userId ? (
                <Link
                  href={`/store/${userId}`}
                  target="_blank"
                  className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                >
                  /store/{userId}
                </Link>
              ) : (
                "/store/..."
              )}
            </p>
            <p className="mt-1 text-[11px] text-gray-400">
              Đang chọn: <strong className="text-gray-700 dark:text-gray-200">{archetype}</strong>
              {recordId != null ? ` · #${recordId}` : " · chưa lưu"}
              {dirty ? " · có thay đổi" : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {userId ? (
              <Link
                href={`/store/${userId}`}
                target="_blank"
                className="inline-flex min-h-10 items-center rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Xem storefront
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => void handleReset()}
              disabled={saving || loading}
              className="min-h-10 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-600 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              Đặt lại
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || loading || !dirty}
              className="min-h-10 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : "Lưu kiến trúc"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-20 text-sm text-gray-500">
            Đang tải…
          </div>
        ) : (
          <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:flex-row lg:overflow-hidden">
            <div className="flex min-w-0 flex-1 flex-col gap-4 lg:overflow-y-auto lg:pr-1">
              <div className="flex flex-wrap gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={`min-h-9 flex-1 cursor-pointer rounded-lg px-3 py-2 text-xs font-bold transition sm:flex-none ${
                      tab === t.id
                        ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                        : "text-gray-500 hover:text-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {tab === "templates" ? (
                <div className="space-y-6">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Chọn 1 trong {SHOP_TEMPLATE_PRESETS.length} kiến trúc. Wireframe bên dưới phản
                    ánh DOM thật (sidebar / bento / masonry / 100vh / bottom nav…), không chỉ palette.
                  </p>
                  {groupTemplatesByCategory().map((group) => (
                    <div key={group.category}>
                      <h3 className="mb-2.5 text-xs font-extrabold uppercase tracking-[0.14em] text-gray-400">
                        {group.label}
                      </h3>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {group.items.map((preset) => {
                          const active = archetype === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectTemplate(preset.id)}
                              className={`cursor-pointer overflow-hidden rounded-2xl border text-left transition ${
                                active
                                  ? "border-brand-500 ring-2 ring-brand-500/30 shadow-md"
                                  : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                              }`}
                            >
                              <div className="relative h-32">
                                <ArchetypeWireframe id={preset.id} colors={preset.preview} />
                                {active ? (
                                  <span className="absolute right-2 top-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                                    Đang dùng
                                  </span>
                                ) : null}
                              </div>
                              <div className="bg-white p-3 dark:bg-gray-900">
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                  {preset.name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                                  {preset.inspiredBy}
                                </p>
                                <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                                  {preset.description}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {preset.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {tab === "pdp" ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    UI trang{" "}
                    <code className="rounded bg-gray-100 px-1 text-[11px] dark:bg-gray-800">
                      /store/…/category/product
                    </code>
                    . 4 kiến trúc PDP độc lập với storefront home. Store template gợi ý
                    default; bạn có thể override tại đây.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {PDP_TEMPLATE_PRESETS.map((preset) => {
                      const active =
                        (resolved.pdpTemplateId || "bento-tech") === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            patch({ pdpTemplateId: preset.id as PDPTemplateType })
                          }
                          className={`cursor-pointer rounded-2xl border p-4 text-left transition ${
                            active
                              ? "border-brand-500 bg-brand-50/50 ring-2 ring-brand-500/25 dark:bg-brand-500/10"
                              : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                          }`}
                        >
                          <div className="mb-3 h-16 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                            <PDPWireframe id={preset.id} />
                          </div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">
                            {preset.name}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">
                            {preset.inspiredBy}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {preset.description}
                          </p>
                          {active ? (
                            <span className="mt-2 inline-block text-[10px] font-bold text-brand-600">
                              Đang chọn
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {tab === "colors" ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    Màu tùy chỉnh chồng lên kiến trúc đã chọn — không đổi DOM hierarchy.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ColorField
                      label="Primary"
                      value={resolved.primaryColor}
                      onChange={(v) => patch({ primaryColor: v })}
                    />
                    <ColorField
                      label="Accent / CTA"
                      value={resolved.accentColor}
                      onChange={(v) => patch({ accentColor: v })}
                    />
                    <ColorField
                      label="Background"
                      value={resolved.backgroundColor}
                      onChange={(v) => patch({ backgroundColor: v })}
                    />
                    <ColorField
                      label="Surface"
                      value={resolved.surfaceColor}
                      onChange={(v) => patch({ surfaceColor: v })}
                    />
                    <ColorField
                      label="Muted"
                      value={resolved.mutedColor}
                      onChange={(v) => patch({ mutedColor: v })}
                    />
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Light / Dark
                      </span>
                      <select
                        value={resolved.themeMode}
                        onChange={(e) =>
                          patch({ themeMode: e.target.value as "light" | "dark" })
                        }
                        className="h-10 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium dark:border-gray-700 dark:bg-gray-900"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}

              {tab === "content" ? (
                <div className="grid grid-cols-1 gap-4">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Tiêu đề Hero
                    </span>
                    <input
                      type="text"
                      value={draft.heroTitle ?? ""}
                      onChange={(e) => patch({ heroTitle: e.target.value })}
                      className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Headline kiến trúc"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Mô tả / sub-headline
                    </span>
                    <textarea
                      value={draft.heroSubtitle ?? ""}
                      onChange={(e) => patch({ heroSubtitle: e.target.value })}
                      rows={3}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      CTA
                    </span>
                    <input
                      type="text"
                      value={draft.ctaText ?? ""}
                      onChange={(e) => patch({ ctaText: e.target.value })}
                      className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                      Announcement bar
                    </span>
                    <input
                      type="text"
                      value={draft.announcement ?? ""}
                      onChange={(e) => patch({ announcement: e.target.value })}
                      className="h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                      placeholder="Chỉ hiện ở Deal Wall / Mobile nếu bật"
                    />
                  </label>
                </div>
              ) : null}
            </div>

            <aside className="w-full shrink-0 lg:w-[320px] xl:w-[360px]">
              <div className="lg:sticky lg:top-0">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  Wireframe kiến trúc
                </p>
                <ThemePreview data={resolved} />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
