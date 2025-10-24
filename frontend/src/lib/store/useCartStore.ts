import { CompleteItemSchema } from "common";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const CartItem = z.object({
  item: CompleteItemSchema,
  quantity: z.number().int().nonnegative(),
});

export type CartItem = z.infer<typeof CartItem>;

interface CartState {
  // Map fundraiser IDs to cart items
  carts: Record<string, CartItem[]>;

  // Actions
  addItem: (
    fundraiserId: string,
    item: z.infer<typeof CompleteItemSchema>,
    quantity: number
  ) => void;
  removeItem: (
    fundraiserId: string,
    item: z.infer<typeof CompleteItemSchema>
  ) => void;
  updateQuantity: (
    fundraiserId: string,
    item: z.infer<typeof CompleteItemSchema>,
    quantity: number
  ) => void;
  clearCart: (fundraiserId: string) => void;
  clearAllCarts: () => void;
  getCartItems: (fundraiserId: string) => CartItem[];
  getTotalQuantity: (fundraiserId: string) => number;
  prepareOrderItems: (
    fundraiserId: string
  ) => { itemId: string; quantity: number }[];
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      carts: {},

      addItem: (fundraiserId, item, quantity) => {
        set((state) => {
          // Get the current cart for this fundraiser
          const currentCart = state.carts[fundraiserId] || [];

          // Check if item already exists
          const existingItemIndex = currentCart.findIndex(
            (cartItem) => cartItem.item.id === item.id
          );

          if (existingItemIndex >= 0) {
            // Update quantity if item exists
            const updatedCart = [...currentCart];
            updatedCart[existingItemIndex] = {
              ...updatedCart[existingItemIndex],
              quantity: updatedCart[existingItemIndex].quantity + quantity,
            };

            return {
              carts: {
                ...state.carts,
                [fundraiserId]: updatedCart,
              },
            };
          } else {
            // Add new item
            return {
              carts: {
                ...state.carts,
                [fundraiserId]: [...currentCart, { item, quantity }],
              },
            };
          }
        });
      },

      removeItem: (fundraiserId, item) => {
        set((state) => {
          const currentCart = state.carts[fundraiserId] || [];

          // Filter out the item
          const updatedCart = currentCart.filter(
            (cartItem) => cartItem.item.id !== item.id
          );

          return {
            carts: {
              ...state.carts,
              [fundraiserId]: updatedCart,
            },
          };
        });
      },

      updateQuantity: (fundraiserId, item, quantity) => {
        set((state) => {
          const currentCart = state.carts[fundraiserId] || [];

          // Find and update the item
          const updatedCart = currentCart.map((cartItem) => {
            if (cartItem.item.id === item.id) {
              return { ...cartItem, quantity };
            }
            return cartItem;
          });

          // If quantity is 0, remove the item
          const filteredCart =
            quantity === 0
              ? updatedCart.filter((cartItem) => cartItem.item.id !== item.id)
              : updatedCart;

          return {
            carts: {
              ...state.carts,
              [fundraiserId]: filteredCart,
            },
          };
        });
      },

      clearCart: (fundraiserId) => {
        set((state) => ({
          carts: {
            ...state.carts,
            [fundraiserId]: [],
          },
        }));
      },

      clearAllCarts: () => {
        set({ carts: {} });
      },

      getCartItems: (fundraiserId) => {
        return get().carts[fundraiserId] || [];
      },

      getTotalQuantity: (fundraiserId) => {
        const currentCart = get().carts[fundraiserId] || [];
        return currentCart.reduce((total, cartItem) => total + cartItem.quantity, 0);
      },

      // prepare for CreateOrderBody
      prepareOrderItems: (fundraiserId) => {
        const currentCart = get().carts[fundraiserId] || [];

        return currentCart.map(({ item, quantity }) => ({
          itemId: item.id,
          quantity,
        }));
      },
    }),
    {
      name: "fundraiser-cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
