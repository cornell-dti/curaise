"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CompleteItemSchema } from "common";
import type { z } from "zod";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";
import { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";

export function FundraiserItemModal({
  item,
  amount,
  increment,
  decrement,
  available,
  isOutOfStock = false,
  isPast,
}: {
  item: z.infer<typeof CompleteItemSchema>;
  amount: number;
  increment: () => void;
  decrement: () => void;
  available: number | null;
  isOutOfStock?: boolean;
  isPast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(amount || 1);

  // Sync quantity with cart amount when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(amount || 1);
    }
  }, [isOpen, amount]);

  const handleAddToCart = () => {
    // Calculate how many to add (difference between desired and current)
    const delta = quantity - amount;
    if (delta > 0) {
      for (let i = 0; i < delta; i++) {
        increment();
      }
    } else if (delta < 0) {
      for (let i = 0; i < Math.abs(delta); i++) {
        decrement();
      }
    }
    setIsOpen(false);
  };

  const handleIncrement = () => {
    // Check if incrementing would exceed available stock
    if (available !== null && quantity + 1 > available) {
      return;
    }
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(0, prev - 1));
  };

  const isDisabled = isPast || isOutOfStock;
  const isAtStockLimit = available !== null && quantity >= available;

  return (
    <Dialog open={isDisabled ? false : isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FundraiserItemCard
            item={item}
            amount={amount}
            increment={increment}
            decrement={decrement}
            isOutOfStock={isOutOfStock}
            isPast={isPast}
          />
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[650px] p-0 gap-0 [&>button>svg]:h-6 [&>button>svg]:w-6">
        <DialogTitle className="sr-only">{item.name}</DialogTitle>
        {/* Image */}
        {item.imageUrl && (
          <div className="relative w-full overflow-hidden rounded-t-lg p-5 pt-12 pb-0">
            <div className="relative w-full h-[303px]">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover rounded-md"
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col px-5 pt-[22px] gap-[22px] pb-6">
          {/* Title and Price */}
          <div className="flex flex-col gap-[10px]">
            <h2 className="text-[22px] font-semibold leading-[33px] text-black">
              {item.name}
            </h2>
            <p className="text-xl font-normal leading-[24px] text-black">
              ${Number(item.price).toFixed(2)}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-[#f6f6f6]" />

          {/* Description */}
          <div className="flex flex-col gap-2">
            <p className="text-lg font-normal leading-[27px] text-black">
              {item.description}
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex flex-col gap-3">
            <p className="text-base font-semibold leading-[24px] text-black">
              Quantity
            </p>
            <div className="border border-[#dddddd] rounded-md w-fit">
              <div className="flex items-center gap-[10px] p-2">
                <button
                  onClick={handleDecrement}
                  className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                  disabled={quantity <= 0}
                >
                  <Minus className="h-[18px] w-[18px] text-black" />
                </button>
                <p className="text-base font-semibold text-[#545454] min-w-[7px] text-center">
                  {quantity}
                </p>
                <button
                  onClick={handleIncrement}
                  className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isDisabled || isAtStockLimit}
                >
                  <Plus className="h-[18px] w-[18px] text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock && quantity === 0}
            className="bg-black text-white rounded-lg h-[50px] flex items-center justify-center gap-2 px-12 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg font-normal leading-[27px]">
              {isOutOfStock
                ? "Out of Stock"
                : quantity === 0
                  ? "Remove from Cart"
                  : amount === 0
                    ? "Add to Cart"
                    : "Update Cart"}
            </span>
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
