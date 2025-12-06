"use client";

import { CompleteItemSchema } from "common";
import { useState, useEffect } from "react";
import { ChevronLeft, Plus, Minus, ShoppingCart, Trash } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/useCartStore";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { useShallow } from "zustand/react/shallow";

const getItem = async (fundraiserId: string, itemId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/items`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const items = CompleteItemSchema.array().parse(result.data);
  const item = items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("Item not found");
  }
  return item;
};

export default function ItemPage() {
  const router = useRouter();
  const params = useParams();
  const fundraiserId = params.id as string;
  const itemId = params.itemId as string;

  const [item, setItem] = useState<typeof CompleteItemSchema._type | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const cart = useCartStore(
    useShallow((state) => state.carts[fundraiserId] || [])
  );
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const cartItem = cart?.find((ci) => ci.item.id === itemId);
  const cartQuantity = cartItem?.quantity || 0;

  // Local quantity state - defaults to 1 or current cart quantity
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (fundraiserId && itemId) {
      getItem(fundraiserId, itemId)
        .then((itemData) => {
          setItem(itemData);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
        });
    }
  }, [fundraiserId, itemId]);

  // Sync local quantity with cart quantity when cart changes
  useEffect(() => {
    setQuantity(cartQuantity > 0 ? cartQuantity : 1);
  }, [cartQuantity]);

  const handleUpdateCart = () => {
    if (item) {
      if (quantity === 0) {
        // Remove from cart if quantity is 0
        removeItem(fundraiserId, item);
      } else if (cartItem) {
        // Update existing cart item
        updateQuantity(fundraiserId, item, quantity);
      } else {
        // Add new item to cart
        addItem(fundraiserId, item, quantity);
      }
      router.back();
    }
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(0, prev - 1));
  };

  // Button text: "Add to Cart" only if item is not in cart at all, otherwise always "Update Cart"
  const buttonText = cartQuantity === 0 ? "Add to Cart" : "Update Cart";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Item not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[calc(100vh-4rem-5rem)] md:min-h-screen bg-white -mt-16 md:mt-0 overflow-y-auto md:overflow-visible">
      {/* Back button - Mobile only */}
      <Link
        href={`/buyer/fundraiser/${fundraiserId}`}
        className="md:hidden fixed top-5 left-5 z-50 rounded-full transition-colors flex-shrink-0 flex items-center justify-center p-1"
        style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
      >
        <ChevronLeft strokeWidth={2} className="h-8 w-8 text-stone-800" />
      </Link>

      {/* Image */}
      <div className="relative w-full h-[353px] overflow-hidden flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            style={{ objectFit: "cover" }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col px-5 pt-[22px] gap-[22px] pb-0 md:pb-20 flex-shrink-0">
        {/* Title and Price */}
        <div className="flex flex-col gap-[4px]">
          <h1 className="text-[22px] font-semibold leading-[33px] text-black">
            {item.name}
          </h1>
          <p className="text-base font-normal leading-[24px] text-black">
            ${Number(item.price).toFixed(2)}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-[#f6f6f6]" />

        {/* Description */}
        <div className="flex flex-col gap-2">
          <p className="text-base font-normal leading-[24px] text-black">
            {item.description}
          </p>
        </div>

        {/* Quantity Selector */}
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold leading-[21px] text-black">
            Quantity
          </p>
          <div className="border border-[#dddddd] rounded-md w-fit">
            <div className="flex items-center gap-[10px] p-2">
              <button
                onClick={handleDecrement}
                className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={quantity === 0}
              >
                {quantity === 1 ? (
                  <Trash className="h-[18px] w-[18px] text-black" />
                ) : (
                  <Minus className="h-[18px] w-[18px] text-black" />
                )}
              </button>
              <p className="text-base font-semibold text-[#545454] min-w-[7px] text-center">
                {quantity}
              </p>
              <button
                onClick={handleIncrement}
                className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-[18px] w-[18px] text-black" />
              </button>
            </div>
          </div>
        </div>

        {/* Add/Update Cart Button */}
        <button
          onClick={handleUpdateCart}
          className="bg-black text-white rounded-lg h-[50px] flex items-center justify-center gap-2 px-12 py-3"
        >
          <span className="text-lg font-normal leading-[27px]">
            {buttonText}
          </span>
          <ShoppingCart className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
