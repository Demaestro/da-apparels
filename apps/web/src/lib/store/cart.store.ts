import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "../api/orders";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void;
  removeItem: (productId: string, variantId: string | undefined) => void;
  clear: () => void;
  total: () => number;
  itemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === newItem.productId && i.variantId === newItem.variantId,
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === newItem.productId && i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      updateQuantity: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i,
          ),
        }));
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantId === variantId),
          ),
        }));
      },

      clear: () => set({ items: [] }),

      total: () =>
        get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "da-cart",
      // Only persist items — re-derive computed values
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
