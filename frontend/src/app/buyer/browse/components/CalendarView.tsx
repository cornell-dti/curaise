"use client";
import { useEffect, useRef, useState } from "react";
import {
  Calendar as BigCalendar,
  DateHeaderProps,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import { isToday } from "date-fns";
import moment from "moment";
import { CalendarDays, ChevronDown } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { SmallCalendar } from "./SmallCalendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { EventDetailsCard } from "./EventDetailsCard";
import {
  CalendarEventComponent,
  eventStyleGetter,
} from "./calendar-utils";
import { getOrganizationColor } from "./browse-utils";

export interface CalendarEvent {
  id: string;
  type: "pickup" | "buying";
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  organization: string;
  locations: string[];
}

const SCROLL_TO_TIME = new Date(1970, 0, 1, 10);

function CalendarDayHeader({ date }: { date: Date }) {
  return (
    <div className="flex flex-col items-center leading-tight h-[70px]">
      <span className="text-[12px] font-normal uppercase text-muted-foreground">
        {moment(date).format("ddd")}
      </span>
      <span className="text-[16px] font-medium text-black">
        {moment(date).format("D")}
      </span>
    </div>
  );
}

function CalendarMonthDateHeader({
  date,
  label,
  onDrillDown,
}: DateHeaderProps) {
  return (
    <button
      type="button"
      onClick={onDrillDown}
      className={cn(
        "inline-flex size-[27px] items-center justify-center rounded-[6px] text-[15px] font-normal leading-[22px]",
        isToday(date) ? "bg-[#568165] text-white" : "text-black",
      )}
    >
      {label}
    </button>
  );
}

type FundraiserWithItems = z.infer<typeof BasicFundraiserSchema> & {
  items: z.infer<typeof CompleteItemSchema>[];
};

const localizer = momentLocalizer(moment);
const MOBILE_BREAKPOINT = 768;

export function CalendarView({
  organizations,
  fundraisers,
  selectedDate,
  onSelectedDateChange,
}: {
  organizations: z.infer<typeof BasicOrganizationSchema>[];
  fundraisers: FundraiserWithItems[];
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  const organizationNames = organizations.map((org) => org.name);
  const [isMobile, setIsMobile] = useState(false);
  const [isCalendarFiltersOpen, setIsCalendarFiltersOpen] = useState(false);
  const [selectedFundraiserId, setSelectedFundraiserId] = useState<
    string | null
  >(null);
  const selectedEventRef = useRef<Pick<HTMLElement, "getBoundingClientRect">>({
    getBoundingClientRect: () => new DOMRect(),
  });

  const events: CalendarEvent[] = fundraisers.flatMap((fundraiser) => {
    const pickupsByTime = new Map<string, CalendarEvent>();
    for (const pickup of fundraiser.pickupEvents) {
      const key = `${pickup.startsAt.getTime()}-${pickup.endsAt.getTime()}`;
      const existing = pickupsByTime.get(key);
      if (existing) {
        existing.locations.push(pickup.location);
      } else {
        pickupsByTime.set(key, {
          id: fundraiser.id,
          type: "pickup",
          title: fundraiser.name,
          start: pickup.startsAt,
          end: pickup.endsAt,
          allDay: false,
          organization: fundraiser.organization.name,
          locations: [pickup.location],
        });
      }
    }

    const buyingPeriod: CalendarEvent = {
      id: fundraiser.id,
      type: "buying",
      title: fundraiser.name,
      start: fundraiser.buyingStartsAt,
      end: fundraiser.buyingEndsAt,
      allDay: true,
      organization: fundraiser.organization.name,
      locations: [],
    };

    return [...pickupsByTime.values(), buyingPeriod];
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectedDateChange(date);
      setCurrentView(Views.WEEK);
    }
  };

  const selectedFundraiser = selectedFundraiserId
    ? fundraisers.find((fundraiser) => fundraiser.id === selectedFundraiserId)
    : undefined;

  const viewOptions: { label: string; value: View }[] = [
    { label: "Month", value: Views.MONTH },
    { label: "Week", value: Views.WEEK },
    { label: "Day", value: Views.DAY },
  ];

  const incrementSelect = (increment: boolean) => {
    if (currentView == Views.MONTH) {
      onSelectedDateChange(
        new Date(
          selectedDate.getFullYear(),
          increment ? selectedDate.getMonth() + 1 : selectedDate.getMonth() - 1,
          1,
        ),
      );
    } else if (currentView == Views.DAY) {
      onSelectedDateChange(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          increment ? selectedDate.getDate() + 1 : selectedDate.getDate() - 1,
        ),
      );
    } else if (currentView == Views.WEEK) {
      onSelectedDateChange(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          increment ? selectedDate.getDate() + 7 : selectedDate.getDate() - 7,
        ),
      );
    }
  };

  // checking if it's mobile
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);
    };

    checkScreen(); // run on mount

    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  useEffect(() => {
    setIsCalendarFiltersOpen(false);
  }, [currentView]);

  useEffect(() => {
    if (currentView === Views.MONTH) {
      setSelectedFundraiserId(null);
    }
  }, [currentView]);

  const calendarFilters = (
    <div className="flex flex-col gap-[20px] w-full">
      <SmallCalendar
        onSelected={onSelectedDateChange}
        date={selectedDate}
        handleDateSelect={(date) => {
          handleDateSelect(date);
          setIsCalendarFiltersOpen(false);
        }}
        forceVisible
        className="md:py-[12px]"
      />
    </div>
  );

  const selectedFundraiserColor = getOrganizationColor(
    selectedFundraiser
      ? organizationNames.indexOf(selectedFundraiser.organization.name)
      : -1,
  );

  const closeEventDetails = () => setSelectedFundraiserId(null);

  useEffect(() => {
    if (selectedFundraiserId && !selectedFundraiser) {
      setSelectedFundraiserId(null);
    }
  }, [selectedFundraiserId, selectedFundraiser]);

  const showEventDetails = currentView !== Views.MONTH && !!selectedFundraiser;

  return (
    <div className="size-full">
      <div
        className="flex flex-col gap-3 bg-white rounded-[8px] md:grid md:grid-cols-[200px_minmax(0,1fr)] md:grid-rows-[auto_1fr] md:gap-x-[19px] md:gap-y-6 md:shadow-[0_1px_4px_rgba(0,0,0,0.2)] md:pt-[19px] md:px-[30px] md:pb-[30px]"
      >
        <div className="flex items-center justify-between px-4 md:px-0 md:col-start-2 md:row-start-1">
          <div className="flex gap-[8px] items-center">
            <p className="font-semibold leading-[42px] text-[20px] md:text-[28px] text-black whitespace-nowrap">
              {moment(selectedDate).format("MMMM YYYY")}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => incrementSelect(false)}
                className="size-[16px] md:size-[24px] flex items-center justify-center rotate-90"
              >
                <ChevronDown className="size-[16px] md:size-[24px]" />
              </button>
              <button
                onClick={() => incrementSelect(true)}
                className="size-[16px] md:size-[24px] flex items-center justify-center -rotate-90"
              >
                <ChevronDown className="size-[16px] md:size-[24px]" />
              </button>
            </div>
            {isMobile && (
              <Sheet
                open={isCalendarFiltersOpen}
                onOpenChange={setIsCalendarFiltersOpen}
              >
                <button
                  type="button"
                  onClick={() => setIsCalendarFiltersOpen(true)}
                  className="flex size-10 items-center justify-center rounded-[8px] border border-[#dfdfdf] bg-white text-black transition-colors hover:bg-[#f7f7f7]"
                  aria-label="Open calendar filters"
                >
                  <CalendarDays className="size-[18px]" />
                </button>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[20px] px-4 pb-6 pt-8"
                >
                  <SheetHeader className="mb-4 text-left">
                    <SheetTitle>Calendar filters</SheetTitle>
                  </SheetHeader>
                  {calendarFilters}
                </SheetContent>
              </Sheet>
            )}
          </div>

          <div className="flex gap-3 relative">
            <Button
              type="button"
              onClick={() => {
                onSelectedDateChange(new Date(today));
                setCurrentView(Views.WEEK);
              }}
              className="text-xs h-8 md:text-[16px] md:h-10 bg-[#265B34] hover:bg-[#1f4a2b]"
            >
              Today
            </Button>
            <Select
              value={currentView}
              onValueChange={(value) => setCurrentView(value as View)}
            >
              <SelectTrigger className="gap-2 text-xs h-8 md:text-[16px] md:h-10 text-[#265B34] border border-[#265B34] rounded-[6px] bg-white cursor-pointer hover:bg-[#e6f0ea]">
                <SelectValue placeholder="Select view" />
              </SelectTrigger>
              <SelectContent>
                {viewOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          className="h-[630px] px-4 md:px-0 md:col-start-2 md:row-start-2"
        >
          <BigCalendar
            localizer={localizer}
            events={
              currentView === Views.MONTH
                ? events
                    .filter((event) => event.type === "pickup")
                    .map((event) => ({ ...event, end: event.start }))
                : events
            }
            startAccessor="start"
            endAccessor="end"
            view={currentView}
            onView={setCurrentView}
            date={selectedDate}
            onNavigate={onSelectedDateChange}
            onSelectEvent={(event, domEvent) => {
              if (currentView !== Views.MONTH) {
                selectedEventRef.current = domEvent.currentTarget as HTMLElement;
                setSelectedFundraiserId((event as CalendarEvent).id);
              }
            }}
            dayLayoutAlgorithm="overlap"
            eventPropGetter={(event) =>
              eventStyleGetter(event, organizationNames, currentView)
            }
            scrollToTime={SCROLL_TO_TIME}
            showMultiDayTimes
            popup
            style={{ height: "100%", overflow: "auto" }}
            views={[Views.MONTH, Views.WEEK, Views.DAY]}
            components={{
              toolbar: () => <></>,
              week: {
                header: CalendarDayHeader,
              },
              day: {
                header: CalendarDayHeader,
              },
              month: {
                dateHeader: CalendarMonthDateHeader,
              },
              event: ({ event }) => (
                <CalendarEventComponent
                  event={event}
                  currentView={currentView}
                  organizationNames={organizationNames}
                />
              ),
            }}
            formats={{
              timeGutterFormat: "h A",
              dateFormat: "D",
              eventTimeRangeFormat: () => "",
              eventTimeRangeStartFormat: () => "",
              eventTimeRangeEndFormat: () => "",
              dayRangeHeaderFormat: ({ start, end }) =>
                `${moment(start).format("MMM DD")} - ${moment(end).format("MMM DD")}`,
            }}
            className="my-calendar"
          />
        </div>

        <div className="flex flex-col items-center gap-[20px] w-full md:col-start-1 md:row-start-2">
          <SmallCalendar
            onSelected={onSelectedDateChange}
            date={selectedDate}
            handleDateSelect={(date) => handleDateSelect(date)}
          />
        </div>

        {showEventDetails && selectedFundraiser && isMobile && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-4 pt-24"
            onClick={closeEventDetails}
          >
            <div
              className="w-full max-w-[400px] mb-[50%]"
              onClick={(event) => event.stopPropagation()}
            >
              <EventDetailsCard
                fundraiser={selectedFundraiser}
                items={selectedFundraiser.items}
                color={selectedFundraiserColor}
                onClose={closeEventDetails}
              />
            </div>
          </div>
        )}
      </div>

      <Popover
        open={showEventDetails && !isMobile}
        onOpenChange={(open) => {
          if (!open) closeEventDetails();
        }}
      >
        <PopoverAnchor virtualRef={selectedEventRef} />
        {selectedFundraiser && (
          <PopoverContent
            side="left"
            align="start"
            sideOffset={8}
            collisionPadding={16}
            hideWhenDetached
            className="w-[400px] rounded-none border-0 bg-transparent p-0 shadow-none"
          >
            <EventDetailsCard
              fundraiser={selectedFundraiser}
              items={selectedFundraiser.items}
              color={selectedFundraiserColor}
              onClose={closeEventDetails}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
