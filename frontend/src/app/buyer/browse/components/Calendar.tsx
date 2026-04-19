"use client";
import { useState } from "react";
import {
  Calendar as BigCalendar,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import moment from "moment";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  events,
  OrganizationFilter,
  organizations,
} from "./OrganizationFilter";
import { Calendar } from "@/components/ui/calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2026, 3, 12));
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [selectedOrganizations, setSelectedOrganizations] =
    useState<string[]>(organizations);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCurrentView(Views.DAY);
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

  const organizationColors: Record<string, string> = {
    "Cornell Data Science": "#f74545",
    DCC: "#6a9f48",
    "Digital Tech & Innovation": "#3197f7",
    CUxD: "#ffffff",
  };

  const eventStyleGetter = (event: any) => {
    const backgroundColor = event.organization
      ? organizationColors[event.organization]
      : "#3174ad";
    return {
      style: {
        backgroundColor,
        opacity: 0.8,
        color: event.organization === "CUxD" ? "black" : "white",
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

  return (
    <div className="bg-white size-full">
      <div className="flex py-[20px] gap-[40px]">
        <div className="flex flex-col gap-[20px] w-[255px]">
          <div className="bg-white rounded-[6px] border border-[#dfdfdf] p-[16px]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[21px] text-[14px] text-black">
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
                  className="size-[18px] flex items-center justify-center"
                >
                  <ChevronLeft className="size-[18px]" />
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
                  className="size-[18px] flex items-center justify-center"
                >
                  <ChevronRight className="size-[18px]" />
                </button>
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="w-full"
              components={{
                Chevron: () => <div className="hidden"></div>,
                CaptionLabel: () => <></>,
              }}
            />
          </div>

          <OrganizationFilter
            selectedOrganizations={selectedOrganizations}
            onToggleOrganization={handleToggleOrganization}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-[8px] items-center">
              <p className="font-['DM_Sans:SemiBold',sans-serif] font-semibold leading-[42px] text-[28px] text-black whitespace-nowrap">
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

            <div className="relative">
              <select
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as View)}
                className="appearance-none font-['DM_Sans:Regular',sans-serif] font-normal text-[16px] text-[#3c5243] px-[16px] py-[8px] pr-[40px] border border-[#3c5243] rounded-[6px] bg-white cursor-pointer"
              >
                {viewOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-[20px] pointer-events-none text-[#3c5243]" />
            </div>
          </div>

          <div
            className="bg-white rounded-[8px] border border-[#ddd] p-4"
            style={{ height: "700px" }}
          >
            <BigCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={setCurrentView}
              date={selectedDate}
              onNavigate={setSelectedDate}
              eventPropGetter={eventStyleGetter}
              style={{ height: "100%" }}
              views={[Views.MONTH, Views.WEEK, Views.DAY]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
