"use client";

import { Button } from "@/components/ui/button";
import {
  CompleteFundraiserSchema,
  CompleteItemSchema,
  PickupEventSchema,
} from "common";
import { Calendar, MapPin } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import { EditFundraiserModal } from "./EditFundraiserModal";
import Checklist from "./Checklist";
import { z } from "zod";
import { toast } from "sonner";
import { ReferralApprovalModal, ReferralButton } from "./ReferralApprovalModal";

export function FundraiserHeader({
  token,
  fundraiser,
  fundraiserItems,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  fundraiserItems: z.infer<typeof CompleteItemSchema>[];
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [openReferral, setOpenReferral] = useState(false);
  const [step, setStep] = useState(0);
  const openStepAt = (step: number) => {
    setStep(step);
    setOpenEdit(true);
  };
  // Sort pickup events by start time and group by day
  const sortedEvents = [...fundraiser.pickupEvents].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  // Group events by their date (using formatted date string as key for grouping)
  const eventsByDay = sortedEvents.reduce<
    Record<string, z.infer<typeof PickupEventSchema>[]>
  >((groupedEvents, event) => {
    const dateKey = format(event.startsAt, "yyyy-MM-dd");
    if (!groupedEvents[dateKey]) {
      groupedEvents[dateKey] = [];
    }
    groupedEvents[dateKey].push(event);
    return groupedEvents;
  }, {});

  async function onPublish() {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/fundraiser/${fundraiser.id}/publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
      }
    );

    const result = await response.json();
    if (!response.ok) {
      toast.error(
        `Failed to publish fundraiser: ${result.message || "Unknown error"}`
      );
      return;
    } else {
      toast.success("Fundraiser published successfully");
    }
  }

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
      <ReferralApprovalModal
        fundraiser={fundraiser}
        token={token}
        open={openReferral}
        setOpen={setOpenReferral}
      />

      <div className="w-[90%] max-w-[1190px]">
        <div className="w-full flex justify-between">
          <h1 className="text-[32px] font-semibold">{fundraiser.name}</h1>
          <div className="flex flex-col gap-3 items-end">
            <div className="flex gap-4">
              <Link href={`/buyer/fundraiser/${fundraiser.id}?preview=true`}>
                <Button className="w-[100px] bg-[#265B34] text-white hover:bg-[#1f4a2b]">
                  Preview
                </Button>
              </Link>
              <Button
                onClick={() => {
                  setStep(0);
                  setOpenEdit(true);
                }}
                className="w-[100px] text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
              >
                Edit
              </Button>
            </div>
            <ReferralButton
              fundraiser={fundraiser}
              onClick={() => setOpenReferral(true)}
            />
          </div>
        </div>
        <div className="-mt-6 flex flex-col gap-2 min-w-[80vw]">
          {Object.entries(eventsByDay).map(([dateKey, events]) => {
            // Get the first event's date to format the day header
            const displayDate = format(events[0].startsAt, "EEEE, M/d/yyyy");

            return (
              <div
                key={dateKey}
                className="text-[16px] flex items-center gap-12 min-w-[80vw]"
              >
                <span className="flex gap-2 items-center">
                  <Calendar className="h-4" /> {displayDate}
                </span>
                <div>
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center gap-2">
                      <MapPin className="h-5" />
                      {event.location}, {format(event.startsAt, "h:mm aa")} to{" "}
                      {format(event.endsAt, "h:mm aa")}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {!fundraiser.published && (
          <div className="mt-6 flex flex-col gap-3">
            <h3 className="font-semibold text-[20px]">
              Finish Setting Up Your Fundraiser
            </h3>
            <p className="text-muted-foreground">
              Once you finished all the required fields in the form, can buyers
              start purchasing from your fundraiser. However, once you publish,
              you will NOT be able to change majority of the fields.{" "}
            </p>

            <Checklist
              fundraiser={fundraiser}
              fundraiserItems={fundraiserItems}
              onAction={openStepAt}
              publish={onPublish}
            />
          </div>
        )}
      </div>
    </div>
  );
}
