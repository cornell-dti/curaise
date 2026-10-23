"use client";

import { useRef, useState, type TouchEvent } from "react";
import { addDays, addMonths, addWeeks, differenceInCalendarDays, endOfDay, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, isValid, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrowseFundraiserCard } from "./BrowseFundraiserCard";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

// Use the same scheduled events for date indicators and selected-day details.
function pickupsOnDate(fundraiser: Fundraiser, date: Date) {
  return fundraiser.pickupEvents.filter((pickup) =>
    isValid(pickup.startsAt) && isValid(pickup.endsAt) &&
    pickup.endsAt >= pickup.startsAt &&
    pickup.startsAt <= endOfDay(date) && pickup.endsAt >= startOfDay(date),
  );
}

export function MobileCalendarView({ fundraisers, selectedDate, onSelectedDateChange }: {
  fundraisers: Fundraiser[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const monthStart = startOfWeek(startOfMonth(selectedDate));
  const weekStart = startOfWeek(selectedDate);
  const monthDays = differenceInCalendarDays(endOfWeek(endOfMonth(selectedDate)), monthStart) + 1;
  const selectedWeek = differenceInCalendarDays(weekStart, monthStart) / 7;
  const selectedFundraisers = fundraisers.flatMap((fundraiser) => {
    const pickups = pickupsOnDate(fundraiser, selectedDate);
    return pickups.length ? [{ fundraiser, pickups }] : [];
  });

  const navigate = (direction: number) => onSelectedDateChange(
    expanded ? addMonths(selectedDate, direction) : addWeeks(selectedDate, direction),
  );


  // Bind gestures only to the calendar and handle, leaving card scrolling native.
  const calendarGesture = {
    style: { touchAction: "pan-x" },
    onTouchStart: (event: TouchEvent<HTMLElement>) => {
      const touch = event.touches[0];
      touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
    },
    onTouchCancel: () => { touchStart.current = null; },
    onTouchEnd: (event: TouchEvent<HTMLElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      const touch = event.changedTouches[0];
      if (!start || !touch) return;
      const dy = touch.clientY - start.y;
      if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(touch.clientX - start.x)) {
        // Prevent a swipe from also generating a click that toggles it back.
        event.preventDefault();
        setExpanded(dy > 0);
      }
    },
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <section
        aria-label="Fundraiser calendar"
        className="shrink-0 bg-white px-4 pb-3"
        {...calendarGesture}
      >
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-center">
          <Button type="button" variant="ghost" size="icon" className="justify-self-start" aria-label={expanded ? "Previous month" : "Previous week"} onClick={() => navigate(-1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <h2 aria-live="polite" className="text-center text-xl font-semibold">{format(selectedDate, "MMMM yyyy")}</h2>
          <Button type="button" variant="ghost" size="icon" className="justify-self-end" aria-label={expanded ? "Next month" : "Next week"} onClick={() => navigate(1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
        <div className="mb-1 grid grid-cols-7 text-center text-sm text-[#989898]" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <span key={index}>{format(addDays(weekStart, index), "EEEEE")}</span>)}
        </div>
        <div id="mobile-calendar-dates" className="overflow-hidden transition-[height] duration-300 ease-in-out motion-reduce:transition-none" style={{ height: expanded ? monthDays / 7 * 40 : 40 }}>
          <div className="grid grid-cols-7 transition-transform duration-300 ease-in-out motion-reduce:transition-none" style={{ transform: expanded ? "translateY(0)" : `translateY(-${selectedWeek * 40}px)` }}>
            {Array.from({ length: monthDays }, (_, index) => {
              const date = addDays(monthStart, index);
              const selected = isSameDay(date, selectedDate);
              const today = isToday(date);
              const hidden = !expanded && !isSameDay(startOfWeek(date), weekStart);
              const count = fundraisers.filter((fundraiser) => pickupsOnDate(fundraiser, date).length > 0).length;
              return (
                <div key={format(date, "yyyy-MM-dd")} className="flex h-10 items-center justify-center" aria-hidden={hidden || undefined}>
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    tabIndex={hidden ? -1 : 0}
                    aria-label={`${format(date, "EEEE, MMMM d, yyyy")}, ${count} ${count === 1 ? "fundraiser" : "fundraisers"}`}
                    aria-pressed={selected}
                    aria-current={today ? "date" : undefined}
                    onClick={() => onSelectedDateChange(date)}
                    className={cn("relative flex size-9 flex-col items-center justify-center rounded-md text-base font-normal", !isSameMonth(date, selectedDate) && "text-muted-foreground", selected && !today && "bg-[#C6DDC8] text-black hover:bg-[#C6DDC8] hover:text-black", today && "bg-[#568165] text-white hover:bg-[#568165] hover:text-white")}
                  >
                    {format(date, "d")}
                    <span aria-hidden="true" className="absolute bottom-1 flex gap-[2px]">
                      {Array.from({ length: Math.min(3, count) }, (_, dot) => <span key={dot} className={cn("size-1 rounded-full", today ? "bg-white" : "bg-[#265B34]")} />)}
                    </span>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section aria-label="Fundraisers for selected date" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[#F6F6F6] px-5 pb-6 [&>*]:shrink-0">
        <button {...calendarGesture} type="button" aria-label={expanded ? "Collapse calendar to week" : "Expand calendar to month"} aria-expanded={expanded} aria-controls="mobile-calendar-dates" onClick={() => setExpanded(!expanded)} className="flex h-6 w-full shrink-0 items-center justify-center rounded focus-visible:ring-2 focus-visible:ring-[#265B34]">
          <span className="h-1 w-12 rounded-full bg-[#DDDDDD]" />
        </button>
        <h2 aria-live="polite" className="mb-1 text-lg font-semibold">{format(selectedDate, "EEEE, MMMM d")}</h2>
        {selectedFundraisers.length ? selectedFundraisers.map(({ fundraiser, pickups }) => (
          <BrowseFundraiserCard key={fundraiser.id} fundraiser={fundraiser} calendarPickups={pickups} />
        )) : <p className="text-base text-muted-foreground">No fundraisers scheduled for this day.</p>}
      </section>
    </div>
  );
}
