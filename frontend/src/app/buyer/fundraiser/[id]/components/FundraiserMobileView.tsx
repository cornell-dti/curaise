"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, MapPin, ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { z } from "zod";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { useCartStore } from "@/lib/store/useCartStore";
import useStore from "@/lib/store/useStore";

export function FundraiserMobileView({
  fundraiser,
  fundraiserItems,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  fundraiserItems: z.infer<typeof CompleteItemSchema>[];
}) {
  const router = useRouter();
  // fixes nextjs hydration issue: https://github.com/pmndrs/zustand/issues/938#issuecomment-1481801942
  const cart = useStore(useCartStore, (state) => state.carts[fundraiser.id]);
  const hasItems = cart && cart.length > 0;

  return (
    <>
      <div className="relative">
        <FundraiserGallerySlider images={fundraiser.imageUrls} />
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute left-[17px] top-[21px] z-10 flex items-center justify-center w-[10px] h-[17px]"
        >
          <svg
            width="10"
            height="17"
            viewBox="0 0 10 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1L1 8.5L9 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Title and Hosted By */}
      <div className="px-[17px] pt-[11px] flex flex-col gap-1">
        <h1 className="text-[24px] font-semibold leading-[36px] text-black">
          {fundraiser.name}
        </h1>
        <p className="text-[14px] leading-[21px] text-black">
          Hosted by:{" "}
          <Link
            href={`/buyer/org/${fundraiser.organization.id}`}
            className="underline"
          >
            {fundraiser.organization.name}
          </Link>
        </p>
      </div>

      <div className="px-[17px] pt-[11px] pb-4 flex flex-col gap-[22px]">
        {/* Description */}
        <div className="text-[16px] leading-[24px] text-black whitespace-pre-wrap">
          {fundraiser.description}
        </div>

        {/* Divider */}
        <div className="h-px bg-[#f6f6f6] w-full" />

        {/* Pickup Details */}
        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-semibold leading-[21px] text-black">
            Pickup Details
          </p>
          <div className="border border-[#f6f6f6] rounded-[8px] p-[14px] flex flex-col gap-[10px]">
            <div className="flex flex-col gap-3">
              {/* Date */}
              <div className="flex gap-3 items-start">
                <Calendar className="w-5 h-5 flex-shrink-0 text-black" />
                <p className="text-[14px] leading-[21px] text-black">
                  {format(fundraiser.pickupStartsAt, "EEEE, M/d/yyyy")}
                </p>
              </div>

              {/* Pickup Location */}
              <div className="flex gap-3 items-start">
                <MapPin className="w-5 h-5 flex-shrink-0 text-black" />
                <p className="text-[14px] leading-[21px] text-black">
                  {fundraiser.pickupLocation},{" "}
                  {format(fundraiser.pickupStartsAt, "h:mm a")} to{" "}
                  {format(fundraiser.pickupEndsAt, "h:mm a")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="flex flex-col gap-6">
          <h2 className="text-[20px] font-semibold leading-[24px] text-black">
            Items
          </h2>
          <FundraiserItemsPanel
            fundraiserId={fundraiser.id}
            items={fundraiserItems}
          />
        </div>

        {/* View Cart Button */}
        {hasItems && (
          <Link
            href={`/buyer/fundraiser/${fundraiser.id}/checkout`}
            className="bg-black rounded-[8px] h-[50px] flex items-center justify-center gap-[19px] px-12 py-3"
          >
            <span className="text-[18px] leading-[27px] text-[#fefdfd]">
              View Cart
            </span>
            <ShoppingCart className="w-5 h-5 text-[#fefdfd]" />
          </Link>
        )}
      </div>
    </>
  );
}

