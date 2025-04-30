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

export function FundraiserItemModal({
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
  const [isOpen, setIsOpen] = useState(false);

  return (
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
  );
}
