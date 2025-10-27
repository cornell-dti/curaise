"use client";

import { z } from "zod";
import { CompleteFundraiserSchema, CreateOrderBody, UserSchema } from "common";
import MultiStepForm from "@/components/custom/MultiStepForm";
import { useState } from "react";
import { EditBuyerInfoForm } from "./EditBuyerInfoForm";
import { useStore } from "zustand";
import { useCartStore } from "@/lib/store/useCartStore";
import { ReviewOrderForm } from "./ReviewOrderForm";
import { toast } from "sonner";
import { redirect } from "next/navigation";

// TODO: ADD VENMO PAYMENT STUFF
export function CheckoutForm({
  token,
  fundraiser,
  userProfile,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  userProfile: z.infer<typeof UserSchema>;
}) {
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiser.id]) || [];
  const clearCart = useCartStore((state) => state.clearCart);
  
  const cartItems = cart.map(({ item, quantity }) => ({
    itemId: item.id,
    quantity,
  }));

  const [formData, setFormData] = useState<z.infer<typeof CreateOrderBody>>({
    fundraiserId: fundraiser.id,
    items: cartItems,
    payment_method: "OTHER", // default to other for now
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Check if cart is empty after hooks are called
  if ((!cartItems || cartItems.length === 0) && !orderPlaced) {
    // If cart is empty and no order was just placed, redirect to the fundraiser page
    redirect(`/buyer/fundraiser/${fundraiser.id}`);
    return null;
  }

  async function onSubmit() {
    const dataToSubmit = {
      ...formData,
    };

    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/order/create",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(dataToSubmit),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(result.message);
      return;
    } else {
      toast.success(result.message);
      // Mark order as placed and clear the cart
      setOrderPlaced(true);
      clearCart(fundraiser.id);
      redirect("/buyer/order/" + result.data.id);
    }
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <MultiStepForm
        labels={["Buyer Information", "Review Order"]}
        currentStep={currentStep}
      >
        <EditBuyerInfoForm
          user={userProfile}
          token={token}
          onNext={() => setCurrentStep(1)}
        />
        <ReviewOrderForm
          fundraiser={fundraiser}
          cartItems={cart}
          onSubmit={onSubmit}
          onBack={() => setCurrentStep(0)}
        />
      </MultiStepForm>
    </div>
  );
}
