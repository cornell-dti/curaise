"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";

import type { CompleteItemSchema } from "common";
import type Decimal from "decimal.js";
import { Plus, Minus, Trash } from "lucide-react";
import type { z } from "zod";
import { cn } from "@/lib/utils";

export function FundraiserItemCard({
  item,
  amount,
  increment,
  decrement,
}: {
  item: z.infer<typeof CompleteItemSchema>;
  amount: number;
  increment: () => void;
  decrement: () => void;
}) {
  const [showAmount, setShowAmount] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // click outside add/remove component
    function handleClickOutside(event: MouseEvent) {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node) &&
        showAmount
      ) {
        handleClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAmount]);

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (!showAmount) {
      setShowAmount(true);
    } else {
      increment();
    }
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (amount > 1) {
      decrement();
    } else {
      setShowAmount(false);
    }
  };

  const handleClose = () => {
    setTimeout(() => {
      setShowAmount(false);
    }, 300);
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setShowAmount(true);
    if (amount === 0) {
      increment();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    setTimeout(() => {
      setShowAmount(false);
      decrement();
    }, 300);
  };

  return (
    <div className="border rounded-md flex flex-col overflow-hidden h-full hover:scale-105 transition-transform duration-150">
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
        <h3 className="font-semibold text-[20px]">{item.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <p className="font-[400] text-muted-foreground">{`$${Number(
            item.price
          ).toFixed(2)}`}</p>

          {/* add item component */}
          <div className="relative">
            <div
              ref={selectorRef}
              className={cn(
                "quantity-selector flex items-center justify-center bg-gray-400 rounded-full h-8 shadow-sm",
                showAmount ? "w-24" : "w-8",
                "origin-right overflow-hidden whitespace-nowrap transition-all duration-300 ease-out"
              )}
            >
              {showAmount ? (
                <>
                  {amount > 1 ? (
                    <button
                      onClick={handleMinusClick}
                      className="p-2 mx-1 hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button
                      onClick={handleRemove}
                      className="p-2 mx-1 hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                    >
                      <Trash className="w-4 h-4 text-white" />
                    </button>
                  )}
                  <span className="px-2 font-medium text-white text-center flex-shrink-0">
                    {amount}
                  </span>
                  <button
                    onClick={handlePlusClick}
                    className="p-2 mx-1 hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </>
              ) : amount > 0 ? (
                <span
                  className="px-2 font-medium text-white text-center flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(e);
                  }}
                >
                  {amount}
                </span>
              ) : (
                <button
                  onClick={handleOpen}
                  className="p-2 mx-auto hover:bg-gray-600 rounded-full transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
