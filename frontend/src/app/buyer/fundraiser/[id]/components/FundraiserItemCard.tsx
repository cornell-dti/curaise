"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";

import type { CompleteItemSchema } from "common";
import type Decimal from "decimal.js";
import { Plus, Minus, Trash } from "lucide-react";
import type { z } from "zod";
import { cn } from "@/lib/utils";

interface FundraiserItemCardProp {
  item: z.infer<typeof CompleteItemSchema>;
}

export function FundraiserItemCard({ item }: FundraiserItemCardProp) {
  const [showQuantity, setShowQuantity] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node) &&
        showQuantity
      ) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showQuantity]);

  const formatPrice = (price: Decimal) => {
    if (price.toFixed) {
      return `$${price.toFixed(2)}`;
    }
    return `$${Number(price).toFixed(2)}`;
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (!showQuantity) {
      setShowQuantity(true);
    } else {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    } else {
      setShowQuantity(false);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowQuantity(false);
    }, 300);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setIsClosing(false);
    setShowQuantity(true);
    if (quantity === 0) {
      setQuantity(1);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setShowQuantity(false);
      setQuantity(0);
    }, 300);
  };

  return (
    <div className="border rounded-md flex flex-col overflow-hidden h-full hover:scale-105 transition-transform duration-150 cursor-pointer">
      <div className="relative w-full h-48 bg-gray-100">
        {item.imageUrl ? (
          <img
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4">
        <h3 className="font-medium text-lg">{item.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="font-medium text-gray-800">
            {formatPrice(item.price)}
          </span>
          <div className="relative">
            <div
              ref={selectorRef}
              className={cn(
                "quantity-selector flex items-center justify-center bg-gray-100 rounded-full h-8 shadow-sm",
                showQuantity ? "w-24" : "w-8",
                "origin-right overflow-hidden whitespace-nowrap transition-all duration-300 ease-out"
              )}
            >
              {showQuantity ? (
                <>
                  {quantity > 1 ? (
                    <button
                      onClick={handleMinusClick}
                      className="p-2 mx-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                  ) : (
                    <button
                      onClick={handleRemove}
                      className="p-2 mx-1 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    >
                      <Trash className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                  <span className="px-2 font-medium text-gray-800 text-center flex-shrink-0">
                    {quantity}
                  </span>
                  <button
                    onClick={handlePlusClick}
                    className="p-2 mx-auto hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              ) : quantity > 0 ? (
                <span
                  className="px-2 font-medium text-gray-800 text-center flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(e);
                  }}
                >
                  {quantity}
                </span>
              ) : (
                <button
                  onClick={handleOpen}
                  className="p-2 mx-auto hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4 text-gray-700" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
