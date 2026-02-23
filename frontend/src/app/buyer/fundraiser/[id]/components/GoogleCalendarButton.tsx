"use client";
import { Button } from "@/components/ui/button";
import { CompleteFundraiserSchema, PickupEventSchema } from "common";
import { Calendar } from "lucide-react";
import { z } from "zod";

const createGoogleCalendarLink = (
  title: string,
  location: string,
  start: Date,
  end: Date,
  description?: string,
) => {
  const startStr = start.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const endStr = end.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const url = new URL("https://www.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", title);
  if (description) url.searchParams.set("details", description);
  if (location) url.searchParams.set("location", location);
  url.searchParams.set("dates", `${startStr}/${endStr}`);

  return url.toString();
};

export function GoogleCalendarButton({
  fundraiser,
  pickupEvent,
  isPast,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
  pickupEvent: z.infer<typeof PickupEventSchema>;
  isPast: boolean;
}) {
  const handleAddToCalendar = (
    pickupEvent: z.infer<typeof PickupEventSchema>,
  ) => {
    const title = `[${fundraiser.organization.name}] ${fundraiser.name} Pick Up`;
    const customURL = createGoogleCalendarLink(
      title,
      pickupEvent.location,
      pickupEvent.startsAt,
      pickupEvent.endsAt,
    );
    const newTab = window.open(customURL, "_blank");
    if (newTab) newTab.focus();
  };

  return (
    <Button
      disabled={isPast}
      onClick={() => handleAddToCalendar(pickupEvent)}
      variant="default"
      className="flex g-2 max-w-[120px] rounded-xl md:rounded-md"
    >
      <Calendar className="w-4 h-4" />
      <span className="hidden md:inline">Add to GCal</span>
    </Button>
  );
}
