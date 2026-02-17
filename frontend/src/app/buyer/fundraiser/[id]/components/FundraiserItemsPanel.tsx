"use client";

import { CompleteItemSchema } from "common";
import { z } from "zod";
import { FundraiserItemModal } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemModal";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";
import Link from "next/link";

export function FundraiserItemsPanel({
  fundraiserId,
  items,
}: {
  fundraiserId: string;
  items: z.infer<typeof CompleteItemSchema>[];
}) {
  const { addItem, removeItem, updateQuantity } = useCartStore();
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart = useStore(useCartStore, (state) => state.carts[fundraiserId]);

  const handleIncrement = (item: z.infer<typeof CompleteItemSchema>) => {
    const cartItem = cart?.find((cartItem) => cartItem.item.id === item.id);
    if (cartItem) {
      updateQuantity(fundraiserId, item, cartItem.quantity + 1);
    } else {
      addItem(fundraiserId, item, 1);
    }
  };

  const handleDecrement = (item: z.infer<typeof CompleteItemSchema>) => {
    const cartItem = cart?.find((cartItem) => cartItem.item.id === item.id);
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
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          No items available for this fundraiser.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {items.map((item) => {
            const amount =
              cart?.find((cartItem) => cartItem.item.id === item.id)?.quantity ||
              0;

            return (
              <div key={item.id}>
                {/* Desktop: Modal */}
                <div className="hidden md:block">
                  <FundraiserItemModal
                    item={item}
                    amount={amount}
                    increment={() => handleIncrement(item)}
                    decrement={() => handleDecrement(item)}
                    fundraiserId={fundraiserId}
                  />
                </div>

                {/* Mobile: Link to item page */}
                <Link
                  href={`/buyer/fundraiser/${fundraiserId}/item/${item.id}`}
                  className="md:hidden block"
                >
                  <FundraiserItemCard
                    item={item}
                    amount={amount}
                    increment={() => handleIncrement(item)}
                    decrement={() => handleDecrement(item)}
                  />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
