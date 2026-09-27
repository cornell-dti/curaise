"use client";

import { useMemo, useState } from "react";
import { z } from "zod";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import { cn } from "@/lib/utils";
import { CalendarView } from "./CalendarView";
import { FilterBar } from "./FilterBar";
import { GridView } from "./GridView";
import {
  filterFundraisers,
  type CategoryType,
  type FilterType,
} from "./browse-utils";

type BrowseViewType = "grid" | "calendar";
type Organization = z.infer<typeof BasicOrganizationSchema>;
type Fundraiser = z.infer<typeof BasicFundraiserSchema>;
type FundraiserWithItems = Fundraiser & {
  items: z.infer<typeof CompleteItemSchema>[];
};

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 3h4v4H3zM10 3h4v4h-4zM17 3h4v4h-4zM3 10h4v4H3zM10 10h4v4h-4zM17 10h4v4h-4zM3 17h4v4H3zM10 17h4v4h-4zM17 17h4v4h-4z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="18" rx="4" />
      <path d="M8 2v4M16 2v4M2 10h20" />
    </svg>
  );
}

const viewOptions = [
  { value: "grid", label: "Grid view", icon: GridIcon },
  { value: "calendar", label: "Calendar view", icon: CalendarIcon },
] as const;

export function BrowseView({
  organizations,
  userOrganizations,
  fundraisers,
  fundraisersWithItems,
  searchQuery,
}: {
  organizations: Organization[];
  userOrganizations: Organization[];
  fundraisers: Fundraiser[];
  fundraisersWithItems: FundraiserWithItems[];
  searchQuery: string;
}) {
  const [view, setView] = useState<BrowseViewType>("grid");
  const [filter, setFilter] = useState<FilterType>("all");
  const [category, setCategory] = useState<CategoryType>("all");

  const filteredFundraisers = useMemo(
    () => filterFundraisers(fundraisers, { searchQuery, filter }),
    [fundraisers, searchQuery, filter],
  );
  const filteredFundraisersWithItems = useMemo(
    () => filterFundraisers(fundraisersWithItems, { searchQuery, filter }),
    [fundraisersWithItems, searchQuery, filter],
  );

  return (
    <div className="px-4 md:px-[157px]">
      <div className="flex items-center justify-between py-4 md:py-10">
        <h1 className="text-[28px] md:text-[32px] font-semibold text-black">
          Browse CURaise
        </h1>
        <div
          role="group"
          aria-label="Browse view"
          className="flex overflow-hidden rounded-[4px] border-[1.36px] border-[#265B34]"
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
      <div className="flex flex-col gap-6">
        <FilterBar
          onFilterChange={setFilter}
          category={category}
          onCategoryChange={setCategory}
        />
        {view === "calendar" ? (
          <div className="pb-10 md:pb-[53px]">
            <CalendarView
              organizations={organizations}
              userOrganizations={userOrganizations}
              fundraisers={filteredFundraisersWithItems}
            />
          </div>
        ) : (
          <div className="pb-10">
            <GridView fundraisers={filteredFundraisers} filter={filter} />
          </div>
        )}
      </div>
    </div>
  );
}
