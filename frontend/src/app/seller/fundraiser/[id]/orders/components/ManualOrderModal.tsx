"use client";

import { useState } from "react";
import { z } from "zod";
import { CompleteItemSchema } from "common";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FundraiserItemCard } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemCard";
import { mutationFetch } from "@/lib/fetcher";
import { useItemsAvailability } from "@/hooks/useItemsAvailability";
import {
  formatCapacityIssueMessage,
  getCapacityIssues,
} from "@/lib/capacity";

type Item = z.infer<typeof CompleteItemSchema>;

interface ManualOrderModalProps {
  fundraiserId: string;
  items: Item[];
  token: string;
  onOrderCreated: () => void;
  isPast: boolean;
}

interface ItemQuantity {
  [itemId: string]: number;
}

export function ManualOrderModal({
  fundraiserId,
  items,
  token,
  onOrderCreated,
  isPast,
}: ManualOrderModalProps) {
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<ItemQuantity>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    items: availabilityItems,
    isLoading: isAvailabilityLoading,
    mutate: refreshAvailability,
  } = useItemsAvailability(fundraiserId);

  // Updates the quantity for a specific item
  // delta is how many quantities are beign changes (e.g +1, -1)
  const handleQuantityChange = (itemId: string, delta: number) => {
    if (delta > 0) {
      const currentQty = quantities[itemId] || 0;
      const newQty = currentQty + delta;
      const availabilityItem = availabilityItems?.find((item) => item.id === itemId);

      if (
        availabilityItem?.available !== null &&
        availabilityItem?.available !== undefined &&
        newQty > availabilityItem.available
      ) {
        toast.error(
          `Only ${availabilityItem.available} available for ${availabilityItem.name}`,
        );
        return;
      }
    }

    setQuantities((prev) => {
      const currentQty = prev[itemId] || 0;

      // Calculates new quantity, max to ensure nonnegative
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        // This is a destructing syntax that discards the item
        // Remains the rest of the items with nonzero quantities
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [itemId]: newQty };
    });
  };

  const calculateTotal = () => {
    return Object.entries(quantities).reduce((total, [itemId, qty]) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return total;
      return total + Number(item.price) * qty;
    }, 0);
  };

  const requestedItems = Object.entries(quantities).flatMap(([itemId, quantity]) => {
    const item = items.find((candidate) => candidate.id === itemId);
    if (!item) {
      return [];
    }

    return {
      itemId,
      itemName: item.name,
      quantity,
    };
  });
  const capacityIssues = availabilityItems
    ? getCapacityIssues(requestedItems, availabilityItems)
    : [];
  const hasCapacityIssues = capacityIssues.length > 0;
  const isAvailabilityPending = isAvailabilityLoading || !availabilityItems;

  const handleSaveOrder = async () => {
    // Check that at least one item is selected to place the manual order
    if (Object.keys(quantities).length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    const latestItems = (await refreshAvailability()) ?? availabilityItems;
    if (!latestItems) {
      toast.error("Unable to verify item availability. Please try again.");
      return;
    }

    const latestCapacityIssues = getCapacityIssues(requestedItems, latestItems);
    if (latestCapacityIssues.length > 0) {
      toast.error(formatCapacityIssueMessage(latestCapacityIssues[0]));
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = Object.entries(quantities).map(
        ([itemId, quantity]) => ({
          itemId,
          quantity,
        }),
      );

      await mutationFetch("/order/create", {
        token,
        body: {
          fundraiserId,
          items: orderItems,
          payment_method: "OTHER",
          markAsPickedUp: true,
        },
      });

      toast.success("Manual order created successfully");
      setOpen(false);
      setQuantities({}); // Refresh all local states of item quantities
      onOrderCreated(); // Will refresh the page
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create order",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = calculateTotal();
  const hasItems = Object.keys(quantities).length > 0;

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Clear quantities when closing the modal
    if (!newOpen) {
      setQuantities({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-black hover:bg-gray-800 text-white">
          Add order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader className="mb-3">
          <DialogTitle className="text-3xl font-bold">
            Manually add an order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const quantity = quantities[item.id] || 0;
                const availabilityItem = availabilityItems?.find(
                  (candidate) => candidate.id === item.id,
                );
                const isOutOfStock =
                  !availabilityItem ||
                  availabilityItem.offsale ||
                  (availabilityItem.available !== null &&
                    availabilityItem.available <= 0);

                return (
                  <FundraiserItemCard
                    key={item.id}
                    item={item}
                    amount={quantity}
                    increment={() => handleQuantityChange(item.id, 1)}
                    decrement={() => handleQuantityChange(item.id, -1)}
                    isOutOfStock={isOutOfStock}
                    disableIncrement={isOutOfStock}
                    isPast={isPast}
                  />
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-xl font-bold mb-4">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {isAvailabilityPending && hasItems && (
              <p className="text-sm text-[#5f5f5f] mb-3">
                Checking live item availability...
              </p>
            )}
            {hasCapacityIssues && (
              <div className="rounded-[8px] border border-[#f5c2c7] bg-[#fdf2f2] px-3 py-2 mb-3">
                <p className="text-sm font-semibold text-[#9f1239]">
                  You can&apos;t place this order right now:
                </p>
                <div className="mt-1 space-y-1">
                  {capacityIssues.map((issue) => (
                    <p
                      key={`${issue.itemId}-${issue.reason}`}
                      className="text-sm text-[#9f1239]"
                    >
                      • {formatCapacityIssueMessage(issue)}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-[#5f5f5f] mb-3">
              This manual order will be automatically marked as picked up when
              placed.
            </p>

            <Button
              onClick={handleSaveOrder}
              disabled={
                !hasItems ||
                isSubmitting ||
                isAvailabilityPending ||
                hasCapacityIssues
              }
              className="w-full bg-black hover:bg-gray-800 text-white h-12 text-base"
            >
              {isSubmitting ? "Saving..." : "Save order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
