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
import { useState } from "react";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import Image from "next/image";

export function FundraiserItemModal({
  item,
  amount,
  increment,
  decrement,
  isPast,
}: {
  item: z.infer<typeof CompleteItemSchema>;
  amount: number;
  increment: () => void;
  decrement: () => void;
  isPast: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      increment();
    }
    setIsOpen(false);
    setQuantity(1);
  };

  const handleIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  return (
    <Dialog open={isPast ? false : isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="cursor-pointer">
          <FundraiserItemCard
            item={item}
            amount={amount}
            increment={increment}
            decrement={decrement}
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
                  className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-[18px] w-[18px] text-black" />
                </button>
                <p className="text-base font-semibold text-[#545454] min-w-[7px] text-center">
                  {quantity}
                </p>
                <button
                  onClick={handleIncrement}
                  className="p-0.5 rounded-lg hover:bg-gray-100 transition-colors"
                  disabled={isPast}
                >
                  <Plus className="h-[18px] w-[18px] text-black" />
                </button>
              </div>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="bg-black text-white rounded-lg h-[50px] flex items-center justify-center gap-2 px-12 py-3"
          >
            <span className="text-lg font-normal leading-[27px]">
              Add to Cart
            </span>
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
