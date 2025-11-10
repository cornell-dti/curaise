"use client";
import { useState, useRef, useEffect } from "react";
import type React from "react";

import type { CompleteItemSchema } from "common";
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    decrement();
  };

  const handleIncrementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    increment();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Mobile View - Simplified Design */}
      <div className="md:hidden relative">
        <div className="relative w-full h-[133px] rounded-[6px] overflow-hidden bg-gray-100">
          {item.imageUrl ? (
            <img
              src={item.imageUrl || "/placeholder.svg"}
              alt={item.name}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No image</span>
            </div>
          )}
          {/* Button overlay - bottom right */}
          {amount > 0 ? (
            <div className="absolute bottom-[10px] right-[10px] h-[28px] bg-white/80 rounded-[25px] px-[8px] flex items-center justify-center gap-[16px] z-10">
              <button
                onClick={handleDelete}
                className="flex items-center justify-center w-5 h-5"
              >
                <Trash className="w-5 h-5 text-black" />
              </button>
              <p className="text-[18px] font-normal leading-[27px] text-black">
                {amount}
              </p>
              <button
                onClick={handleIncrementClick}
                className="flex items-center justify-center w-5 h-5"
              >
                <Plus className="w-5 h-5 text-black" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleIncrementClick}
              className="absolute bottom-[10px] right-[10px] w-[28px] h-[28px] flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors z-10"
            >
              <Plus className="w-5 h-5 text-black" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-[16px] font-semibold leading-[24px] text-[#1e1c1c]">
            {item.name}
          </h3>
          <p className="text-[16px] font-normal leading-[24px] text-[#bababa]">
            ${Number(item.price).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Desktop View - Keep existing design */}
      <div className="hidden md:block border rounded-md flex flex-col overflow-hidden h-full hover:scale-105 transition-transform duration-150">
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
            <p className="font-medium text-gray-800">{`$${Number(
              item.price
            ).toFixed(2)}`}</p>

            {/* add item component */}
            <div className="relative">
              <div
                ref={selectorRef}
                className={cn(
                  "quantity-selector flex items-center justify-center bg-gray-100 rounded-full h-8 shadow-sm",
                  showAmount ? "w-24" : "w-8",
                  "origin-right overflow-hidden whitespace-nowrap transition-all duration-300 ease-out"
                )}
              >
                {showAmount ? (
                  <>
                    {amount > 1 ? (
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
                      {amount}
                    </span>
                    <button
                      onClick={handlePlusClick}
                      className="p-2 mx-auto hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                ) : amount > 0 ? (
                  <span
                    className="px-2 font-medium text-gray-800 text-center flex-shrink-0"
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
    </div>
  );
}
