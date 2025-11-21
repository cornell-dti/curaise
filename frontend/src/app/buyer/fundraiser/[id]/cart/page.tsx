"use client";

import { CompleteFundraiserSchema } from "common";
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";
import { useIsMobile } from "@/hooks/use-mobile";

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

export default function CartPage() {
  const router = useRouter();
  const params = useParams();
  const fundraiserId = params.id as string;
  const isMobile = useIsMobile();
  const [mounted, setMounted] = useState(false);

  const [fundraiser, setFundraiser] = useState<
    typeof CompleteFundraiserSchema._type | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (fundraiserId) {
      getFundraiser(fundraiserId)
        .then((fundraiserData) => {
          setFundraiser(fundraiserData);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
        });
    }
  }, [fundraiserId]);

  // Redirect to desktop if not mobile (only after mount to avoid hydration issues)
  useEffect(() => {
    if (mounted && isMobile === false) {
      router.push(`/buyer/fundraiser/${fundraiserId}`);
    }
  }, [mounted, isMobile, fundraiserId, router]);

  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiserId] || []) || [];
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const totalPrice = cart.reduce((sum, cartItem) => {
    return sum + Number(cartItem.item.price) * cartItem.quantity;
  }, 0);

  const handleIncrement = (item: typeof cart[0]["item"]) => {
    const cartItem = cart.find((ci) => ci.item.id === item.id);
    if (cartItem) {
      updateQuantity(fundraiserId, item, cartItem.quantity + 1);
    }
  };

  const handleDecrement = (item: typeof cart[0]["item"]) => {
    const cartItem = cart.find((ci) => ci.item.id === item.id);
    if (cartItem && cartItem.quantity > 1) {
      updateQuantity(fundraiserId, item, cartItem.quantity - 1);
    }
  };

  const handleRemove = (item: typeof cart[0]["item"]) => {
    removeItem(fundraiserId, item);
  };

  const handleCheckout = () => {
    router.push(`/buyer/fundraiser/${fundraiserId}/checkout`);
  };

  if (loading || !fundraiser || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Don't render on desktop (will redirect)
  if (isMobile === false) {
    return null;
  }

  return (
    <div className="bg-white relative size-full min-h-screen pb-[90px]">
      {/* Content */}
      <div className="flex flex-col gap-[20px] items-start px-5 w-full mx-auto">
        {/* Back button */}
        <Link
          href={`/buyer/fundraiser/${fundraiserId}`}
          className="rounded-full transition-colors flex-shrink-0"
          style={{ 
            backgroundColor: "rgba(178, 178, 178, 0.21)",
            width: "30px",
            height: "30px",
            padding: "8.108px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <ChevronLeft strokeWidth={3} className="h-6 w-6 text-black" />
        </Link>

        {/* Fundraiser Info */}
        <div className="flex flex-col gap-[22px] items-start w-full">
          <div className="flex flex-col gap-[4px] items-start w-full">
            <h1 className="text-2xl font-semibold leading-[28px] text-black">
              {fundraiser.name}
            </h1>
            <p className="text-[14px] font-normal leading-[21px] text-black">
              Hosted by: {fundraiser.organization.name}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#f6f6f6]" />

          {/* Items Section */}
          <div className="flex flex-col gap-[12px] items-start w-full">
            <div className="flex flex-col gap-[10px] items-start w-full">
              <p className="text-[16px] font-normal leading-[24px] text-black">
                Items
              </p>
            </div>

            <div className="flex flex-col gap-[20px] items-start w-full">
              {cart.length === 0 ? (
                <p className="text-[#767676] text-lg">Your cart is empty.</p>
              ) : (
                cart.map((cartItem) => (
                  <div
                    key={cartItem.item.id}
                    className="flex gap-[12px] items-center w-full"
                  >
                    {/* Item Image */}
                    <div className="h-[95px] w-[118px] rounded-[5.06px] overflow-hidden relative flex-shrink-0">
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
                        <p className="text-[14px] font-normal leading-[21px] text-black">
                          ${Number(cartItem.item.price).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity Selector */}
                      <div className="border border-[#dddddd] rounded-[4.414px] h-[26px] w-[64px]">
                        <div className="flex items-center gap-[8px] h-full px-[5.885px] py-[5.885px]">
                          <button
                            onClick={() => {
                              if (cartItem.quantity === 1) {
                                handleRemove(cartItem.item);
                              } else {
                                handleDecrement(cartItem.item);
                              }
                            }}
                            className="p-[0.777px] rounded-[3.108px] hover:bg-gray-100 transition-colors flex-shrink-0 w-[14px] h-[14px] flex items-center justify-center"
                          >
                            {cartItem.quantity === 1 ? (
                              <Trash2 className="h-[12.676px] w-[12.676px] text-[#545454]" />
                            ) : (
                              <Minus className="h-[12.676px] w-[12.676px] text-[#545454]" />
                            )}
                          </button>
                          <p className="text-[11.77px] font-normal leading-[17.655px] text-[#545454] min-w-[5.149px] text-center">
                            {cartItem.quantity}
                          </p>
                          <button
                            onClick={() => handleIncrement(cartItem.item)}
                            className="p-[1.471px] rounded-[5.885px] hover:bg-gray-100 transition-colors flex-shrink-0 w-[16.184px] h-[16.184px] flex items-center justify-center"
                          >
                            <Plus className="h-[13.241px] w-[13.241px] text-[#545454]" />
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

      {/* Go to Checkout Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center p-5 bg-white border-t border-[#f6f6f6] z-50">
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0}
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

