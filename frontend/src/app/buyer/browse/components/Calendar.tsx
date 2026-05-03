"use client";
import { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import { CalendarDays, ChevronDown, Clock3, MapPin, X } from "lucide-react";
import { OrganizationFilter } from "./OrganizationFilter";
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
import { z } from "zod";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FundraiserSideCard } from "./SideCard";
import {
  CalendarEventComponent,
  eventStyleGetter,
  organizationColors,
} from "./calendar-utils";

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  organization: string;
  id: string;
  location: string;
}

const isPickupEvent = (event: CalendarEvent) => event.title.includes("Pick Up");

function wideOverlapDayLayout({
  events,
  accessors,
  slotMetrics,
}: {
  events: CalendarEvent[];
  accessors: {
    start: (event: CalendarEvent) => Date;
    end: (event: CalendarEvent) => Date;
  };
  slotMetrics: {
    getRange: (
      start: Date,
      end: Date,
    ) => {
      top: number;
      height: number;
    };
  };
}) {
  const positionedEvents = events
    .map((event) => {
      const start = accessors.start(event);
      const end = accessors.end(event);
      const { top, height } = slotMetrics.getRange(start, end);

      return {
        event,
        startMs: start.getTime(),
        endMs: end.getTime(),
        top,
        height,
      };
    })
    .sort((a, b) => a.startMs - b.startMs || b.endMs - a.endMs);

  const overlapGroups: (typeof positionedEvents)[] = [];

  for (const event of positionedEvents) {
    const currentGroup = overlapGroups.at(-1);

    if (!currentGroup) {
      overlapGroups.push([event]);
      continue;
    }

    const currentGroupEnd = Math.max(
      ...currentGroup.map((groupEvent) => groupEvent.endMs),
    );

    if (event.startMs < currentGroupEnd) {
      currentGroup.push(event);
    } else {
      overlapGroups.push([event]);
    }
  }

  return overlapGroups.flatMap((group) => {
    const width = group.length === 1 ? 100 : 88;
    const maxOffset = Math.max(0, 100 - width);
    const step =
      group.length <= 1 ? 0 : Math.min(10, maxOffset / (group.length - 1));

    return group.map((item, index) => ({
      event: item.event,
      style: {
        top: item.top,
        height: item.height,
        width,
        xOffset: Math.min(index * step, maxOffset),
      },
    }));
  });
}

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

type Organization = z.infer<typeof BasicOrganizationSchema>;
type FundraiserWithItems = z.infer<typeof BasicFundraiserSchema> & {
  items: z.infer<typeof CompleteItemSchema>[];
};

const localizer = momentLocalizer(moment);
const MOBILE_BREAKPOINT = 768;

