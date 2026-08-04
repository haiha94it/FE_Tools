"use client";

import BrandLogo from "@/components/common/BrandLogo";
import SidebarNavIcon from "@/components/layout/SidebarNavIcon";
import {
  mainNavItems,
  otherNavItems,
  type NavItemConfig,
  type NavRole,
} from "@/config/navigation";
import { canAccessSupportBotSetup } from "@/lib/map-auth-user";
import {
  canManageTeam,
  filterNavItemsForTeam,
} from "@/lib/team-collaboration-utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useTeamCollaborationStore } from "@/stores/use-team-collaboration-store";
import { ChevronDownIcon, HorizontaLDots } from "../icons/index";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/SidebarContext";

type NavItem = NavItemConfig;

function userHasNavRole(
  roles: NavRole[] | undefined,
  user: {
    isAdmin?: boolean;
    isSaler?: boolean;
    isSaleManager?: boolean;
    isSupporter?: boolean;
  } | null,
): boolean {
  if (!roles?.length) return true;
  if (!user) return false;
  return roles.some((role) => {
    if (role === "admin") return Boolean(user.isAdmin);
    if (role === "saler") return Boolean(user.isSaler);
    if (role === "sale_manager") return Boolean(user.isSaleManager);
    if (role === "supporter") return Boolean(user.isSupporter);
    return false;
  });
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const campaignPermissions = useTeamCollaborationStore((s) => s.campaignPermissions);

  const navItems = React.useMemo(() => {
    const roleFiltered = mainNavItems
      .map((item) => {
        if (item.hidden) return null;
        if (!userHasNavRole(item.roles, user)) return null;
        if (item.managerOnly && !canManageTeam(user)) return null;
        if (item.hideForEmployee && user?.isEmployee) return null;

        if (item.subItems?.length) {
          const subItems = item.subItems.filter((sub) => {
            if (sub.requireSupportBotAccess) {
              return canAccessSupportBotSetup(user);
            }
            return userHasNavRole(sub.roles, user);
          });
          if (!subItems.length) return null;
          return { ...item, subItems };
        }
        return item;
      })
      .filter((item): item is (typeof mainNavItems)[number] => item != null);
    return filterNavItemsForTeam(roleFiltered, user, campaignPermissions);
  }, [user, campaignPermissions]);
  const othersItems = React.useMemo(
    () => otherNavItems.filter((item) => userHasNavRole(item.roles, user)),
    [user],
  );

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {},
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname === path || pathname.startsWith(`${path}/`);
    },
    [pathname],
  );

  useEffect(() => {
    let submenuMatched = false;
    (["main", "others"] as const).forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        nav.subItems?.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu({ type: menuType, index });
            submenuMatched = true;
          }
        });
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [pathname, isActive, navItems, othersItems]);

  // Đo lại chiều cao submenu khi mở / đổi quyền / resize — tránh cắt item cuối (Sinh nhật)
  useEffect(() => {
    if (openSubmenu === null) return undefined;
    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const measure = () => {
      const el = subMenuRefs.current[key];
      if (!el) return;
      setSubMenuHeight((prev) => ({
        ...prev,
        [key]: el.scrollHeight || 0,
      }));
    };
    measure();
    // layout xong (font/wrap) đo lại
    const raf = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [openSubmenu, navItems, othersItems]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1">
      {items.map((nav, index) => {
        const submenuOpen =
          openSubmenu?.type === menuType && openSubmenu?.index === index;
        const linkActive = nav.path ? isActive(nav.path) : false;

        return (
          <li key={nav.name}>
            {nav.subItems ? (
              <button
                type="button"
                onClick={() => handleSubmenuToggle(index, menuType)}
                className={`menu-item group cursor-pointer ${
                  submenuOpen
                    ? "bg-brand-50 text-brand-500 font-semibold dark:bg-brand-500/[0.12] dark:text-brand-400"
                    : "text-gray-800 hover:bg-gray-100 font-normal group-hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
                } ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
              >
                <SidebarNavIcon
                  icon={nav.icon}
                  tone={nav.iconTone}
                  active={submenuOpen}
                />
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
                {(isExpanded || isHovered || isMobileOpen) && (
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                      submenuOpen ? "rotate-180 text-brand-500" : "text-gray-400"
                    }`}
                  />
                )}
              </button>
            ) : (
              nav.path && (
                <Link
                  href={nav.path}
                  prefetch={false}
                  className={`menu-item group ${
                    linkActive
                      ? "bg-brand-50 text-brand-500 font-semibold dark:bg-brand-500/[0.12] dark:text-brand-400"
                      : "text-gray-800 hover:bg-gray-100 font-normal group-hover:text-gray-900 dark:text-gray-200 dark:hover:bg-white/5"
                  } ${!isExpanded && !isHovered ? "lg:justify-center" : ""}`}
                >
                  <SidebarNavIcon
                    icon={nav.icon}
                    tone={nav.iconTone}
                    active={linkActive}
                  />
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text" title={nav.name}>
                      {nav.name}
                    </span>
                  )}
                </Link>
              )
            )}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[`${menuType}-${index}`] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height: submenuOpen
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
                }}
              >
                <ul className="mt-2 ml-12 space-y-1 border-l border-gray-100 pl-3 dark:border-gray-800">
                  {nav.subItems
                    .filter((subItem) =>
                      subItem.requireSupportBotAccess
                        ? canAccessSupportBotSetup(user)
                        : userHasNavRole(subItem.roles, user),
                    )
                    .map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        href={subItem.path}
                        prefetch={false}
                        className={`menu-dropdown-item ${
                          isActive(subItem.path)
                            ? "bg-brand-50 text-brand-500 font-semibold dark:bg-brand-500/[0.12] dark:text-brand-400"
                            : "text-gray-800 hover:bg-gray-100 font-normal dark:text-gray-200 dark:hover:bg-white/5"
                        }`}
                      >
                        <span
                          className={`mr-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                            isActive(subItem.path)
                              ? "bg-brand-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }`}
                        />
                        {subItem.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed left-0 z-50 flex flex-col border-r border-gray-200 bg-white px-4 text-gray-900 transition-all duration-300 ease-in-out sm:px-5 dark:border-gray-800 dark:bg-gray-900
        top-16 h-[calc(100dvh-4rem)] lg:top-0 lg:h-dvh
        ${
          isExpanded || isMobileOpen
            ? "w-[min(290px,100vw)]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex shrink-0 py-5 lg:py-8 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link href="/" prefetch={false}>
          {isExpanded || isHovered || isMobileOpen ? (
            <BrandLogo
              width={150}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <BrandLogo
              variant="icon"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
          )}
        </Link>
      </div>
      {/* flex-1 min-h-0 + overflow-y: cuộn hết menu kể cả Sinh nhật */}
      <div className="custom-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] duration-300 ease-linear">
        <nav className="mb-4">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-3 flex text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Danh mục"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>

            {othersItems.length > 0 && (
              <div>
                <h2
                  className={`mb-3 flex text-xs font-semibold tracking-wider text-gray-500 uppercase dark:text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Khác"
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                {renderMenuItems(othersItems, "others")}
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;