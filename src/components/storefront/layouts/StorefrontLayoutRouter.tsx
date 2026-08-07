"use client";

import BentoGridTechLayout from "@/components/storefront/layouts/BentoGridTechLayout";
import CatalogFirstMasonryLayout from "@/components/storefront/layouts/CatalogFirstMasonryLayout";
import DealWallFlashLayout from "@/components/storefront/layouts/DealWallFlashLayout";
import MagazineEditorialLayout from "@/components/storefront/layouts/MagazineEditorialLayout";
import MinimalistEssentialLayout from "@/components/storefront/layouts/MinimalistEssentialLayout";
import MobileNativeLayout from "@/components/storefront/layouts/MobileNativeLayout";
import SidebarCommerceLayout from "@/components/storefront/layouts/SidebarCommerceLayout";
import SplitStorytellerLayout from "@/components/storefront/layouts/SplitStorytellerLayout";
import type { StorefrontLayoutProps } from "@/components/storefront/layouts/types";
import { resolveArchetypeId } from "@/lib/shop-personalization";

import CustomCanvasLayout from "@/components/storefront/layouts/CustomCanvasLayout";

/**
 * Renders a COMPLETELY different DOM tree per architectural archetype.
 * Not a color/CSS swap — hierarchy, grid, and UX chrome change.
 */
export default function StorefrontLayoutRouter(props: StorefrontLayoutProps) {
  const archetype = resolveArchetypeId(props.config.templateId);

  if (props.config.pageLayout === "custom-builder" || (archetype as string) === "custom-drag-drop") {
    return <CustomCanvasLayout {...props} />;
  }

  switch (archetype) {
    case "deal-wall-flash":
      return <DealWallFlashLayout {...props} />;
    case "catalog-first-masonry":
      return <CatalogFirstMasonryLayout {...props} />;
    case "split-storyteller":
      return <SplitStorytellerLayout {...props} />;
    case "sidebar-commerce":
      return <SidebarCommerceLayout {...props} />;
    case "mobile-native":
      return <MobileNativeLayout {...props} />;
    case "magazine-editorial":
      return <MagazineEditorialLayout {...props} />;
    case "minimalist-essential":
      return <MinimalistEssentialLayout {...props} />;
    case "bento-grid-tech":
    default:
      return <BentoGridTechLayout {...props} />;
  }
}
