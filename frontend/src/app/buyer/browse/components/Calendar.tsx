"use client";
import { useEffect, useState } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import { ChevronDown, Clock3, MapPin } from "lucide-react";
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
import { organizationColors } from "./utils";
import { z } from "zod";
import { BasicFundraiserSchema, BasicOrganizationSchema } from "common";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

const localizer = momentLocalizer(moment);
const MOBILE_BREAKPOINT = 768;

export function CalendarPage({
  organizations,
  userOrganizations,
  fundraisers,
}: {
  organizations: z.infer<typeof BasicOrganizationSchema>[];
  userOrganizations: Organization[];
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
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
  const router = useRouter();

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
        ? selectedOrganizations.length == 1
        : selectedOrganizations.length == 3)
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

  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.organization
      ? organizationColors[organizationNames.indexOf(event.organization)]
      : "#3174ad";

    const isMonthPickup = currentView === Views.MONTH && isPickupEvent(event);

    return {
      className: isMonthPickup ? "calendar-month-pickup-event" : undefined,
      style: {
        backgroundColor: isMonthPickup
          ? "transparent"
          : `color-mix(in srgb, ${backgroundColor} 80%, white)`,
        opacity: 1,
        border: isMonthPickup
          ? "none"
          : currentView !== Views.MONTH
            ? `2px solid ${backgroundColor}`
            : `none`,
        borderRadius: currentView !== Views.MONTH ? "6px" : "2px",
        boxShadow: isMonthPickup ? "none" : undefined,
      },
    };
  };

  const viewOptions: { label: string; value: View }[] = [
    { label: "Month", value: Views.MONTH },
    { label: "Week", value: Views.WEEK },
    { label: "Day", value: Views.DAY },
  ];

  // for highlighting the day that is selected
  const dayStyleGetter = (date: Date) => {
    const isSelected = moment(date).isSame(selectedDate, "day");

    if (isSelected) {
      return {
        style: {
          backgroundColor: "#e6f0ea",
        },
        className: "selected-calendar-day",
      };
    }

    return {};
  };

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
      setSelectedOrganizations([selectedOrganizations[0]]);
    }
  }, [isMobile]);

  return (
    <div className="bg-white size-full md:px-10">
      <div className="flex flex-col-reverse items-center md:flex-row md:py-[20px] gap-[20px] md:gap-[40px]">
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
          />
        </div>

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
              dayLayoutAlgorithm={wideOverlapDayLayout}
              eventPropGetter={eventStyleGetter}
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
                  <div
                    // onMouseEnter={(e) =>
                    //   handleEventMouseEnter(event as CalendarEvent, e)
                    // }
                    // onMouseLeave={handleEventMouseLeave}
                    style={{
                      fontSize: "12px",
                      lineHeight: "1.2",
                      fontFamily: "DM Sans, sans-serif",
                      cursor: "pointer",
                    }}
                  >
                    {currentView === Views.MONTH && isPickupEvent(event) ? (
                      <div className="flex items-center gap-1 pl-1">
                        <span
                          className="block h-2 w-2 shrink-0"
                          style={{
                            backgroundColor:
                              organizationColors[
                                organizationNames.indexOf(event.organization)
                              ] ?? "#3174ad",
                          }}
                        />
                        <span className="truncate font-medium text-black">
                          {moment(event.start).format("h:mm A")}{" "}
                          <span className="font-normal">{event.title}</span>
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            fontWeight:
                              currentView !== Views.MONTH ? "700" : "600",
                            fontSize:
                              currentView == Views.DAY ? "16px" : "12px",
                          }}
                        >
                          {event.title}
                        </div>
                        {currentView !== Views.MONTH &&
                          event.title.includes("Pick Up") && (
                            <div className="flex flex-col py-1 gap-1">
                              <div
                                style={{
                                  fontSize:
                                    currentView == Views.DAY ? "14px" : "10px",
                                  opacity: 0.9,
                                }}
                              >
                                {event.organization}
                              </div>
                              <div
                                className={cn(
                                  "flex gap-1",
                                  currentView == Views.DAY
                                    ? "text-[14px]"
                                    : "text-[10px]",
                                )}
                              >
                                <MapPin
                                  className={cn(
                                    currentView == Views.DAY
                                      ? "h-4 w-4"
                                      : "h-3 w-3",
                                  )}
                                />{" "}
                                {event.location}
                              </div>
                              <div
                                className={cn(
                                  "flex gap-1",
                                  currentView == Views.DAY
                                    ? "text-[14px]"
                                    : "text-[10px]",
                                )}
                              >
                                <Clock3
                                  className={cn(
                                    currentView == Views.DAY
                                      ? "h-4 w-4"
                                      : "h-3 w-3",
                                  )}
                                />
                                {moment(event.start).format("h:mm A")} -{" "}
                                {moment(event.end).format("h:mm A")}
                              </div>
                            </div>
                          )}
                      </>
                    )}
                  </div>
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
      </div>
    </div>
  );
}
