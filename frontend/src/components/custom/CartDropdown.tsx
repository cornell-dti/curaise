"use client";

import { useRouter } from "next/navigation";
import { Plus, ShoppingCart, Trash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/lib/store/useCartStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import useStore from "@/lib/store/useStore";
import { CompleteItemSchema } from "common";

export function CartDropdown() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const cleanStaleCarts = useCartStore((state) => state.cleanStaleCarts);
  const carts = useStore(useCartStore, (state) => state.carts) ?? {};
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  // Flatten all carts into per-fundraiser summaries, skip empty ones
  const fundraiserCarts = Object.entries(carts).filter(
    ([, items]) => items.length > 0,
  );

  const totalQuantity = fundraiserCarts.reduce(
    (sum, [, items]) =>
      sum + items.reduce((s, cartItem) => s + cartItem.quantity, 0),
    0,
  );

  const handleCheckout = (fundraiserId: string) => {
    // Mirror FundraiserCartSidebar logic — go to cart on mobile, checkout on desktop
    const nextPath = isMobile
      ? `/buyer/fundraiser/${fundraiserId}/cart`
      : `/buyer/fundraiser/${fundraiserId}/checkout`;

    router.push(`/login?next=${encodeURIComponent(nextPath)}`);
  };

  useEffect(() => {
    const unsub = useCartStore.persist.onFinishHydration(() => {
      const fundraiserIds = Object.keys(useCartStore.getState().carts);
      if (fundraiserIds.length === 0) return;

      const clean = async () => {
        const validIds = await Promise.all(
          fundraiserIds.map(async (id) => {
            try {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/public`,
              );
              if (!res.ok) return null;
              const data = await res.json();
              const allPast = data.pickupEvents?.every(
                (e: { endsAt: string }) => new Date(e.endsAt) < new Date(),
              );
              return allPast ? null : id;
            } catch {
              return null;
            }
          }),
        );
        cleanStaleCarts(validIds.filter(Boolean) as string[]);
      };

      void clean();
    });
    return () => unsub();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalQuantity > 0 && (
            <Badge
              variant="destructive"
              className="bg-[#f74545] absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none pointer-events-none"
            >
              {totalQuantity}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-base">Your Cart</h3>
        </div>

        {fundraiserCarts.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            Your cart is empty.
          </div>
        ) : (
          <div className="max-h-[420px] overflow-y-auto">
            {fundraiserCarts.map(([fundraiserId, items], index) => {
              const subtotal = items.reduce(
                (sum, ci) => sum + Number(ci.item.price) * ci.quantity,
                0,
              );

              return (
                <div key={fundraiserId}>
                  {index > 0 && <Separator />}
                  <div className="px-4 py-3 flex flex-col gap-2">
                    {/* Fundraiser name */}
                    <button
                      onClick={() =>
                        router.push(`/buyer/fundraiser/${fundraiserId}`)
                      }
                      className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-left hover:underline"
                    >
                      {items[0]?.fundraiserName ?? `Fundraiser`}
                    </button>

                    {/* Items */}
                    {items.map((cartItem) => (
                      <div
                        key={cartItem.item.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium truncate">
                            {cartItem.item.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ${Number(cartItem.item.price).toFixed(2)} ×{" "}
                            {cartItem.quantity}
                          </span>
                        </div>
                        <div className="flex items-center gap-[10px] p-2">
                          <button
                            onClick={() => {
                              if (cartItem.quantity === 1) {
                                removeItem(fundraiserId, cartItem.item);
                              } else {
                                updateQuantity(
                                  fundraiserId,
                                  cartItem.item,
                                  cartItem.quantity - 1,
                                );
                              }
                            }}
                            aria-label={
                              cartItem.quantity === 1
                                ? `Remove ${cartItem.item.name} from cart`
                                : `Decrease quantity of ${cartItem.item.name}`
                            }
                          >
                            <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                          </button>
                          <span className="text-sm font-medium">
                            $
                            {(
                              Number(cartItem.item.price) * cartItem.quantity
                            ).toFixed(2)}
                          </span>
                          <button
                            onClick={() =>
                              updateQuantity(
                                fundraiserId,
                                cartItem.item,
                                cartItem.quantity + 1,
                              )
                            }
                            aria-label={`Increase quantity of ${cartItem.item.name}`}
                          >
                            <Plus className="h-3.5 w-3.5 text-muted-foreground hover:text-green-600 transition-colors" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Subtotal + checkout */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm text-muted-foreground">
                        Subtotal:{" "}
                        <span className="font-semibold text-foreground">
                          ${subtotal.toFixed(2)}
                        </span>
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleCheckout(fundraiserId)}
                        className="bg-[#265B34] hover:bg-[#1f4a2b] text-white h-7 text-xs px-3"
                      >
                        {isMobile ? "View Cart" : "Checkout"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
