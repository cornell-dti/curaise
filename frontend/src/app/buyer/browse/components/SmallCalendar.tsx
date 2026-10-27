"use client";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import moment from "moment";

export function SmallCalendar({
  onSelected,
  date,
  handleDateSelect,
  className,
  forceVisible = false,
}: {
  onSelected: (date: Date) => void;
  date: Date;
  handleDateSelect: (date: Date | undefined) => void;
  className?: string;
  forceVisible?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full bg-white rounded-[6px] border border-[#dfdfdf] py-[16px] md:rounded-[5px] md:py-[13px]",
        forceVisible ? "block" : "hidden md:block",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2 px-[16px] md:mb-[3px] md:px-[13px]">
        <p className="leading-[21px] text-[14px] text-black md:text-[13px] md:leading-[23px]">
          {moment(date).format("MMMM YYYY")}
        </p>
        <div className="flex items-center">
          <button
            onClick={() => {
              onSelected(
                new Date(
                  date.getFullYear(),
                  date.getMonth() - 1,
                  1,
                ),
              );
            }}
            className="size-[18px] flex items-center justify-center md:size-[16px]"
          >
            <ChevronLeft className="size-[18px] md:size-[13px]" />
          </button>
          <button
            onClick={() => {
              onSelected(
                new Date(
                  date.getFullYear(),
                  date.getMonth() + 1,
                  1,
                ),
              );
            }}
            className="size-[18px] flex items-center justify-center md:size-[16px]"
          >
            <ChevronRight className="size-[18px] md:size-[13px]" />
          </button>
        </div>
      </div>
      <Calendar
        required
        mode="single"
        selected={date}
        onSelect={(date) => {
          if (date) {
            handleDateSelect(date);
          }
        }}
        className="w-full px-[16px] py-0 md:px-[13px]"
        month={date}
        hideNavigation
        formatters={{
          formatWeekdayName: (day) =>
            day.toLocaleDateString("en-US", { weekday: "narrow" }),
        }}
        classNames={{
          weekdays: "flex justify-between",
          weekday:
            "w-[25px] select-none text-center text-[0.8rem] font-normal text-[#989898] md:w-[20px] md:text-[11px] md:leading-[16px]",
          week: "mt-1 flex w-full justify-between md:mt-[3px]",
          day: "relative size-[25px] select-none p-0 text-center [&_button]:size-[25px] [&_button]:min-w-0 [&_button]:aspect-auto md:size-[20px] md:[&_button]:size-[20px] md:[&_button]:text-[11px] md:[&_button]:rounded-[5px]",
          selected:
            "[&_button[data-selected-single=true]]:bg-[#568165] [&_button[data-selected-single=true]]:text-white",
        }}
        components={{
          Chevron: () => <></>,
          MonthCaption: () => <></>,
        }}
      />
    </div>
  );
}