export function CalendarPage({
  organizations,
  userOrganizations,
  fundraisers,
}: {
  organizations: z.infer<typeof BasicOrganizationSchema>[];
  userOrganizations: Organization[];
  fundraisers: FundraiserWithItems[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);

  const organizationNames = organizations.map((org) => org.name);
  const authorizedUserOrganizations = userOrganizations.filter(
    (org) => org.authorized,
  );
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>(
    authorizedUserOrganizations.map((org) => org.name),
  );
  const [isMobile, setIsMobile] = useState(false);
  const [isCalendarFiltersOpen, setIsCalendarFiltersOpen] = useState(false);
  const [selectedFundraiserId, setSelectedFundraiserId] = useState<
    string | null
  >(null);

  const events: CalendarEvent[] = fundraisers.flatMap((fundraiser) => {
    const pickups: CalendarEvent[] = fundraiser.pickupEvents.map((pickup) => ({
      title: fundraiser.name + " Pick Up",
      allDay: false,
      start: pickup.startsAt,
      end: pickup.endsAt,
      organization: fundraiser.organization.name,
      id: fundraiser.id,
      location: pickup.location,
    }));

    const buyingPeriod: CalendarEvent = {
      title: fundraiser.name + " Buying Period",
      allDay: true,
      start: fundraiser.buyingStartsAt,
      end: fundraiser.buyingEndsAt,
      organization: fundraiser.organization.name,
      id: fundraiser.id,
      location: "",
    };

    return [...pickups, buyingPeriod];
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCurrentView(Views.WEEK);
    }
  };

  const handleToggleOrganization = (isMobile: boolean, org: string) => {
    if (
      !selectedOrganizations.includes(org) &&
      (isMobile
        ? selectedOrganizations.length == 3
        : selectedOrganizations.length == 5)
    ) {
      const firstOrg = selectedOrganizations.at(0);
      setSelectedOrganizations((prev) => prev.filter((o) => o !== firstOrg));
    }
    setSelectedOrganizations((prev) =>
      prev.includes(org) ? prev.filter((o) => o !== org) : [...prev, org],
    );
  };

  const filteredEvents = events.filter(
    (event) =>
      !event.organization || selectedOrganizations.includes(event.organization),
  );
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
      setSelectedDate(
        new Date(
          selectedDate.getFullYear(),
          increment ? selectedDate.getMonth() + 1 : selectedDate.getMonth() - 1,
          1,
        ),
      );
    } else if (currentView == Views.DAY) {
      setSelectedDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          increment ? selectedDate.getDate() + 1 : selectedDate.getDate() - 1,
        ),
      );
    } else if (currentView == Views.WEEK) {
      setSelectedDate(
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

  // updating the selected based on if it's mobile
  useEffect(() => {
    if (isMobile) {
      if (selectedOrganizations.length == 4) {
        setSelectedOrganizations((prev) => prev.filter((o) => o !== prev[0]));
      } else if (selectedOrganizations.length == 5) {
        setSelectedOrganizations((prev) =>
          prev.filter((o) => o !== prev[0] && o !== prev[1]),
        );
      }
    }
  }, [isMobile]);

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
        onSelected={setSelectedDate}
        date={selectedDate}
        handleDateSelect={(date) => {
          handleDateSelect(date);
          setIsCalendarFiltersOpen(false);
        }}
        forceVisible
        className="md:py-[12px]"
      />
      <OrganizationFilter
        organizations={organizationNames}
        selectedOrganizations={selectedOrganizations}
        onToggleOrganization={(org) => handleToggleOrganization(isMobile, org)}
        isMobile={isMobile}
        forceVisible
      />
    </div>
  );

  return (
    <div className="bg-white size-full md:px-10">
      <div className="flex flex-col-reverse items-center md:flex-row md:py-[20px] gap-[20px] md:gap-[40px]">
        {currentView === Views.MONTH && (
          <div className="flex flex-col items-center gap-[20px] w-full md:w-[275px]">
            <SmallCalendar
              onSelected={setSelectedDate}
              date={selectedDate}
              handleDateSelect={(date) => handleDateSelect(date)}
            />
            <OrganizationFilter
              organizations={organizationNames}
              selectedOrganizations={selectedOrganizations}
              onToggleOrganization={(org) =>
                handleToggleOrganization(isMobile, org)
              }
              isMobile={isMobile}
            />
          </div>
        )}

        <div
          className={cn(
            "w-full",
            currentView !== Views.MONTH && selectedFundraiser && !isMobile
              ? "flex flex-col gap-4 md:flex-row md:items-start"
              : "flex-1",
          )}
        >
          <div className="flex-1 w-full">
            <div
              className="bg-white rounded-[8px] md:border border-[#ddd] px-4 md:p-8"
              style={{ height: "700px" }}
            >
              <div className="flex items-center justify-between mb-3 md:mb-6">
                <div className="flex gap-[8px] items-center">
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
                  {isMobile ? (
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
                  ) : (
                    <div>
                      {" "}
                      {currentView !== Views.MONTH && (
                        <Popover
                          open={isCalendarFiltersOpen}
                          onOpenChange={setIsCalendarFiltersOpen}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="flex size-10 items-center justify-center rounded-[8px] border border-[#dfdfdf] bg-white text-black transition-colors hover:bg-[#f7f7f7]"
                              aria-label="Open calendar filters"
                            >
                              <CalendarDays className="size-[18px]" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            align="start"
                            side="bottom"
                            sideOffset={12}
                            className="w-[320px] rounded-[12px] border border-[#dfdfdf] bg-[#fafafa] p-3"
                          >
                            {calendarFilters}
                          </PopoverContent>
                        </Popover>
                      )}{" "}
                    </div>
                  )}
                  <p className="font-semibold leading-[42px] text-[20px] md:text-[28px] text-black whitespace-nowrap">
                    {moment(selectedDate).format("MMMM YYYY")}
                  </p>
                </div>

                <div className="flex gap-3 relative">
                  <Button
                    type="button"
                    onClick={() => {
                      setSelectedDate(new Date(today));
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

              <BigCalendar
                localizer={localizer}
                events={filteredEvents}
                startAccessor="start"
                endAccessor="end"
                view={currentView}
                onView={setCurrentView}
                date={selectedDate}
                onNavigate={setSelectedDate}
                onSelectEvent={(event) => {
                  if (currentView !== Views.MONTH) {
                    setSelectedFundraiserId((event as CalendarEvent).id);
                  }
                }}
                dayLayoutAlgorithm={wideOverlapDayLayout}
                eventPropGetter={(event) =>
                  eventStyleGetter(
                    event,
                    organizationNames,
                    currentView,
                    isPickupEvent(event),
                  )
                }
                popup
                style={{ height: "90%", overflow: "auto" }}
                views={[Views.MONTH, Views.WEEK, Views.DAY]}
                components={{
                  toolbar: () => <></>,
                  week: {
                    header: CalendarDayHeader,
                  },
                  day: {
                    header: CalendarDayHeader,
                  },
                  event: ({ event }) => (
                    <CalendarEventComponent
                      event={event}
                      currentView={currentView}
                      organizationNames={organizationNames}
                      isPickupEvent={isPickupEvent(event)}
                    />
                  ),
                }}
                formats={{
                  timeGutterFormat: "h A",
                  eventTimeRangeFormat: () => "",
                  dayRangeHeaderFormat: ({ start, end }) =>
                    `${moment(start).format("MMM DD")} - ${moment(end).format("MMM DD")}`,
                }}
                className="my-calendar"
              />
            </div>
          </div>
          {currentView !== Views.MONTH && selectedFundraiser && !isMobile && (
            <div className="w-full px-4 md:px-0 md:w-[180px] shrink-0">
              <FundraiserSideCard
                fundraiser={selectedFundraiser}
                items={selectedFundraiser.items}
                bgColor={`color-mix(in srgb, ${
                  organizationColors[
                    organizationNames.indexOf(
                      selectedFundraiser.organization.name,
                    )
                  ] ?? "#3174ad"
                } 70%, white)`}
                borderColor={
                  organizationColors[
                    organizationNames.indexOf(
                      selectedFundraiser.organization.name,
                    )
                  ] ?? "#3174ad"
                }
              />
            </div>
          )}
        </div>
        {currentView !== Views.MONTH && selectedFundraiser && isMobile && (
          <div
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-4 pt-24 rounded-md"
            onClick={() => setSelectedFundraiserId(null)}
          >
            <div
              className="relative w-full max-w-[360px] rounded-md mb-[50%]"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedFundraiserId(null)}
                className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-white/90 text-black shadow-sm"
                aria-label="Close fundraiser details"
              >
                <X className="size-4" />
              </button>
              <FundraiserSideCard
                fundraiser={selectedFundraiser}
                items={selectedFundraiser.items}
                bgColor={`color-mix(in srgb, ${
                  organizationColors[
                    organizationNames.indexOf(
                      selectedFundraiser.organization.name,
                    )
                  ] ?? "#3174ad"
                } 70%, white)`}
                borderColor={
                  organizationColors[
                    organizationNames.indexOf(
                      selectedFundraiser.organization.name,
                    )
                  ] ?? "#3174ad"
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
