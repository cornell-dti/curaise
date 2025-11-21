"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";

export function FundraiserCartSidebar({
  fundraiserId,
}: {
  fundraiserId: string;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart = useStore(useCartStore, (state) => state.carts[fundraiserId]);

  const cartItems = cart || [];
  const isEmpty = cartItems.length === 0;

  const totalItems = cartItems.reduce((sum, cartItem) => {
    return sum + cartItem.quantity;
  }, 0);

  const totalPrice = cartItems.reduce((sum, cartItem) => {
    return sum + Number(cartItem.item.price) * cartItem.quantity;
  }, 0);

  const handleCheckout = () => {
    if (!isEmpty) {
      // On mobile, go to cart page first; on desktop, go directly to checkout
      if (isMobile) {
        router.push(`/buyer/fundraiser/${fundraiserId}/cart`);
      } else {
        router.push(`/buyer/fundraiser/${fundraiserId}/checkout`);
      }
    }
  };

  return (
    <Card className="w-full h-fit border-[#f6f6f6]">
      <CardContent className="pt-6 px-5 pb-8">
        <div className="flex flex-col gap-[42px]">
          <h2 className="text-xl font-semibold">Items</h2>

          {isEmpty ? (
            <div className="flex flex-col gap-5">
              <p className="text-[#767676] text-lg">Your cart is empty.</p>
              <Button
                onClick={handleCheckout}
                disabled
                className="w-full bg-[#bababa] text-[#fefdfd] hover:bg-[#bababa] h-[50px] rounded-lg"
              >
                {isMobile ? `View Cart (${totalItems})` : "Proceed to Checkout"}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4">
                {cartItems.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex justify-between items-center"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{cartItem.item.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ${Number(cartItem.item.price).toFixed(2)} ×{" "}
                        {cartItem.quantity}
                      </span>
                    </div>
                    <span className="font-medium">
                      ${(Number(cartItem.item.price) * cartItem.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-semibold text-lg">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                <Button
                  onClick={handleCheckout}
                  className="w-full h-[50px] rounded-lg"
                >
                  {isMobile ? `View Cart (${totalItems})` : "Proceed to Checkout"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

