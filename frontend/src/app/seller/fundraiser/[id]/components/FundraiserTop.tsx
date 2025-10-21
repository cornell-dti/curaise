"use client";
import { Button } from "@/components/ui/button";
import { CompleteFundraiserSchema, CreateFundraiserItemBody } from "common";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { EditFundraiserModal } from "./EditFundraiserModal";
import Checklist from "./Checklist";
import { z } from "zod";

export function FundraiserTop({
  token,
  fundraiser,
  fundraiserItems,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  fundraiserItems: z.infer<typeof CreateFundraiserItemBody>[];
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [step, setStep] = useState(0);
  const openModalAt = (step: number) => {
    setStep(step);
    setOpenEdit(true);
  };
  return (
    <div className="flex flex-col items-center">
      <EditFundraiserModal
        token={token}
        fundraiser={fundraiser}
        currentFundraiserItems={fundraiserItems}
        open={openEdit}
        setOpen={setOpenEdit}
        step={step}
        setStep={setStep}
      />
      <div className="w-[90%] max-w-[1190px]">
        <div className="w-full flex justify-between">
          <h1 className="text-[32px] font-semibold">{fundraiser.name}</h1>
          <div className="flex gap-4">
            <Link href={`/buyer/fundraiser/${fundraiser.id}`}>
              <Button className="bg-[#265B34] text-white hover:bg-[#1f4a2b]">
                Preview
              </Button>
            </Link>
            <Button
              onClick={() => setOpenEdit(true)}
              className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
            >
              Edit
            </Button>
          </div>
        </div>
        <div className="flex gap-4">
          <span className="flex gap-2 items-center">
            <Calendar className="h-5" />{" "}
            {format(fundraiser.buyingStartsAt, "EEEE, M/d/yyyy")} -{" "}
            {format(fundraiser.buyingEndsAt, "EEEE, M/d/yyyy")}
          </span>
          <span className="flex gap-2">
            <MapPin className="h-5" /> {fundraiser.pickupLocation}
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <h3 className="font-semibold text-[20px]">
            Finish Setting Up Your Fundraiser
          </h3>
          <Checklist
            fundraiser={fundraiser}
            fundraiserItems={fundraiserItems}
            onAction={openModalAt}
          />
        </div>
      </div>
    </div>
  );
}
