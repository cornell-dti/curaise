"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CompleteItemSchema } from "common";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";
import { useState } from "react";
import { Plus, Minus, Trash } from "lucide-react";
import Link from "next/link";

export function FundraiserItemModal({
  fundraiserId,
  item,
  amount,
  increment,
  decrement,
}: {
  fundraiserId: string;
  item: z.infer<typeof CompleteItemSchema>;
  amount: number;
  increment: () => void;
  decrement: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile: Link to item detail page - only wrap image and text */}
      <div className="md:hidden">
        <div className="relative">
          <div className="relative w-full h-[133px] rounded-[6px] overflow-hidden bg-gray-100">
            <Link
              href={`/buyer/fundraiser/${fundraiserId}/item/${item.id}`}
              className="block w-full h-full"
            >
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
            </Link>
            {/* Buttons positioned absolutely, outside the Link */}
            {amount > 0 ? (
              <div className="absolute bottom-[10px] right-[10px] h-[28px] bg-white/80 rounded-[25px] px-[8px] flex items-center justify-center gap-[16px] z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    decrement();
                  }}
                  className="flex items-center justify-center w-5 h-5"
                >
                  <Trash className="w-5 h-5 text-black" />
                </button>
                <p className="text-[18px] font-normal leading-[27px] text-black">
                  {amount}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    increment();
                  }}
                  className="flex items-center justify-center w-5 h-5"
                >
                  <Plus className="w-5 h-5 text-black" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  increment();
                }}
                className="absolute bottom-[10px] right-[10px] w-[28px] h-[28px] flex items-center justify-center bg-white/80 rounded-full hover:bg-white transition-colors z-10"
              >
                <Plus className="w-5 h-5 text-black" />
              </button>
            )}
          </div>
          <Link
            href={`/buyer/fundraiser/${fundraiserId}/item/${item.id}`}
            className="block"
          >
            <div className="flex flex-col gap-1 mt-2">
              <h3 className="text-[16px] font-semibold leading-[24px] text-[#1e1c1c]">
                {item.name}
              </h3>
              <p className="text-[16px] font-normal leading-[24px] text-[#bababa]">
                ${Number(item.price).toFixed(0)}
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* Desktop: Dialog */}
      <div className="hidden md:block">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <FundraiserItemCard
                item={item}
                amount={amount}
                increment={increment}
                decrement={decrement}
              />
            </div>
          </DialogTrigger>

        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            {item.imageUrl && (
              <img
                src={item.imageUrl || "/placeholder.svg"}
                alt={item.name}
                className="w-full h-64 object-cover rounded-md mt-5 mb-5"
              />
            )}
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription>{item.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={decrement}
              disabled={amount <= 0}
            >
              {amount <= 1 ? (
                <Trash className="w-4 h-4 text-gray-500" />
              ) : (
                <Minus className="h-4 w-4" />
              )}
            </Button>
            <span className="text-lg font-medium w-8 text-center">{amount}</span>
            <Button variant="outline" size="icon" onClick={increment}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
