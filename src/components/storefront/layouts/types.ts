import type {
  ShopCategory,
  ShopCover,
  ShopPersonalizationData,
  ShopProduct,
  ShopSortOption,
} from "@/types/zalo-shop";

export interface StorefrontLayoutProps {
  sellerId: string;
  cover: ShopCover | null;
  categories: ShopCategory[];
  products: ShopProduct[];
  filteredProducts: ShopProduct[];
  config: Required<ShopPersonalizationData>;
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  sort: ShopSortOption;
  onSortChange: (v: ShopSortOption) => void;
  onQuickView: (product: ShopProduct) => void;
}
