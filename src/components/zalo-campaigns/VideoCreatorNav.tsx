"use client";

import { VIDEO_CREATOR_BASE } from "@/config/api";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  VIDEO_CREATOR_NAV_GROUPS,
  VIDEO_CREATOR_NAV_ITEMS,
  type VideoCreatorNavItem,
} from "./video-creator-nav-config";

interface VideoCreatorNavProps {
  accountId: number;
}

const NAV_ICON_PX = { compact: 16, desktop: 20 } as const;

function navIconColorClass(item: VideoCreatorNavItem, active: boolean) {
  if (!active) return "text-gray-500 dark:text-gray-400";
  if (item.highlight) return "text-white";
  return "text-brand-600 dark:text-brand-400";
}

function NavIcon({
  item,
  active,
  compact,
}: {
  item: VideoCreatorNavItem;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;
  const px = compact ? NAV_ICON_PX.compact : NAV_ICON_PX.desktop;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: px, height: px }}
      aria-hidden
    >
      <Icon
        size={px}
        className={navIconColorClass(item, active)}
        style={{ width: px, height: px, minWidth: px, minHeight: px }}
      />
    </span>
  );
}

export default function VideoCreatorNav({ accountId }: VideoCreatorNavProps) {
  const pathname = usePathname();
  const base = `${VIDEO_CREATOR_BASE}/${accountId}`;

  const isActive = (slug: string) => {
    if (!slug) return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(`${base}/${slug}`);
  };

  const hrefFor = (slug: string) => (slug ? `${base}/${slug}` : base);

  const linkClass = (item: VideoCreatorNavItem, compact?: boolean) => {
    const active = isActive(item.slug);

    if (compact) {
      return `inline-flex shrink-0 snap-start items-center gap-1.5 rounded-lg px-3 py-2 text-theme-xs font-medium transition sm:gap-2 sm:px-3.5 sm:text-sm ${
        active
          ? item.highlight
            ? "bg-brand-500 text-white shadow-theme-xs"
            : "bg-brand-50 text-brand-700 ring-1 ring-brand-200 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-brand-500/25"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
      }`;
    }

    return `group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      active
        ? item.highlight
          ? "bg-brand-500 text-white shadow-theme-xs"
          : "border-l-2 border-brand-500 bg-brand-50 pl-[10px] text-brand-700 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-300"
        : "border-l-2 border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200"
    }`;
  };

  const mainItems = VIDEO_CREATOR_NAV_ITEMS.filter((i) => i.group === "main");
  const contentItems = VIDEO_CREATOR_NAV_ITEMS.filter((i) => i.group === "content");
  const settingsItems = VIDEO_CREATOR_NAV_ITEMS.filter((i) => i.group === "settings");

  return (
    <>
      {/* Mobile — tab bar */}
      <nav
        aria-label="Điều hướng kênh video"
        className="shrink-0 border-b border-gray-100 bg-white lg:hidden dark:border-gray-800 dark:bg-gray-900/50"
      >
        <div className="flex gap-1.5 overflow-x-auto overscroll-x-contain px-3 py-2.5 no-scrollbar snap-x snap-mandatory">
          {VIDEO_CREATOR_NAV_ITEMS.map((item) => (
            <Link
              key={item.slug || "analytics"}
              href={hrefFor(item.slug)}
              className={linkClass(item, true)}
            >
              <NavIcon item={item} active={isActive(item.slug)} compact />
              <span>{item.shortLabel}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop — sidebar */}
      <aside
        aria-label="Điều hướng kênh video"
        className="hidden w-[232px] shrink-0 flex-col border-r border-gray-100 bg-white lg:flex dark:border-gray-800 dark:bg-transparent"
      >
        <div className="custom-scrollbar flex-1 overflow-y-auto p-3">
          <ul className="space-y-0.5">
            {mainItems.map((item) => (
              <li key={item.slug || "analytics"}>
                <Link href={hrefFor(item.slug)} className={linkClass(item)}>
                  <NavIcon item={item} active={isActive(item.slug)} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {VIDEO_CREATOR_NAV_GROUPS.content}
          </p>
          <ul className="space-y-0.5">
            {contentItems.map((item) => (
              <li key={item.slug}>
                <Link href={hrefFor(item.slug)} className={linkClass(item)}>
                  <NavIcon item={item} active={isActive(item.slug)} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-2 mt-5 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {VIDEO_CREATOR_NAV_GROUPS.settings}
          </p>
          <ul className="space-y-0.5">
            {settingsItems.map((item) => (
              <li key={item.slug}>
                <Link href={hrefFor(item.slug)} className={linkClass(item)}>
                  <NavIcon item={item} active={isActive(item.slug)} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </>
  );
}