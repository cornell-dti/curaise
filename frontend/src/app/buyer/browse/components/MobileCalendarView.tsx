"use client";

import { useState } from "react";
import { addDays, addWeeks, endOfDay, format, isSameDay, startOfDay, startOfWeek } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmallCalendar } from "./SmallCalendar";
import { BrowseFundraiserCard } from "./BrowseFundraiserCard";

export function MobileCalendarView({
  fundraisers,
  selectedDate,
  onSelectedDateChange,
}: {
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const weekStart = startOfWeek(selectedDate);
  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);
  // Include both buying periods and pickup events, as in the desktop calendar.
  const selectedFundraisers = fundraisers.filter((fundraiser) =>
    (fundraiser.buyingStartsAt <= dayEnd && fundraiser.buyingEndsAt >= dayStart) ||
    fundraiser.pickupEvents.some((pickup) => pickup.startsAt <= dayEnd && pickup.endsAt >= dayStart),
  );

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Fundraiser calendar" className="rounded-md border border-[#dfdfdf] bg-white p-4">
        {expanded ? (
          <SmallCalendar
            date={selectedDate}
            onSelected={onSelectedDateChange}
            handleDateSelect={(date) => date && onSelectedDateChange(date)}
            forceVisible
            className="border-0 py-0"
          />
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{format(selectedDate, "MMMM yyyy")}</h2>
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Previous week" onClick={() => onSelectedDateChange(addWeeks(selectedDate, -1))}>
                  <ChevronLeft aria-hidden="true" />
                </Button>
                <Button type="button" variant="ghost" size="icon" aria-label="Next week" onClick={() => onSelectedDateChange(addWeeks(selectedDate, 1))}>
                  <ChevronRight aria-hidden="true" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }, (_, index) => {
                const date = addDays(weekStart, index);
                const selected = isSameDay(date, selectedDate);
                return (
                  <div key={date.toISOString()} className="flex min-w-0 flex-col items-center gap-2">
                    <span className="text-xs text-[#989898]">{format(date, "EEEEE")}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={format(date, "EEEE, MMMM d, yyyy")}
                      aria-pressed={selected}
                      onClick={() => onSelectedDateChange(date)}
                      className={cn("w-full", selected && "bg-[#568165] text-white hover:bg-[#568165] hover:text-white")}
                    >
                      {format(date, "d")}
                    </Button>
                  </div>
                );
              })}
            </div>
          </>
        )}
        <Button type="button" variant="ghost" className="mt-3 w-full text-[#265B34]" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show week" : "Show month"}
          <ChevronDown aria-hidden="true" className={expanded ? "rotate-180" : undefined} />
        </Button>
      </section>
      <section aria-label="Fundraisers for selected date" className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">{format(selectedDate, "EEEE, MMMM d")}</h2>
        {selectedFundraisers.length ? selectedFundraisers.map((fundraiser) => (
          <BrowseFundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
        )) : (
          <p className="text-base text-muted-foreground">No fundraisers on this date.</p>
        )}
      </section>
    </div>
  );
}
