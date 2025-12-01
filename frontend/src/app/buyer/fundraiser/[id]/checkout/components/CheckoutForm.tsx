"use client";

import { z } from "zod";
import { CompleteFundraiserSchema, CreateOrderBody, UserSchema, CompleteItemSchema } from "common";
import { useState, useEffect } from "react";
import { useStore } from "zustand";
import { useCartStore, CartItem } from "@/lib/store/useCartStore";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import Decimal from "decimal.js";
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Copy,
  ChevronDown,
  ChevronLeft,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function CheckoutForm({
  token,
  fundraiser,
  userProfile,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  userProfile: z.infer<typeof UserSchema>;
}) {
  const router = useRouter();
  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiser.id]) || [];
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const [items, setItems] = useState<z.infer<typeof CompleteItemSchema>[] | null>(null);
  const [selectedReferralId, setSelectedReferralId] = useState<string>("none");
  const [paymentMethod, setPaymentMethod] = useState<"VENMO" | "OTHER">("VENMO");
  const [showVenmoDetails, setShowVenmoDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch items to get latest imageUrl
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiser.id}/items`
        );
        const result = await response.json();
        if (response.ok) {
          const data = CompleteItemSchema.array().safeParse(result.data);
          if (data.success) {
            setItems(data.data);
          }
        }
      } catch (error) {
        console.error("Failed to fetch items:", error);
      }
    };
    fetchItems();
  }, [fundraiser.id]);

  // Merge cart items with fetched items to get latest imageUrl
  const cartWithImages = cart.map((cartItem) => {
    const fetchedItem = items?.find((item) => item.id === cartItem.item.id);
    return {
      ...cartItem,
      item: fetchedItem || cartItem.item,
    };
  });

  const approvedReferrals = fundraiser.referrals.filter((r) => r.approved);

  const orderTotal = cartWithImages
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0)
    )
    .toFixed(2);

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const cartItems = cart.map(({ item, quantity }) => ({
      itemId: item.id,
      quantity,
    }));

    const dataToSubmit: z.infer<typeof CreateOrderBody> = {
      fundraiserId: fundraiser.id,
      items: cartItems,
      payment_method: paymentMethod,
      ...(selectedReferralId && selectedReferralId !== "none" && { referralId: selectedReferralId }),
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
      setIsSubmitting(false);
      return;
    } else {
      toast.success(result.message);
      redirect("/buyer/order/" + result.data.id + "?fromCheckout=true");
    }
  }

  const handleQuantityChange = (
    item: CartItem["item"],
    delta: number
  ) => {
    const currentQuantity =
      cart.find((ci) => ci.item.id === item.id)?.quantity || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);

    if (newQuantity === 0) {
      removeItem(fundraiser.id, item);
    } else {
      updateQuantity(fundraiser.id, item, newQuantity);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with back button */}
        <div className="flex items-center gap-6 mb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[32px] font-semibold leading-[48px]">
            Confirm and pay
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-[50px] items-start">
          {/* Left Column */}
          <div className="flex-1 flex flex-col gap-[22px] w-full lg:w-auto">
            {/* Pickup Details Card */}
            <Card className="border-[#dddddd]">
              <CardContent className="p-[30px]">
                <div className="flex flex-col gap-[20px]">
                  <h2 className="text-[22px] font-semibold leading-[33px]">
                    Pickup Details
                  </h2>

                  <div className="flex flex-col gap-[22px]">
                    {/* Location */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-3">
                          {fundraiser.pickupEvents
                            .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
                            .map((event, index) => (
                            <div key={event.id}>
                              {index > 0 && (
                                <Separator className="my-3 bg-[#dddddd]" />
                              )}
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-3 items-start">
                                  <Calendar className="h-5 w-5 text-black mt-0.5" />
                                  <p className="text-base leading-6">
                                    {format(event.startsAt, "EEEE, M/d/yyyy")}
                                  </p>
                                </div>
                                <div className="flex gap-3 items-start">
                                  <MapPin className="h-5 w-5 text-black mt-0.5" />
                                  <p className="text-base leading-6">
                                    {event.location}
                                  </p>
                                </div>
                                <div className="flex gap-3 items-start">
                                  <Clock className="h-5 w-5 text-black mt-0.5" />
                                  <p className="text-base leading-6">
                                    {format(event.startsAt, "h:mm a")} -{" "}
                                    {format(event.endsAt, "h:mm a")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                    </div>

                    {/* Who referred you? */}
                    {approvedReferrals.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-[18px] font-bold leading-[27px]">
                          Who referred you?
                        </p>
                        <Select
                          value={selectedReferralId}
                          onValueChange={setSelectedReferralId}
                        >
                          <SelectTrigger className="border-[#dddddd] rounded-[6px] h-auto py-2">
                            <div className="flex items-center gap-3 w-full">
                              <ShieldCheck className="h-5 w-5 text-black" />
                              <SelectValue placeholder="Select a referrer" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {approvedReferrals.map((referral) => (
                              <SelectItem
                                key={referral.id}
                                value={referral.id}
                              >
                                {referral.referrer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card */}
            <Card className="border-[#dddddd]">
              <CardContent className="p-[30px]">
                <div className="flex flex-col gap-[22px]">
                  <h2 className="text-[22px] font-semibold leading-[33px]">
                    Payment Method
                  </h2>

                  {/* Payment Method Dropdown */}
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "VENMO" | "OTHER")}
                  >
                    <SelectTrigger className="border-[#dddddd] rounded-[6px] w-[233px]">
                      <div className="flex items-center gap-3">
                        {paymentMethod === "VENMO" ? (
                          <svg
                            className="h-7 w-7"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-label="Venmo"
                            role="img"
                            viewBox="0 0 512 512"
                          >
                            <rect
                              width="512"
                              height="512"
                              rx="15%"
                              fill="#3396cd"
                            />
                            <path
                              d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
                              fill="#ffffff"
                            />
                          </svg>
                        ) : (
                          <div className="h-7 w-7 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">
                            $
                          </div>
                        )}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENMO">Venmo</SelectItem>
                      <SelectItem value="OTHER">Cash In-Person</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Venmo link not working toggle - only show for Venmo payment */}
                  {paymentMethod === "VENMO" && (
                    <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() => setShowVenmoDetails(!showVenmoDetails)}
                        className="flex items-center gap-2 text-[#545454] text-base hover:text-black transition-colors"
                      >
                        <span>Venmo link not working?</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            showVenmoDetails ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {showVenmoDetails && (
                        <div className="flex flex-col gap-4">
                        <p className="text-base leading-6">
                          Manual entry details (enter exactly as shown, or the order may not be processed correctly):
                        </p>
                        {fundraiser.venmoUsername && (
                          <div>
                            <p className="mb-1 text-base">Send to Venmo username:</p>
                            <div className="flex items-center gap-2">
                              <div className="bg-[#f6f6f6] flex items-center gap-2.5 h-[34px] px-2.5 py-2.5 rounded-[6px]">
                                <span className="text-[#1e1c1c] text-base">
                                  @{fundraiser.venmoUsername}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    copyToClipboard(fundraiser.venmoUsername!, "Venmo username")
                                  }
                                  className="hover:opacity-70 transition-opacity"
                                >
                                  <Copy className="h-5 w-5 text-[#1e1c1c]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="mb-1 text-base">Amount to send:</p>
                          <div className="flex items-center gap-2">
                            <div className="bg-[#f6f6f6] flex items-center gap-2.5 h-[34px] px-2.5 py-2.5 rounded-[6px]">
                              <span className="text-[#1e1c1c] text-base">
                                ${orderTotal}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(orderTotal, "Amount")
                                }
                                className="hover:opacity-70 transition-opacity"
                              >
                                <Copy className="h-5 w-5 text-[#1e1c1c]" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="mb-1 text-base">Send this exact order ID as your Venmo message:</p>
                          <div className="flex items-center gap-2">
                            <div className="bg-[#f6f6f6] flex items-center gap-2.5 h-[34px] px-2.5 py-2.5 rounded-[6px]">
                              <span className="text-[#1e1c1c] text-sm">
                                Order ID will be provided after order creation
                              </span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Note: The order ID will be available on the order confirmation page after you create the order.
                          </p>
                        </div>
                      </div>
                      )}
                    </div>
                  )}

                  {/* Pay Button */}
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting || cart.length === 0}
                      className="flex items-center gap-2 font-semibold px-8 py-3 text-md h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-white"
                    >
                      {isSubmitting ? "Processing..." : "Place Order"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-[400px] shrink-0">
            <Card className="border-[#dddddd]">
              <CardContent className="p-5 lg:p-8">
                <div className="flex flex-col gap-[22px]">
                  {/* Fundraiser Info */}
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[22px] font-semibold leading-[33px]">
                      {fundraiser.name}
                    </h3>
                    <p className="text-[20px] leading-[24px]">
                      Hosted by: {fundraiser.organization.name}
                    </p>
                  </div>

                  <Separator className="bg-[#dddddd]" />

                  {/* Items */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[20px] font-semibold leading-[24px]">
                      Items
                    </h4>
                    <div className="flex flex-col gap-5">
                      {cartWithImages.map((cartItem) => (
                        <div
                          key={cartItem.item.id}
                          className="flex gap-3 items-start"
                        >
                          {/* Item Image */}
                          <div className="h-[95px] w-[118px] rounded-[5px] overflow-hidden relative flex-shrink-0">
                            {cartItem.item.imageUrl ? (
                              <img
                                src={cartItem.item.imageUrl || "/placeholder.svg"}
                                alt={cartItem.item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>

                          {/* Item Details */}
                          <div className="flex flex-col gap-3 flex-1">
                            <div className="flex flex-col gap-1">
                              <p className="text-[18px] font-semibold leading-[27px]">
                                {cartItem.item.name}
                              </p>
                              <p className="text-base leading-6">
                                ${Decimal(cartItem.item.price).toFixed(2)}
                              </p>
                            </div>

                            {/* Quantity Controls */}
                            <div className="border border-[#dddddd] rounded-[4px] flex items-center justify-between gap-2 px-1.5 py-0.5 w-fit">
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(cartItem.item, -1)
                                }
                                className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-[#545454]" />
                              </button>
                              <span className="text-base text-[#545454] min-w-[20px] text-center">
                                {cartItem.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuantityChange(cartItem.item, 1)
                                }
                                className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                              >
                                <Plus className="h-3.5 w-3.5 text-[#545454]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-[#dddddd]" />

                  {/* Total */}
                  <div className="flex items-center justify-between">
                    <span className="text-[20px] font-semibold leading-[24px]">
                      Total
                    </span>
                    <span className="text-[20px] font-semibold leading-[24px]">
                      ${orderTotal}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
