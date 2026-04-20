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
import {
  events,
  OrganizationFilter,
  organizations,
} from "./OrganizationFilter";
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

export interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  organization?: string;
}

const localizer = momentLocalizer(moment);

export function CalendarPage({
  organizations,
  fundraisers,
}: {
  organizations: z.infer<typeof BasicOrganizationSchema>[];
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(today));
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [selectedOrganizations, setSelectedOrganizations] =
    useState<string[]>(organizations);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCurrentView(Views.WEEK);
    }
  };

  const handleToggleOrganization = (org: string) => {
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
      ? organizationColors[organizations.indexOf(event.organization)]
      : "#3174ad";
    return {
      style: {
        backgroundColor,
        opacity: 0.8,
        border:
          "1px solid " +
          (event.organization === "CUxD" ? "#ddd" : backgroundColor),
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

  return (
    <div className="bg-white size-full">
      <div className="flex py-[20px] gap-[40px]">
        <div className="flex flex-col items-center gap-[20px] w-[275px]">
          <SmallCalendar
            onSelected={setSelectedDate}
            date={selectedDate}
            handleDateSelect={(date) => handleDateSelect(date)}
          />
          <OrganizationFilter
            selectedOrganizations={selectedOrganizations}
            onToggleOrganization={handleToggleOrganization}
          />
        </div>

        <div className="flex-1">
          <div
            className="bg-white rounded-[8px] border border-[#ddd] p-4"
            style={{ height: "700px" }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex gap-[8px] items-center">
                <p className="font-semibold leading-[42px] text-[28px] text-black whitespace-nowrap">
                  {moment(selectedDate).format("MMMM YYYY")}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="size-[24px] flex items-center justify-center rotate-90"
                  >
                    <ChevronDown className="size-[24px]" />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedDate(
                        new Date(
                          selectedDate.getFullYear(),
                          selectedDate.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="size-[24px] flex items-center justify-center -rotate-90"
                  >
                    <ChevronDown className="size-[24px]" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 relative">
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedDate(new Date(today));
                    setCurrentView(Views.WEEK);
                  }}
                  className="text-[16px] h-10 bg-[#265B34] hover:bg-[#1f4a2b]"
                >
                  Today
                </Button>
                <Select
                  value={currentView}
                  onValueChange={(value) => setCurrentView(value as View)}
                >
                  <SelectTrigger className="gap-2 text-[16px] text-[#265B34] border border-[#265B34] rounded-[6px] bg-white cursor-pointer hover:bg-[#e6f0ea]">
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
              dayPropGetter={dayStyleGetter}
              eventPropGetter={eventStyleGetter}
              style={{ height: "90%" }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
              components={{
                toolbar: () => <></>,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
