"use client";
import { CompleteItemSchema } from "common";
import { z } from "zod";
import { FundraiserItemModal } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemModal";
import { useCartStore } from "@/lib/store/useCartStore";

export function FundraiserItemsPanel({
  fundraiserId,
  items,
}: {
  fundraiserId: string;
  items: z.infer<typeof CompleteItemSchema>[];
}) {
  const { addItem, removeItem, updateQuantity, getCartItems } = useCartStore();

  const handleIncrement = (item: z.infer<typeof CompleteItemSchema>) => {
    const cartItem = getCartItems(fundraiserId).find(
      (cartItem) => cartItem.item.id === item.id
    );
    if (cartItem) {
      updateQuantity(fundraiserId, item, cartItem.quantity + 1);
    } else {
      addItem(fundraiserId, item, 1);
    }
  };

  const handleDecrement = (item: z.infer<typeof CompleteItemSchema>) => {
    const cartItem = getCartItems(fundraiserId).find(
      (cartItem) => cartItem.item.id === item.id
    );
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(fundraiserId, item, cartItem.quantity - 1);
      } else {
        removeItem(fundraiserId, item);
      }
    }
  };

  return (
    <div className="bg-white rounded-md">
      <h2 className="text-2xl font-bold mb-4">Items</h2>

      {items.length === 0 ? (
        <p className="text-gray-500 col-span-2 text-center py-8">
          No items available for this fundraiser.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {items.map((item) => (
            <FundraiserItemModal
              key={item.id}
              item={item}
              amount={
                getCartItems(fundraiserId).find(
                  (cartItem) => cartItem.item.id === item.id
                )?.quantity || 0
              }
              increment={() => handleIncrement(item)}
              decrement={() => handleDecrement(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
