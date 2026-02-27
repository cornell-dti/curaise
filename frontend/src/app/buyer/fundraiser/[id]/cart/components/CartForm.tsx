"use client";

import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/lib/store/useCartStore";
import { useShallow } from "zustand/react/shallow";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useFundraiserItems } from "@/hooks/useFundraiserItems";
import useSWR from "swr";
import { noAuthFetcher } from "@/lib/fetcher";
import Decimal from "decimal.js";
import Image from "next/image";

export function CartForm({ code }: { code: string }) {
  const router = useRouter();
  const params = useParams();
  const fundraiserId = params.id as string;
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const { data: fundraiser, isLoading: fundraiserLoading } = useSWR(
    fundraiserId ? `/fundraiser/${fundraiserId}` : null,
    noAuthFetcher(CompleteFundraiserSchema),
  );
  const { items, isLoading: itemsLoading } = useFundraiserItems(fundraiserId);

  const loading = fundraiserLoading || itemsLoading;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to fundraiser page if not mobile (only after mount to avoid hydration issues)
  // I had issues with hydration issues, and Claude suggested this approach.
  useEffect(() => {
    if (mounted && isMobile === false) {
      router.push(`/buyer/fundraiser/${fundraiserId}`);
    }
  }, [mounted, isMobile, fundraiserId, router]);

  const cart = useCartStore(
    useShallow((state) => state.carts[fundraiserId] || []),
  );
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  // Merge cart items with fetched items to get latest imageUrl
  const cartWithImages = cart.map((cartItem) => {
    const fetchedItem = items?.find((item) => item.id === cartItem.item.id);
    return {
      ...cartItem,
      item: fetchedItem || cartItem.item,
    };
  });

  const totalPrice = cartWithImages
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0),
    )
    .toFixed(2);

  const handleIncrement = (item: typeof CompleteItemSchema._type) => {
    const cartItem = cartWithImages.find((ci) => ci.item.id === item.id);
    if (cartItem) {
      updateQuantity(fundraiserId, item, cartItem.quantity + 1);
    }
  };

  const handleDecrement = (item: typeof CompleteItemSchema._type) => {
    const cartItem = cartWithImages.find((ci) => ci.item.id === item.id);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(fundraiserId, item, cartItem.quantity - 1);
    }
  };

  const handleRemove = (item: typeof CompleteItemSchema._type) => {
    removeItem(fundraiserId, item);
  };

  const handleCheckout = async () => {
    const nextCheckoutPath = code
      ? `/buyer/fundraiser/${fundraiserId}/checkout?code=${code}`
      : `/buyer/fundraiser/${fundraiserId}/checkout`;

    // Check if user is already authenticated
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // User is authenticated, go directly to checkout
      router.push(nextCheckoutPath);
    } else {
      // User is not authenticated, redirect to login with next parameter
      router.push(`/login?next=${nextCheckoutPath}`);
    }
  };

  if (loading || !fundraiser || !items || !mounted) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-live="polite"
      >
        <p className="sr-only">Loading cart items</p>
        <p aria-hidden="true">Loading...</p>
      </div>
    );
  }

  // Don't render on desktop (redirect back to fundraiser page)
  if (isMobile === false) {
    return null;
  }

  return (
    <div className="bg-white relative w-full -mt-8">
      {/* Content */}
      <div className="flex flex-col gap-[20px] items-start px-5 w-full mx-auto">
        {/* Back button */}
        <Link
          href={`/buyer/fundraiser/${fundraiserId}`}
          className="rounded-full transition-colors flex-shrink-0 flex items-center justify-center p-1"
          style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
          aria-label="Go back to fundraiser page"
        >
          <ChevronLeft strokeWidth={2} className="h-8 w-8 text-stone-800" />
        </Link>

        {/* Fundraiser Info */}
        <div className="flex flex-col gap-[10px] items-start w-full">
          <div className="flex flex-col gap-[4px] items-start w-full">
            <h1 className="text-2xl font-semibold leading-[28px] text-black">
              {fundraiser.name}
            </h1>
            <p className="text-[14px] font-[400] leading-[21px] text-black">
              Hosted by: {fundraiser.organization.name}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#f6f6f6]" />

          {/* Items Section */}
          <div className="flex flex-col gap-[15px] items-start w-full">
            <div className="flex flex-col gap-[10px] items-start w-full">
              <p className="text-[16px] font-[400] leading-[24px] text-black">
                Items
              </p>
            </div>

            <div className="flex flex-col gap-[20px] items-start w-full">
              {cartWithImages.length === 0 ? (
                <p className="text-[#767676] text-lg">Your cart is empty.</p>
              ) : (
                cartWithImages.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex gap-[12px] items-center w-full"
                  >
                    {/* Item Image */}
                    <div className="h-[100px] w-[150px] rounded-md overflow-hidden relative flex-shrink-0">
                      {cartItem.item.imageUrl ? (
                        <Image
                          src={cartItem.item.imageUrl}
                          alt={`${cartItem.item.name} - $${Decimal(cartItem.item.price).toFixed(2)} from ${fundraiser.name}`}
                          fill
                          className="object-cover"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div
                          className="w-full h-full bg-gray-200"
                          aria-label={`No image available for ${cartItem.item.name}`}
                        />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-col gap-[12px] items-start flex-1 min-w-0">
                      <div className="flex flex-col gap-[4px] items-start w-full">
                        <p className="text-[14px] font-semibold leading-[21px] text-black">
                          {cartItem.item.name}
                        </p>
                        <p className="text-[14px] font-[400] leading-[21px] text-black">
                          ${Decimal(cartItem.item.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="border border-[#dddddd] rounded-md w-fit">
                        <div className="flex items-center gap-[10px] p-2">
                          <button
                            onClick={() => {
                              if (cartItem.quantity === 1) {
                                handleRemove(cartItem.item);
                              } else {
                                handleDecrement(cartItem.item);
                              }
                            }}
                            className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label={
                              cartItem.quantity === 1
                                ? `Remove ${cartItem.item.name} from cart`
                                : `Decrease quantity of ${cartItem.item.name}`
                            }
                          >
                            <Trash className="h-[18px] w-[18px] text-black" />
                          </button>
                          <p
                            className="text-base font-semibold text-[#545454] min-w-[7px] text-center"
                            aria-label={`Quantity: ${cartItem.quantity}`}
                          >
                            {cartItem.quantity}
                          </p>
                          <button
                            onClick={() => handleIncrement(cartItem.item)}
                            className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label={`Increase quantity of ${cartItem.item.name}`}
                          >
                            <Plus className="h-[18px] w-[18px] text-black" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#f6f6f6]" />

          {/* Total Section */}
          <div className="flex flex-col gap-[10px] items-start w-full">
            <div className="flex items-center justify-between w-full">
              <p className="text-[18px] font-medium leading-[27px] text-black">
                Total
              </p>
              <p className="text-[18px] font-medium leading-[27px] text-black">
                ${totalPrice}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Go to Checkout Button */}
      <div className="fixed bottom-16 left-0 right-0 flex justify-center p-5 bg-white border-t border-[#f6f6f6] z-40">
        <button
          onClick={handleCheckout}
          disabled={cartWithImages.length === 0}
          className="bg-black text-white rounded-lg h-[50px] w-full max-w-[361px] flex items-center justify-center px-[48px] py-[12px] disabled:bg-[#bababa] disabled:text-[#fefdfd]"
        >
          <span className="text-[18px] font-normal leading-[27px]">
            Go to checkout
          </span>
        </button>
      </div>
    </div>
  );
}
