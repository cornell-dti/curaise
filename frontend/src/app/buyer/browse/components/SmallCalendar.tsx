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
        "w-full bg-white rounded-[6px] border border-[#dfdfdf] py-[16px]",
        forceVisible ? "block" : "hidden md:block",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-2 px-[16px]">
        <p className="leading-[21px] text-[14px] text-black">
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
            className="size-[18px] flex items-center justify-center"
          >
            <ChevronLeft className="size-[18px]" />
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
            className="size-[18px] flex items-center justify-center"
          >
            <ChevronRight className="size-[18px]" />
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
        className="w-full px-[16px] py-0"
        month={date}
        hideNavigation
        formatters={{
          formatWeekdayName: (day) =>
            day.toLocaleDateString("en-US", { weekday: "narrow" }),
        }}
        classNames={{
          weekdays: "flex justify-between",
          weekday:
            "w-[25px] select-none text-center text-[0.8rem] font-normal text-[#989898]",
          week: "mt-1 flex w-full justify-between",
          day: "relative size-[25px] select-none p-0 text-center [&_button]:size-[25px] [&_button]:min-w-0 [&_button]:aspect-auto",
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
