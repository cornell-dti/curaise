"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import type { CompleteItemSchema } from "common";
import type { z } from "zod";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";

export function ItemDetailMobileView({
  fundraiserId,
  item,
}: {
  fundraiserId: string;
  item: z.infer<typeof CompleteItemSchema>;
}) {
  const router = useRouter();
  const { addItem, updateQuantity, removeItem } = useCartStore();
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart = useStore(useCartStore, (state) => state.carts[fundraiserId]);
  const cartItem = cart?.find((cartItem) => cartItem.item.id === item.id);
  const quantity = cartItem?.quantity || 0;
  const hasItems = cart && cart.length > 0;

  const handleIncrement = () => {
    if (cartItem) {
      updateQuantity(fundraiserId, item, cartItem.quantity + 1);
    } else {
      addItem(fundraiserId, item, 1);
    }
  };

  const handleDecrement = () => {
    if (cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(fundraiserId, item, cartItem.quantity - 1);
      } else {
        removeItem(fundraiserId, item);
      }
    }
  };

  const handleAddToCart = () => {
    // Navigate back to fundraiser page
    // Cart is already updated via increment/decrement buttons
    router.push(`/buyer/fundraiser/${fundraiserId}`);
  };

  return (
    <div className="bg-white relative min-h-screen pb-20">
      {/* Image Section */}
      <div className="relative h-[353px] w-full overflow-hidden rounded-[6px]">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute left-[20px] top-[17px] z-10 flex items-center justify-center"
        >
          <svg
            width="10"
            height="17"
            viewBox="0 0 10 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1L1 8.5L9 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Content Section */}
      <div className="px-[20px] pt-[22px] flex flex-col gap-[22px]">
        {/* Name and Price */}
        <div className="flex flex-col gap-[10px]">
          <h1 className="text-[22px] font-semibold leading-[33px] text-black">
            {item.name}
          </h1>
          <p className="text-[16px] font-normal leading-[24px] text-black">
            ${Number(item.price).toFixed(0)}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#dddddd] w-full" />

        {/* Description */}
        <div className="flex flex-col gap-[7px]">
          <p className="text-[16px] font-normal leading-[24px] text-black whitespace-pre-wrap">
            {item.description}
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex flex-col gap-[12px]">
          <p className="text-[14px] font-semibold leading-[21px] text-black">
            Quantity
          </p>
          <div className="border border-[#dddddd] rounded-[6px] w-fit">
            <div className="flex gap-[10px] items-center p-[8px]">
              <button
                onClick={handleDecrement}
                disabled={quantity === 0}
                className="p-[2px] rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Minus className="w-[18px] h-[18px] text-gray-500" />
              </button>
              <p className="text-[16px] font-normal leading-[24px] text-black min-w-[20px] text-center">
                {quantity}
              </p>
              <button
                onClick={handleIncrement}
                className="p-[2px] rounded-[8px]"
              >
                <Plus className="w-[18px] h-[18px] text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        {quantity > 0 && (
          <button
            onClick={handleAddToCart}
            className="bg-black rounded-[8px] h-[50px] flex items-center justify-center gap-[19px] px-12 py-3"
          >
            <span className="text-[18px] leading-[27px] text-[#fefdfd]">
              Add to Cart
            </span>
            <ShoppingCart className="w-5 h-5 text-[#fefdfd]" />
          </button>
        )}

      </div>
    </div>
  );
}

