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
import { Card, CardContent } from "@/components/ui/card";
import { mutationFetch } from "@/lib/fetcher";

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
    try {
      await mutationFetch(`/fundraiser/${fundraiser.id}/publish`, { token });
      toast.success("Fundraiser published successfully");
    } catch (error) {
      toast.error(
        `Failed to publish fundraiser: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return (
    <div>
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

      <div>
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
                className="w-[100px] bg-[#265B34] text-white hover:bg-[#1f4a2b]"
              >
                Edit
              </Button>
              <ReferralButton
                fundraiser={fundraiser}
                onClick={() => setOpenReferral(true)}
              />
            </div>
          </div>
        </div>

        <Card className="mt-6 w-full border-[#f6f6f6]">
          <CardContent className="pt-[14px] px-[14px] pb-[14px]">
            <div className="flex flex-col gap-[10px]">
              {Object.entries(eventsByDay).map(
                ([dateKey, eventsOnDay], index) => (
                  <div
                    key={dateKey}
                    className="flex justify-between items-start"
                  >
                    <div className="flex flex-col gap-3 w-full">
                      {index > 0 && <div className="h-px bg-[#f6f6f6]" />}

                      {/* Date row */}
                      <div className="flex items-start gap-3">
                        <Calendar className="h-[23px] w-[23px] flex-shrink-0 text-muted-foreground mt-0.5" />
                        <span className="text-base">
                          {format(eventsOnDay[0].startsAt, "EEEE, M/d/yyyy")}
                        </span>
                      </div>

                      {/* All events for this date */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 ">
                        {eventsOnDay.map((event) => (
                          <div
                            key={event.id}
                            className="flex gap-1 items-center"
                          >
                            {/* 31px ≈ icon (23) + gap (8) so text lines up under date */}
                            <MapPin className="h-[20px] w-[20px] flex-shrink-0 text-muted-foreground mt-0.5" />
                            <span className="text-[14px]">
                              {event.location},{" "}
                              {format(event.startsAt, "h:mm a")} to{" "}
                              {format(event.endsAt, "h:mm a")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

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
