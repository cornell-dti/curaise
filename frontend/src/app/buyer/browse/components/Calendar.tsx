"use client";
import { useState } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import { ChevronDown } from "lucide-react";
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

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  organization: string;
  id: string;
}

type Organization = z.infer<typeof BasicOrganizationSchema>;

const localizer = momentLocalizer(moment);

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
  const router = useRouter();

  const events: CalendarEvent[] = fundraisers.flatMap((fundraiser) => {
    const pickups: CalendarEvent[] = fundraiser.pickupEvents.map((pickup) => ({
      title: fundraiser.name + " Pick Up",
      allDay: false,
      start: pickup.startsAt,
      end: pickup.endsAt,
      organization: fundraiser.organization.name,
      id: fundraiser.id,
    }));

    const buyingPeriod: CalendarEvent = {
      title: fundraiser.name + " Buying Period",
      allDay: true,
      start: fundraiser.buyingStartsAt,
      end: fundraiser.buyingEndsAt,
      organization: fundraiser.organization.name,
      id: fundraiser.id,
    };

    return [...pickups, buyingPeriod];
  });

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCurrentView(Views.WEEK);
    }
  };

  const handleToggleOrganization = (org: string) => {
    if (
      !selectedOrganizations.includes(org) &&
      selectedOrganizations.length == 3
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

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.organization
      ? organizationColors[organizationNames.indexOf(event.organization)]
      : "#3174ad";
    return {
      style: {
        backgroundColor,
        opacity: 0.8,
        border: event.organization === "CUxD" ? "#ddd" : backgroundColor,
        borderRadius: "2px",
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

  return (
    <div className="bg-white size-full md:px-10">
      <div className="flex mdpy-[20px] gap-[40px]">
        <div className="hidden md:flex flex-col items-center gap-[20px] w-[275px]">
          <SmallCalendar
            onSelected={setSelectedDate}
            date={selectedDate}
            handleDateSelect={(date) => handleDateSelect(date)}
          />
          <OrganizationFilter
            organizations={organizationNames}
            selectedOrganizations={selectedOrganizations}
            onToggleOrganization={handleToggleOrganization}
          />
        </div>

        <div className="flex-1">
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
              onSelectEvent={(event) => {
                router.push(`/buyer/fundraiser/${event.id}`);
              }}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={selectedDate}
              onNavigate={setSelectedDate}
              dayPropGetter={dayStyleGetter}
              dayLayoutAlgorithm="no-overlap"
              eventPropGetter={eventStyleGetter}
              style={{ height: "90%" }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              components={{
                toolbar: () => <></>,
                event: ({ event }) => (
                  <div
                    style={{
                      fontSize: "12px",
                      lineHeight: "1.1",
                    }}
                  >
                    {event.title}
                  </div>
                ),
              }}
              className="my-calendar"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
