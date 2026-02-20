"use client";

import { z } from "zod";
import {
  CompleteFundraiserSchema,
  CreateOrderBody,
  UserSchema,
  CompleteItemSchema,
} from "common";
import { useState } from "react";
import { useStore } from "zustand";
import { useCartStore, CartItem } from "@/lib/store/useCartStore";
import { toast } from "sonner";
import { redirect } from "next/navigation";
import { mutationFetch } from "@/lib/fetcher";
import { format } from "date-fns";
import Decimal from "decimal.js";
import { useFundraiserItems } from "@/hooks/useFundraiserItems";
import {
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  Copy,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Image from "next/image";
import { ReferrersModal } from "./ReferrersModal";

export function CheckoutForm({
  token,
  fundraiser,
  userProfile,
  code,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  userProfile: z.infer<typeof UserSchema>;
  code: string;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiser.id]) || [];
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  const { items } = useFundraiserItems(fundraiser.id);

  const [selectedReferralId, setSelectedReferralId] = useState<string>(
    code ? code : "none",
  );
  const [paymentMethod, setPaymentMethod] = useState<"VENMO" | "OTHER">(
    "VENMO",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReferralSheetOpen, setIsReferralSheetOpen] = useState(false);
  const [referralSearch, setReferralSearch] = useState("");
  const [pendingReferralId, setPendingReferralId] = useState<string | null>(
    null,
  );

  // Merge cart items with fetched items to get latest imageUrl
  const cartWithImages = cart.map((cartItem) => {
    const fetchedItem = items?.find((item) => item.id === cartItem.item.id);
    return {
      ...cartItem,
      item: fetchedItem || cartItem.item,
    };
  });

  const approvedReferrals = fundraiser.referrals.filter((r) => r.approved);
  const unapprovedReferrals = fundraiser.referrals.filter((r) => !r.approved);

  const selectedReferralName =
    selectedReferralId && selectedReferralId !== "none"
      ? fundraiser.referrals.find((r) => r.id === selectedReferralId)?.referrer
          .name || "No Referral"
      : "No Referral";

  const orderTotal = cartWithImages
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0),
    )
    .toFixed(2);

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
      ...(selectedReferralId &&
        selectedReferralId !== "none" && { referralId: selectedReferralId }),
    };

    try {
      const result = await mutationFetch("/order/create", {
        token,
        body: dataToSubmit,
      });
      redirect(
        "/buyer/order/" +
          (result.data as { id: string }).id +
          "/submitted?fromCheckout=true",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create order",
      );
      setIsSubmitting(false);
    }
  }

  const handleQuantityChange = (item: CartItem["item"], delta: number) => {
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
    <div className="bg-white">
      {/* Mobile Layout */}
      {isMobile ? (
        <div className="flex flex-col gap-[22px] items-center px-5 pt-[30px] pb-[54px]">
          {/* Header with back button */}
          <div className="flex items-center justify-center w-full relative">
            <Link
              href={`/buyer/fundraiser/${fundraiser.id}/cart`}
              className="rounded-full transition-colors flex-shrink-0 flex items-center justify-center p-1 absolute left-0"
              style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
              aria-label="Go back to cart"
            >
              <ChevronLeft strokeWidth={2} className="h-8 w-8 text-stone-800" />
            </Link>
            <h1 className="text-[14px] font-semibold leading-[21px] text-center w-full">
              Review your order
            </h1>
          </div>

          {/* Pickup Details */}
          <div className="flex flex-col gap-1 w-full">
            <p className="text-[16px] font-semibold leading-[24px]">
              Pickup Details
            </p>
            <div className="flex flex-col gap-2 py-1">
              {fundraiser.pickupEvents
                .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
                .map((event, index) => (
                  <div key={event.id}>
                    {index > 0 && <Separator className="my-2 bg-[#dddddd]" />}
                    <div className="flex flex-col gap-2 py-1">
                      <div className="flex gap-3 items-start">
                        <Calendar
                          className="h-5 w-5 text-black mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-base leading-6">
                          {format(event.startsAt, "EEEE, M/d/yyyy")}
                        </p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <MapPin
                          className="h-5 w-5 text-black mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-base leading-6">{event.location}</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <Clock
                          className="h-5 w-5 text-black mt-0.5 flex-shrink-0"
                          aria-hidden="true"
                        />
                        <p className="text-base leading-6">
                          {format(event.startsAt, "h:mm a")} -{" "}
                          {format(event.endsAt, "h:mm a")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              <Separator className="my-2 bg-[#dddddd]" />
              {/* Referral */}
              <button
                type="button"
                className="flex items-center justify-between py-1 w-full"
                onClick={() => {
                  setPendingReferralId(null);
                  setReferralSearch("");
                  setIsReferralSheetOpen(true);
                }}
                aria-label={`Select referral. Currently: ${selectedReferralName}`}
              >
                <div className="flex gap-3 items-center text-left">
                  <User className="h-5 w-5 text-black" aria-hidden="true" />
                  <p className="text-base leading-6">{selectedReferralName}</p>
                </div>
                {approvedReferrals.length > 0 && (
                  <ChevronRight className="h-5 w-5 text-black" />
                )}
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[16px] font-semibold leading-[24px]">
              Order Summary
            </p>
            <div className="flex flex-col gap-5">
              {cartWithImages.map((cartItem) => (
                <div key={cartItem.item.id} className="flex gap-3 items-start">
                  {/* Item Image */}
                  <div className="h-[95px] w-[118px] rounded-[5px] overflow-hidden relative flex-shrink-0">
                    {cartItem.item.imageUrl ? (
                      <Image
                        src={cartItem.item.imageUrl || "/placeholder.svg"}
                        alt={`${cartItem.item.name} - $${Decimal(cartItem.item.price).toFixed(2)} each, quantity ${cartItem.quantity} from ${fundraiser.name}`}
                        fill
                        className="object-cover"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        className="w-full h-full bg-gray-200"
                        aria-label={`No image available for ${cartItem.item.name}`}
                      />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex flex-col gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-[14px] font-semibold leading-[21px]">
                        {cartItem.item.name}
                      </p>
                      <p className="text-[14px] leading-[21px]">
                        ${Decimal(cartItem.item.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="border border-[#dddddd] rounded-[4px] flex items-center justify-between gap-2 px-1.5 py-0.5 w-fit">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(cartItem.item, -1)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        aria-label={
                          cartItem.quantity === 1
                            ? `Remove ${cartItem.item.name} from cart`
                            : `Decrease quantity of ${cartItem.item.name}`
                        }
                      >
                        <Trash2 className="h-3 w-3 text-[#545454]" />
                      </button>
                      <span
                        className="text-[12px] text-[#545454] min-w-[20px] text-center"
                        aria-label={`Quantity: ${cartItem.quantity}`}
                      >
                        {cartItem.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(cartItem.item, 1)}
                        className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                        aria-label={`Increase quantity of ${cartItem.item.name}`}
                      >
                        <Plus className="h-3 w-3 text-[#545454]" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="bg-[#dddddd]" />
            <div className="flex items-center justify-between py-3">
              <span className="text-[18px] font-semibold leading-[27px]">
                Total
              </span>
              <span className="text-[18px] font-semibold leading-[27px]">
                ${orderTotal}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-3 w-full">
            <p className="text-[16px] font-semibold leading-[24px]">
              Payment Method
            </p>
            <Select
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "VENMO" | "OTHER")
              }
            >
              <SelectTrigger className="border-[#dddddd] rounded-[6px] w-full h-auto py-3.5 px-3.5">
                <div className="flex items-center justify-between w-full">
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
                          fill="#008CFF"
                        />
                        <path
                          d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
                          fill="#ffffff"
                        />
                      </svg>
                    ) : (
                      <div className="h-7 w-7 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs text-[15px]">
                        $
                      </div>
                    )}
                    <span className="text-base">
                      {paymentMethod === "VENMO" ? "Venmo" : "Cash In-Person"}
                    </span>
                  </div>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VENMO">
                  <div className="flex items-center gap-2">
                    <svg
                      className="h-7 w-7"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-label="Venmo"
                      role="img"
                      viewBox="0 0 512 512"
                    >
                      <rect width="512" height="512" rx="15%" fill="#008CFF" />
                      <path
                        d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
                        fill="#ffffff"
                      />
                    </svg>
                    <span>Venmo</span>
                  </div>
                </SelectItem>
                <SelectItem value="OTHER">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 bg-green-600 rounded flex items-center justify-center text-white font-bold text-[15px]">
                      $
                    </div>
                    <span>Cash In-Person</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Pay Button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || cart.length === 0}
              className="w-full h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-[#fefdfd] text-[18px] font-normal"
              aria-busy={isSubmitting}
              aria-label={
                isSubmitting ? "Processing your order" : "Place order"
              }
            >
              {isSubmitting ? "Processing..." : "Place Order"}
            </Button>
          </div>

          {/* Referral Selection Sheet */}
          <Sheet
            open={isReferralSheetOpen}
            onOpenChange={setIsReferralSheetOpen}
          >
            <SheetContent
              side="bottom"
              className="rounded-t-[40px] pb-6 pt-6 px-5 h-[80vh] flex flex-col"
            >
              <SheetHeader className="mb-4">
                <div className="flex items-center justify-center w-full relative">
                  <SheetTitle className="text-[18px] font-semibold leading-[27px] text-center w-full">
                    Who referred you?
                  </SheetTitle>
                </div>
              </SheetHeader>

              <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                {/* Search */}
                <div className="border border-[#dddddd] rounded-[6px] h-10 px-3 flex items-center gap-2">
                  <Search
                    className="h-4 w-4 text-[#969696]"
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={referralSearch}
                    onChange={(e) => setReferralSearch(e.target.value)}
                    placeholder="Search for a name"
                    className="flex-1 bg-transparent text-sm placeholder:text-[#969696] outline-none"
                    aria-label="Search for a referrer by name"
                  />
                </div>

                {/*
                  Filtered lists so section titles only show when there are matches,
                  and they respond to the current search query.
                */}
                {(() => {
                  const filteredApproved = approvedReferrals.filter(
                    (referral) =>
                      referral.referrer.name
                        .toLowerCase()
                        .includes(referralSearch.toLowerCase()),
                  );
                  const filteredUnapproved = unapprovedReferrals.filter(
                    (referral) =>
                      referral.referrer.name
                        .toLowerCase()
                        .includes(referralSearch.toLowerCase()),
                  );

                  return (
                    <>
                      {/* Verified Referrers */}
                      {filteredApproved.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <p className="text-[14px] font-semibold leading-[21px]">
                            Verified Referrers
                          </p>
                          <div className="flex flex-col gap-3">
                            {filteredApproved.map((referral) => (
                              <button
                                key={referral.id}
                                type="button"
                                className={`flex items-center gap-3 w-full text-left px-2 py-1 rounded-md ${
                                  pendingReferralId === referral.id
                                    ? "bg-[#f6f6f6]"
                                    : ""
                                }`}
                                onClick={() => {
                                  setPendingReferralId(referral.id);
                                }}
                                aria-label={`Select verified referrer ${referral.referrer.name}${pendingReferralId === referral.id ? " (currently selected)" : ""}`}
                              >
                                <ShieldCheck
                                  className="h-5 w-5 text-black"
                                  aria-hidden="true"
                                />
                                <span className="text-[14px] leading-[21px]">
                                  {referral.referrer.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Unverified Referrers */}
                      {filteredUnapproved.length > 0 && (
                        <div className="flex flex-col gap-3">
                          <p className="text-[14px] font-semibold leading-[21px]">
                            Unverified Referrers
                          </p>
                          <div className="flex flex-col gap-3">
                            {filteredUnapproved.map((referral) => (
                              <button
                                key={referral.id}
                                type="button"
                                className={`flex items-center gap-3 w-full text-left px-2 py-1 rounded-md ${
                                  pendingReferralId === referral.id
                                    ? "bg-[#f6f6f6]"
                                    : ""
                                }`}
                                onClick={() => {
                                  setPendingReferralId(referral.id);
                                }}
                                aria-label={`Select unverified referrer ${referral.referrer.name}${pendingReferralId === referral.id ? " (currently selected)" : ""}`}
                              >
                                <ShieldAlert
                                  className="h-5 w-5 text-black"
                                  aria-hidden="true"
                                />
                                <span className="text-[14px] leading-[21px]">
                                  {referral.referrer.name}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="mt-4">
                <Button
                  type="button"
                  className="w-full h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-[#fefdfd] text-[18px] leading-[27px] font-normal"
                  disabled={!pendingReferralId}
                  onClick={() => {
                    if (pendingReferralId) {
                      setSelectedReferralId(pendingReferralId);
                    }
                    setIsReferralSheetOpen(false);
                  }}
                >
                  Update
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        /* Desktop Layout */
        <div className="w-full px-4 md:px-[157px] pt-4">
          {/* Header with back button */}
          <div className="flex items-center gap-6 mb-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full transition-colors flex-shrink-0 flex items-center justify-center p-1"
              style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
              aria-label="Go back"
            >
              <ChevronLeft strokeWidth={2} className="h-8 w-8 text-stone-800" />
            </button>
            <h1 className="text-[32px] font-semibold leading-[48px]">
              Confirm and pay
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-[50px] items-start justify-between">
            {/* Left Column */}
            <div className="flex-1 flex flex-col gap-[22px] w-full lg:w-auto">
              {/* Pickup Details Card */}
              <Card className="border-[#dddddd] pt-3">
                <CardContent>
                  <div className="flex flex-col gap-[20px]">
                    <h2 className="text-[22px] font-semibold leading-[33px]">
                      Pickup Details
                    </h2>

                    <div className="flex flex-col gap-[22px]">
                      {/* Location */}
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-3">
                          {fundraiser.pickupEvents
                            .sort(
                              (a, b) =>
                                a.startsAt.getTime() - b.startsAt.getTime(),
                            )
                            .map((event, index) => (
                              <div key={event.id}>
                                {index > 0 && (
                                  <Separator className="my-3 bg-[#dddddd]" />
                                )}
                                <div className="flex flex-col gap-2">
                                  <div className="flex gap-3 items-start">
                                    <Calendar
                                      className="h-5 w-5 text-black mt-0.5"
                                      aria-hidden="true"
                                    />
                                    <p className="text-base leading-6">
                                      {format(event.startsAt, "EEEE, M/d/yyyy")}
                                    </p>
                                  </div>
                                  <div className="flex gap-3 items-start">
                                    <MapPin
                                      className="h-5 w-5 text-black mt-0.5"
                                      aria-hidden="true"
                                    />
                                    <p className="text-base leading-6">
                                      {event.location}
                                    </p>
                                  </div>
                                  <div className="flex gap-3 items-start">
                                    <Clock
                                      className="h-5 w-5 text-black mt-0.5"
                                      aria-hidden="true"
                                    />
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

                      {/* Referral Button */}
                      <button
                        type="button"
                        className="flex items-center justify-between w-full mt-2"
                        onClick={() => {
                          setPendingReferralId(null);
                          setReferralSearch("");
                          setIsReferralSheetOpen(true); // 🔓 open Sheet
                        }}
                        aria-label={`Select referral. Currently: ${selectedReferralName}`}
                      >
                        <div className="flex gap-3 items-center text-left">
                          <User
                            className="h-5 w-5 text-black"
                            aria-hidden="true"
                          />
                          <p className="text-base leading-6">
                            {selectedReferralName}
                          </p>
                        </div>
                        {approvedReferrals.length > 0 && (
                          <ChevronRight className="h-5 w-5 text-black" />
                        )}
                      </button>

                      <ReferrersModal
                        open={isReferralSheetOpen}
                        onOpenChange={setIsReferralSheetOpen}
                        approvedReferrals={approvedReferrals}
                        unapprovedReferrals={unapprovedReferrals}
                        selectedReferralId={selectedReferralId}
                        setSelectedReferralId={setSelectedReferralId}
                      />
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
                      onValueChange={(value) =>
                        setPaymentMethod(value as "VENMO" | "OTHER")
                      }
                    >
                      <SelectTrigger className="border-[#dddddd] rounded-[6px] w-fit h-auto py-2.5">
                        <div className="flex items-center gap-3 pr-2">
                          <SelectValue />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VENMO">
                          <div className="flex items-center gap-2">
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
                                fill="#008CFF"
                              />
                              <path
                                d="m381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z"
                                fill="#ffffff"
                              />
                            </svg>
                            <span>Venmo</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="OTHER">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 bg-green-600 rounded flex items-center justify-center text-white font-bold text-[15px]">
                              $
                            </div>
                            <span>Cash In-Person</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Pay Button */}
                    <Button
                      size="lg"
                      onClick={handleSubmit}
                      disabled={isSubmitting || cart.length === 0}
                      className="flex items-center gap-2 font-normal text-[18px] leading-[27px] px-8 py-3 text-md h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-white"
                      aria-busy={isSubmitting}
                      aria-label={
                        isSubmitting ? "Processing your order" : "Place order"
                      }
                    >
                      {isSubmitting ? "Processing..." : "Place Order"}
                    </Button>
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
                                <Image
                                  src={
                                    cartItem.item.imageUrl || "/placeholder.svg"
                                  }
                                  alt={`${cartItem.item.name} - $${Decimal(cartItem.item.price).toFixed(2)} each, quantity ${cartItem.quantity} from ${fundraiser.name}`}
                                  fill
                                  className="object-cover"
                                  style={{ objectFit: "cover" }}
                                />
                              ) : (
                                <div
                                  className="w-full h-full bg-gray-200"
                                  aria-label={`No image available for ${cartItem.item.name}`}
                                />
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
                                  aria-label={
                                    cartItem.quantity === 1
                                      ? `Remove ${cartItem.item.name} from cart`
                                      : `Decrease quantity of ${cartItem.item.name}`
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-[#545454]" />
                                </button>
                                <span
                                  className="text-base text-[#545454] min-w-[20px] text-center"
                                  aria-label={`Quantity: ${cartItem.quantity}`}
                                >
                                  {cartItem.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleQuantityChange(cartItem.item, 1)
                                  }
                                  className="p-0.5 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                                  aria-label={`Increase quantity of ${cartItem.item.name}`}
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
      )}
    </div>
  );
}
