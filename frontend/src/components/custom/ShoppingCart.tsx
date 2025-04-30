"use client";

import Link from "next/link";
import Decimal from "decimal.js";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { useCartStore } from "@/lib/store/useCartStore";
import { useStore } from "zustand";

export const ShoppingCart = ({ fundraiserId }: { fundraiserId?: string }) => {
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiserId ?? ""]) || [];

  const orderTotal = cart
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0)
    )
    .toFixed(2);

  return cart.length > 0 ? (
    <div>
      <div className="space-y-4">
        {cart.map((cartItem) => (
          <div
            key={cartItem.item.id}
            className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0 last:pb-0"
          >
            <div className="flex-1 space-y-1 text-center sm:text-left">
              <h3 className="font-medium">{cartItem.item.name}</h3>
              <p className="text-sm text-muted-foreground">
                {cartItem.item.description}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm">Qty: {cartItem.quantity}</span>
                <span className="text-sm text-muted-foreground">×</span>
                <span className="text-sm">
                  ${Decimal(cartItem.item.price).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end sm:w-24 mt-2 sm:mt-0">
              <span className="font-medium">
                $
                {Decimal(cartItem.item.price)
                  .times(cartItem.quantity)
                  .toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <Separator className="my-4" />
      <div className="flex justify-between">
        <span className="font-medium">Total</span>
        <span className="font-bold">${orderTotal}</span>
      </div>
      <Link href={`/buyer/fundraiser/${fundraiserId}/checkout`}>
        <Button className="mt-4 w-full">Proceed to Checkout</Button>
      </Link>
    </div>
  ) : (
    <p className="text-sm text-muted-foreground">Your cart is empty.</p>
  );
};
