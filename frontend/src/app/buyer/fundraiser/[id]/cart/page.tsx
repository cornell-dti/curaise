"use client";

import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";
import { useIsMobile } from "@/hooks/use-mobile";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const getFundraiser = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data");
  }
  return data.data;
};

const getFundraiserItems = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteItemSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser items data");
  }
  return data.data;
};

export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const fundraiserId = params.id as string;
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [fundraiser, setFundraiser] = useState<
    typeof CompleteFundraiserSchema._type | null
  >(null);
  const [items, setItems] = useState<
    typeof CompleteItemSchema._type[] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fundraiserId) {
      Promise.all([
        getFundraiser(fundraiserId),
        getFundraiserItems(fundraiserId),
      ])
        .then(([fundraiserData, itemsData]) => {
          setFundraiser(fundraiserData);
          setItems(itemsData);
          setLoading(false);
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : "Failed to load fundraiser data");
          setLoading(false);
        });
    }
  }, [fundraiserId]);

  // Redirect to fundraiser page if not mobile (only after mount to avoid hydration issues)
  // I had issues with hydration issues, and Claude suggested this approach.
  useEffect(() => {
    if (mounted && isMobile === false) {
      router.push(`/buyer/fundraiser/${fundraiserId}`);
    }
  }, [mounted, isMobile, fundraiserId, router]);

  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiserId] || []) || [];
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

  const totalPrice = cartWithImages.reduce((sum, cartItem) => {
    return sum + Number(cartItem.item.price) * cartItem.quantity;
  }, 0);

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
    const nextCheckoutPath = `/buyer/fundraiser/${fundraiserId}/checkout`;
    
    // Check if user is already authenticated
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // User is authenticated, go directly to checkout
      router.push(nextCheckoutPath);
    } else {
      // User is not authenticated, redirect to login with next parameter
      router.push(`/login?next=${encodeURIComponent(nextCheckoutPath)}`);
    }
  };

  if (loading || !fundraiser || !items || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
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
                        <img
                          src={cartItem.item.imageUrl}
                          alt={cartItem.item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    {/* Item Details */}
                    <div className="flex flex-col gap-[12px] items-start flex-1 min-w-0">
                      <div className="flex flex-col gap-[4px] items-start w-full">
                        <p className="text-[14px] font-semibold leading-[21px] text-black">
                          {cartItem.item.name}
                        </p>
                        <p className="text-[14px] font-[400] leading-[21px] text-black">
                          ${Number(cartItem.item.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="border border-[#dddddd] rounded h-[30px] w-fit">
                        <div className="flex items-center gap-2 h-full px-1.5 py-1.5">
                          <button
                            onClick={() => {
                              if (cartItem.quantity === 1) {
                                handleRemove(cartItem.item);
                              } else {
                                handleDecrement(cartItem.item);
                              }
                            }}
                            className="p-0.5 rounded-sm hover:bg-gray-100 transition-colors flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center"
                          >
                             <Trash className="h-3 w-3 text-[#545454]" />
                          </button>
                          <p className="text-xs font-normal leading-[18px] text-[#545454] min-w-[5px] text-center">
                            {cartItem.quantity}
                          </p>
                          <button
                            onClick={() => handleIncrement(cartItem.item)}
                            className="p-0.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0 w-4 h-4 flex items-center justify-center"
                          >
                            <Plus className="h-3.5 w-3.5 text-[#545454]" />
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
                ${totalPrice.toFixed(2)}
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

