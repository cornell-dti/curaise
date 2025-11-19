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
import { useEffect, useState } from "react";
import { EditFundraiserModal } from "./EditFundraiserModal";
import Checklist from "./Checklist";
import { z } from "zod";
import { toast } from "sonner";

export function FundraiserTop({
  token,
  fundraiser,
  fundraiserItems,
}: {
  token: string;
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  fundraiserItems: z.infer<typeof CompleteItemSchema>[];
}) {
  const [openEdit, setOpenEdit] = useState(false);
  const [step, setStep] = useState(0);
  const [publish, setPublish] = useState(fundraiser.published);
  const openModalAt = (step: number) => {
    setStep(step);
    setOpenEdit(true);
  };
  const grouped_days = fundraiser.pickupEvents
    .slice()
    .sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
    )
    .reduce(
      (
        acc: Record<string, z.infer<typeof PickupEventSchema>[]>,
        event: z.infer<typeof PickupEventSchema>[][number]
      ) => {
        const dayKey = format(event.startsAt, "EEEE, M/d/yyyy");
        acc[dayKey] = acc[dayKey] || [];
        acc[dayKey].push(event);
        return acc;
      },
      {}
    );
  const published = (publish: boolean) => {
    setPublish(publish);
  };

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

  useEffect(() => {
    if (publish) {
      onPublish();
    }
  }, [publish]);

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
            <Link href={`/buyer/fundraiser/${fundraiser.id}?preview=true`}>
              <Button className="bg-[#265B34] text-white hover:bg-[#1f4a2b]">
                Preview
              </Button>
            </Link>
            <Button
              onClick={() => {
                setStep(0);
                setOpenEdit(true);
              }}
              className="text-[#265B34] border border-current bg-transparent hover:bg-[#e6f0ea]"
            >
              Edit
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 min-w-[80vw]">
          {Object.entries(grouped_days).map(([day, events]) => (
            <div
              key={day}
              className="text-[18px] flex items-center gap-12 min-w-[80vw]"
            >
              <span className="flex gap-2 items-center">
                <Calendar className="h-5" /> {format(day, "EEEE, M/d/yyyy")}
              </span>
              <div>
                {events.map((e) => (
                  <div key={e.id} className="flex items-center gap-2">
                    <MapPin className="h-5" />
                    {e.location}, {format(e.startsAt, "h:mm aa")} to{" "}
                    {format(e.endsAt, "h:mm aa")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {!publish && (
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
              onAction={openModalAt}
              isPublish={published}
            />
          </div>
        )}
      </div>
    </div>
  );
}
