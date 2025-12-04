"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, DollarSign } from "lucide-react";
import { BasicOrderSchema } from "common";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface OrderActionButtonsProps {
  order: z.infer<typeof BasicOrderSchema>;
}

export function OrderActionButtons({ order }: OrderActionButtonsProps) {
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [isCompletingPickup, setIsCompletingPickup] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleConfirmPayment = async () => {
    setIsConfirmingPayment(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order/${order.id}/confirm-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to confirm payment");
      }

      toast.success("Payment confirmed successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to confirm payment");
      console.error(error);
    } finally {
      setIsConfirmingPayment(false);
    }
  };

  const handleCompletePickup = async () => {
    setIsCompletingPickup(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("No session found");
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order/${order.id}/complete-pickup`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to mark order as picked up");
      }

      toast.success("Order marked as picked up");
      router.refresh();
    } catch (error) {
      toast.error("Failed to mark order as picked up");
      console.error(error);
    } finally {
      setIsCompletingPickup(false);
    }
  };

  const isPaymentPending = order.paymentStatus !== "CONFIRMED";
  const isPickupPending = !order.pickedUp;
  const shouldShowConfirmPayment = isPaymentPending && order.paymentMethod === "OTHER";
  const hasButtons = shouldShowConfirmPayment || isPickupPending;

  return (
    <div className={hasButtons ? "flex flex-col gap-3 sm:flex-row" : "flex flex-col"}>
      {shouldShowConfirmPayment && (
        <Button
          onClick={handleConfirmPayment}
          disabled={isConfirmingPayment}
          className="gap-2 flex-1"
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
          className="gap-2 flex-1"
          variant="default"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isCompletingPickup ? "Marking..." : "Mark as Picked Up"}
        </Button>
      )}
      {!isPaymentPending && !isPickupPending && (
        <p className="text-foreground text-md text-center">
          This order is complete. Payment has been confirmed and the order has
          been picked up.
        </p>
      )}
    </div>
  );
}
