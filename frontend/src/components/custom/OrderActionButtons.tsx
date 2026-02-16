"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, DollarSign } from "lucide-react";
import { BasicOrderSchema } from "common";
import { z } from "zod";
import { toast } from "sonner";
import { mutationFetch } from "@/lib/fetcher";

interface OrderActionButtonsProps {
  order: z.infer<typeof BasicOrderSchema>;
  token: string;
}

export function OrderActionButtons({ order, token }: OrderActionButtonsProps) {
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isCompletingPickup, setIsCompletingPickup] = useState(false);
  const router = useRouter();

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      await mutationFetch(`/order/${order.id}/confirm-payment`, { token });
      toast.success("Payment confirmed successfully");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to confirm payment";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleCompletePickup = async () => {
    setIsCompletingPickup(true);
    try {
      await mutationFetch(`/order/${order.id}/complete-pickup`, { token });
      toast.success("Order marked as picked up");
      router.refresh();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to mark order as picked up";
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsCompletingPickup(false);
    }
  };

  const isPaymentPending = order.paymentStatus !== "CONFIRMED";
  const isPickupPending = !order.pickedUp;
  const shouldShowConfirmPayment = isPaymentPending;
  const hasButtons = shouldShowConfirmPayment || isPickupPending;

  return (
    <div
      className={
        hasButtons ? "flex flex-col gap-3 sm:flex-row" : "flex flex-col"
      }
    >
      {shouldShowConfirmPayment && (
        <Button
          onClick={handleConfirmPayment}
          disabled={isConfirmingPayment}
          className="gap-2 w-full sm:w-auto"
          variant="default"
        >
          <DollarSign className="h-4 w-4" />
          {isConfirmingPayment ? "Confirming..." : "Confirm Payment"}
        </Button>
      )}
      {isPickupPending && (
        <Button
          onClick={handleCompletePickup}
          disabled={isCompletingPickup || isPaymentPending}
          className="gap-2 w-full sm:w-auto"
          variant="default"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isCompletingPickup ? "Marking..." : "Mark as Picked Up"}
        </Button>
      )}
      {!isPaymentPending && !isPickupPending && (
        <p className="text-foreground font-medium text-md text-center">
          This order is complete. Payment has been confirmed and the order has
          been picked up.
        </p>
      )}
    </div>
  );
}
