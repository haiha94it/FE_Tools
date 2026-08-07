import { create } from "zustand";
import {
  clearShopSessionKey,
  getShopSessionKey,
  setShopSessionKey,
} from "@/lib/shop-utils";
import { toast } from "@/lib/toast";
import { zaloShopService } from "@/services/zalo-shop.service";
import type { AddToCartPayload, ShopCart } from "@/types/zalo-shop";

interface ShopCartState {
  cart: ShopCart | null;
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  isLoading: boolean;
  sellerId: number | string | null;
  setSellerId: (id: number | string) => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  fetchCart: () => Promise<void>;
  addToCart: (payload: Omit<AddToCartPayload, "session_key">) => Promise<void>;
  /** quantity=0 → xóa dòng; variantId = product_variant.id */
  updateQuantity: (variantId: number, quantity: number) => Promise<void>;
  clearAfterOrder: () => void;
}

export const useShopCartStore = create<ShopCartState>()((set, get) => ({
  cart: null,
  isCartOpen: false,
  isCheckoutOpen: false,
  isLoading: false,
  sellerId: null,

  setSellerId: (id) => set({ sellerId: id }),

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  openCheckout: () => set({ isCheckoutOpen: true, isCartOpen: false }),
  closeCheckout: () => set({ isCheckoutOpen: false }),

  fetchCart: async () => {
    const { sellerId } = get();
    if (!sellerId) return;
    set({ isLoading: true });
    try {
      const cart = await zaloShopService.getCart(
        sellerId,
        getShopSessionKey(),
      );
      set({ cart, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addToCart: async (payload) => {
    set({ isLoading: true });
    try {
      const cart = await zaloShopService.addToCart({
        ...payload,
        session_key: getShopSessionKey(),
      });
      if (cart.session_key) setShopSessionKey(cart.session_key);
      // Ưu tiên cart trả về từ add; fetch lại nếu thiếu items
      if (cart.items && cart.items.length > 0) {
        set({ cart, isLoading: false, isCartOpen: true });
      } else {
        await get().fetchCart();
        set({ isLoading: false, isCartOpen: true });
      }
      toast.success("Đã thêm vào giỏ hàng");
    } catch {
      set({ isLoading: false });
    }
  },

  updateQuantity: async (variantId, quantity) => {
    const { sellerId } = get();
    if (!sellerId) return;
    set({ isLoading: true });
    try {
      await zaloShopService.updateCartQuantity({
        id_employee: sellerId,
        session_key: getShopSessionKey(),
        id_variant: variantId,
        quantity,
      });
      await get().fetchCart();
      set({ isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  clearAfterOrder: () => {
    clearShopSessionKey();
    set({ cart: null, isCheckoutOpen: false, isCartOpen: false });
  },
}));