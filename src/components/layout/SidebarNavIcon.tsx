"use client";

import type { NavIconKey, NavIconTone } from "@/config/navigation";
import {
  BoxCubeIcon,
  ChatIcon,
  GridIcon,
  GroupIcon,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  UserCircleIcon,
} from "@/icons";
import type { ComponentType, SVGProps } from "react";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

const ICON_MAP: Record<NavIconKey, SvgIcon> = {
  grid: GridIcon,
  chat: ChatIcon,
  user: UserCircleIcon,
  group: GroupIcon,
  calendar: GridIcon,
  table: GridIcon,
  list: ListIcon,
  page: PageIcon,
  chart: PieChartIcon,
  box: BoxCubeIcon,
  plugin: PlugInIcon,
};

const TONE_CLASS: Record<NavIconTone, string> = {
  brand: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
  info: "bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400",
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  purple: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
  error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
};

const TONE_ACTIVE_CLASS: Record<NavIconTone, string> = {
  brand: "ring-2 ring-brand-500/25 shadow-sm dark:ring-brand-400/30",
  success: "ring-2 ring-success-500/25 shadow-sm dark:ring-success-400/30",
  warning: "ring-2 ring-warning-500/25 shadow-sm dark:ring-orange-400/30",
  info: "ring-2 ring-blue-light-500/25 shadow-sm dark:ring-blue-light-400/30",
  neutral: "ring-2 ring-gray-300/80 shadow-sm dark:ring-gray-600/50",
  purple: "ring-2 ring-violet-500/25 shadow-sm dark:ring-violet-400/30",
  error: "ring-2 ring-error-500/25 shadow-sm dark:ring-error-400/30",
};

interface SidebarNavIconProps {
  icon: NavIconKey;
  tone?: NavIconTone;
  active?: boolean;
}

export default function SidebarNavIcon({
  icon,
  tone = "neutral",
  active = false,
}: SidebarNavIconProps) {
  const Icon = ICON_MAP[icon];
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center transition-all duration-200 ${
        active
          ? "text-brand-500 dark:text-brand-400"
          : "text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200"
      }`}
    >
      <Icon className="size-[20px]" />
    </span>
  );
}