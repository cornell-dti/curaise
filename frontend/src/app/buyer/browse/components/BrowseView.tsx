"use client";

import { useContext, useMemo, useState } from "react";
import { startOfToday } from "date-fns";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { cn } from "@/lib/utils";
import { CalendarIcon, GridIcon } from "./BrowseIcons";
import { CalendarView } from "./CalendarView";
import { FilterBar } from "./FilterBar";
import { GridView } from "./GridView";
import {
  emptyFilters,
  filterFundraisers,
  type Organization,
  type Filters,
} from "./browse-utils";

import { BrowseViewContext } from "./BrowseViewContext";
type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

const viewOptions = [
  { value: "grid", label: "Grid view", icon: GridIcon },
  { value: "calendar", label: "Calendar view", icon: CalendarIcon },
] as const;

export function BrowseView({
  organizations,
  fundraisers,
  searchQuery,
}: {
  organizations: Organization[];
  fundraisers: Fundraiser[];
  searchQuery: string;
}) {
  const { view, setView } = useContext(BrowseViewContext);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday);

  const filteredFundraisers = useMemo(
    () => filterFundraisers(fundraisers, searchQuery, filters),
    [fundraisers, searchQuery, filters],
  );
  const filteredCalendarFundraisers = useMemo(
    () =>
      filterFundraisers(fundraisers, searchQuery, filters, {
        includeEnded: true,
      }),
    [fundraisers, searchQuery, filters],
  );

  const hasActiveFilters =
    filters.organizations.length > 0 || filters.categories.length > 0;
  const isFiltered = hasActiveFilters || searchQuery !== "";

  return (
    <div className={cn("px-4 md:px-[157px]", view === "calendar" && "px-0 max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col")}>
      <div className={cn("flex flex-col gap-3 pb-6 md:gap-0", view === "calendar" && "hidden md:flex")}>
        <div className="hidden md:flex items-center justify-between md:py-10">
          <h1 className="text-[28px] md:text-[32px] font-semibold text-black">
            Browse CURaise
          </h1>
          <div
            role="group"
            aria-label="Browse view"
            className="hidden md:flex overflow-hidden rounded-[4px] border-[1.36px] border-[#265B34]"
          >
            {viewOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                aria-label={label}
                aria-pressed={view === value}
                className={cn(
                  "flex h-8 w-[42px] md:h-10 md:w-[52px] items-center justify-center transition-colors",
                  view === value
                    ? "bg-[#265B34] text-white"
                    : "bg-white text-[#265B34] hover:bg-[#e6f0ea]",
                )}
              >
                <Icon className="size-5 md:size-6" />
              </button>
            ))}
          </div>
        </div>
        <div className={cn(view === "calendar" && "hidden md:block")}>
          <FilterBar
            organizations={organizations}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>
      </div>
      <div className={cn("flex flex-col gap-6", view === "calendar" && "max-md:min-h-0 max-md:flex-1")}>
        {view === "calendar" ? (
          <div className="max-md:flex max-md:min-h-0 max-md:flex-1 max-md:flex-col md:pb-[53px]">
            {isFiltered && filteredCalendarFundraisers.length === 0 && (
              <div className="mb-3 rounded-[6px] border-[0.5px] border-[#BABABA] bg-white px-3 py-2">
                <p className="text-[14px] leading-[21px] text-black">
                  No events match your filters
                </p>
              </div>
            )}
            <CalendarView
              organizations={organizations}
              fundraisers={filteredCalendarFundraisers}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
            />
          </div>
        ) : (
          <div className="pb-10">
            <GridView
              fundraisers={filteredFundraisers}
              isFiltered={isFiltered}
            />
          </div>
        )}
      </div>
    </div>
  );
}
