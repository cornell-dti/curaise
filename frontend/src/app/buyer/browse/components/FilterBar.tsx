"use client";

import { useState } from "react";
import {
  Lollipop,
  Hamburger,
  Scissors,
  CupSoda,
  ChevronDown,
  Search,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { organizationColors } from "./calendar-utils";
import type { CategoryType, Filters, Organization } from "./browse-utils";
import { emptyFilters, toggleFilter } from "./browse-utils";

const VISIBLE_CLUB_COUNT = 5;

const categories = [
  { id: "desserts" as CategoryType, label: "Desserts", icon: Lollipop },
  { id: "food" as CategoryType, label: "Food", icon: Hamburger },
  { id: "drinks" as CategoryType, label: "Drinks", icon: CupSoda },
  { id: "crafts" as CategoryType, label: "Crafts", icon: Scissors },
];

export function FilterBar({
  organizations,
  filters,
  onFiltersChange,
}: {
  organizations: Organization[];
  filters: Filters;
  onFiltersChange: (newFilters: Filters) => void;
}) {
  const [sortOpen, setSortOpen] = useState(false);
  const [clubSearch, setClubSearch] = useState("");
  const [showAllClubs, setShowAllClubs] = useState(false);

  const isSearching = clubSearch.trim() !== "";
  const matchingClubs = organizations
    .map((organization, index) => ({ organization, colorIndex: index }))
    .filter(({ organization }) =>
      organization.name.toLowerCase().includes(clubSearch.trim().toLowerCase()),
    );
  const visibleClubs =
    isSearching || showAllClubs
      ? matchingClubs
      : matchingClubs.slice(0, VISIBLE_CLUB_COUNT);
  const hasMoreClubs =
    !isSearching && organizations.length > VISIBLE_CLUB_COUNT;

  return (
    <div className="flex gap-3 items-center">
      <Popover open={sortOpen} onOpenChange={setSortOpen}>
        <PopoverTrigger asChild>
          <button className="flex h-[31px] items-center gap-[10px] rounded-[6px] border border-[#265B34] bg-white px-3 py-1 text-[14px] font-semibold leading-[21px] text-[#265B34]">
            Filter
            <ChevronDown className="size-[13px]" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[255px] rounded-[6px] border border-[#265B34] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-row items-center justify-between">
              <p className="text-[12px] font-bold leading-[18px] text-black">
                Clubs
              </p>
              <button
                type="button"
                onClick={() => onFiltersChange(emptyFilters)}
                className="text-[12px] leading-[18px] text-black hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-[#989898]" />
              <input
                type="text"
                value={clubSearch}
                onChange={(event) => setClubSearch(event.target.value)}
                placeholder="Search clubs..."
                className="h-[25px] w-full rounded-[4px] border border-[#BABABA] bg-white pl-7 pr-2 text-[12px] leading-[18px] text-black placeholder:text-[#989898] focus:outline-none focus:border-[#265B34]"
              />
            </div>

            <div className="flex flex-col gap-2">
              {visibleClubs.map(({ organization, colorIndex }) => (
                <label
                  key={organization.id}
                  className="flex flex-row items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.organizations.includes(organization.id)}
                    onChange={() => onFiltersChange({ ...filters, organizations: toggleFilter(filters.organizations, organization.id) })}
                  />
                  <span
                    className="size-[9px] shrink-0 rounded-full"
                    style={{
                      backgroundColor:
                        organizationColors[colorIndex % organizationColors.length],
                    }}
                  />
                  <span className="text-[12px] leading-[18px] text-black">
                    {organization.name}
                  </span>
                </label>
              ))}
              {visibleClubs.length === 0 && (
                <p className="text-[12px] leading-[18px] text-[#989898]">
                  No clubs found
                </p>
              )}
            </div>

            {hasMoreClubs && (
              <button
                type="button"
                onClick={() => setShowAllClubs((prev) => !prev)}
                className="flex items-center gap-1 self-start text-[12px] font-semibold leading-[18px] text-black"
              >
                <ChevronDown
                  className={`size-3 transition-transform ${showAllClubs ? "rotate-180" : ""}`}
                />
                {showAllClubs ? "Less" : "More"}
              </button>
            )}

            <div className="h-px w-full bg-[#DDDDDD]" />

            <p className="text-[12px] font-bold leading-[18px] text-black">
              Items
            </p>

            <div className="flex flex-col gap-2">
              {categories.map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className="flex flex-row items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={filters.categories.includes(id)}
                    onChange={() => onFiltersChange({ ...filters, categories: toggleFilter(filters.categories, id) })}
                  />
                  <Icon className="size-[13px] shrink-0 text-black" />
                  <span className="text-[12px] leading-[18px] text-black">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
