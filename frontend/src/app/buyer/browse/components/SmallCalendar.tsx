"use client";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";
import { useState } from "react";

export function SmallCalendar({
  onSelected,
  date,
  handleDateSelect,
}: {
  onSelected: (date: Date) => void;
  date: Date;
  handleDateSelect: (date: Date | undefined) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  return (
    <div className="w-full bg-white rounded-[6px] border border-[#dfdfdf] md:py-[16px]">
      <div className="flex items-center justify-center mb-2">
        <div className="flex gap-1 justify-center items-center">
          <button
            onClick={() => {
              onSelected(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() - 1,
                  1,
                ),
              );
              setSelectedDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() - 1,
                  1,
                ),
              );
            }}
            className="size-[18px] flex items-center justify-center"
          >
            <ChevronLeft className="size-[18px]" />
          </button>
          <p className="leading-[21px] text-[14px] text-black text-center w-[120px]">
            {moment(selectedDate).format("MMMM YYYY")}
          </p>
          <button
            onClick={() => {
              onSelected(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() + 1,
                  1,
                ),
              );
              setSelectedDate(
                new Date(
                  selectedDate.getFullYear(),
                  selectedDate.getMonth() + 1,
                  1,
                ),
              );
            }}
            className="size-[18px] flex items-center justify-center"
          >
            <ChevronRight className="size-[18px]" />
          </button>
        </div>
      </div>
      <Calendar
        required
        mode="single"
        selected={selectedDate}
        onSelect={(date) => {
          if (date) {
            setSelectedDate(date);
            handleDateSelect(date);
          }
        }}
        className="w-full px-[16px]"
        month={selectedDate}
        components={{
          Chevron: () => <></>,
          MonthCaption: () => <></>,
        }}
      />
    </div>
  );
}
