"use client";

import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchBar } from "@/components/custom/SearchBar";
import { ChevronDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { FilterChips } from "./FilterChips";
import type { Filters, Organization } from "./browse-utils";
import {
  categories,
  emptyFilters,
  getOrganizationColor,
  toggleFilter,
} from "./browse-utils";

const VISIBLE_CLUB_COUNT = 5;

export function FilterBar({
  organizations,
  filters,
  onFiltersChange,
}: {
  organizations: Organization[];
  filters: Filters;
  onFiltersChange: (newFilters: Filters) => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSearchChange = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const [sortOpen, setSortOpen] = useState(false);
  const [clubSearch, setClubSearch] = useState("");
  const [showAllClubs, setShowAllClubs] = useState(false);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const activeFilters = mobileOpen ? draftFilters : filters;
  const updateFilters = mobileOpen ? setDraftFilters : onFiltersChange;

  const handleMobileOpenChange = (open: boolean) => {
    if (open) {
      setDraftFilters({
        organizations: [...filters.organizations],
        categories: [...filters.categories],
      });
      setClubSearch("");
      setShowAllClubs(false);
    }
    setMobileOpen(open);
  };

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const handleBreakpointChange = () => {
      setMobileOpen(false);
      setSortOpen(false);
    };
    desktop.addEventListener("change", handleBreakpointChange);
    return () => desktop.removeEventListener("change", handleBreakpointChange);
  }, []);

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

  const filterControls = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row items-center justify-between">
        <p className="text-lg font-semibold md:text-[12px] md:font-bold md:leading-[18px] text-black">
          Clubs
        </p>
        <button
          type="button"
          onClick={() => updateFilters(mobileOpen ? { ...draftFilters, organizations: [] } : emptyFilters)}
          className="text-sm font-medium md:text-[12px] md:font-normal md:leading-[18px] text-black hover:underline"
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
          className="h-[25px] w-full rounded-[4px] border border-[#BABABA] bg-white pl-7 pr-2 text-sm font-normal md:text-[12px] md:leading-[18px] text-black placeholder:text-[#989898] focus:outline-none focus:border-[#265B34]"
        />
      </div>

      <div className="flex flex-col gap-2">
        {visibleClubs.map(({ organization, colorIndex }) => (
          <label
            key={organization.id}
            className="flex flex-row items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={activeFilters.organizations.includes(organization.id)}
              onChange={() => updateFilters({ ...activeFilters, organizations: toggleFilter(activeFilters.organizations, organization.id) })}
            />
            <span
              className="size-[9px] shrink-0 rounded-full"
              style={{ backgroundColor: getOrganizationColor(colorIndex) }}
            />
            <span className="text-base font-normal md:text-[12px] md:leading-[18px] text-black">
              {organization.name}
            </span>
          </label>
        ))}
        {visibleClubs.length === 0 && (
          <p className="text-sm font-normal md:text-[12px] md:leading-[18px] text-[#989898]">
            No clubs found
          </p>
        )}
      </div>

      {hasMoreClubs && (
        <button
          type="button"
          onClick={() => setShowAllClubs((prev) => !prev)}
          className="flex items-center gap-1 self-start text-sm font-medium md:text-[12px] md:font-semibold md:leading-[18px] text-black"
        >
          <ChevronDown
            className={`size-3 transition-transform ${showAllClubs ? "rotate-180" : ""}`}
          />
          {showAllClubs ? "Less" : "More"}
        </button>
      )}

      <div className="h-px w-full bg-[#DDDDDD]" />

      <p className="text-lg font-semibold md:text-[12px] md:font-bold md:leading-[18px] text-black">
        Items
      </p>

      <div className="flex flex-col gap-2">
        {categories.map(({ id, label, icon: Icon }) => (
          <label
            key={id}
            className="flex flex-row items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={activeFilters.categories.includes(id)}
              onChange={() => updateFilters({ ...activeFilters, categories: toggleFilter(activeFilters.categories, id) })}
            />
            <Icon className="size-[13px] shrink-0 text-black" />
            <span className="text-base font-normal md:text-[12px] md:leading-[18px] text-black">
              {label}
            </span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="min-w-0 flex-1 md:hidden">
        <SearchBar onSearchChange={handleSearchChange} />
      </div>
      <Dialog open={mobileOpen} onOpenChange={handleMobileOpenChange}>
        <DialogPrimitive.Trigger asChild>
          <button type="button" className="flex h-10 shrink-0 items-center gap-[10px] rounded-[6px] border border-[#265B34] bg-white px-3 py-1 text-[14px] font-semibold leading-[21px] text-[#265B34] md:hidden">
            Filter
            <ChevronDown className="size-[13px]" />
          </button>
        </DialogPrimitive.Trigger>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 top-0 z-50 flex h-dvh flex-col bg-white text-black"
          >
            <header className="flex shrink-0 items-center justify-between border-b p-4 pt-[max(1rem,env(safe-area-inset-top))]">
              <DialogTitle className="text-2xl font-semibold leading-8">Filters</DialogTitle>
              <DialogPrimitive.Close asChild>
                <Button type="button" variant="ghost" size="icon" aria-label="Close filters">
                  <X aria-hidden="true" />
                </Button>
              </DialogPrimitive.Close>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
              {filterControls}
            </div>
            <footer className="shrink-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button
                type="button"
                size="lg"
                className="w-full bg-black text-base font-semibold text-white hover:bg-black/90"
                onClick={() => {
                  onFiltersChange(draftFilters);
                  setMobileOpen(false);
                }}
              >
                Apply
              </Button>
            </footer>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      <Popover open={sortOpen} onOpenChange={setSortOpen}>
        <PopoverTrigger asChild>
          <button className="hidden h-10 md:flex md:h-[31px] shrink-0 items-center gap-[10px] rounded-[6px] border border-[#265B34] bg-white px-3 py-1 text-[14px] font-semibold leading-[21px] text-[#265B34]">
            Filter
            <ChevronDown className="size-[13px]" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="w-[255px] rounded-[6px] border border-[#265B34] bg-white px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
        >
          {filterControls}
        </PopoverContent>
      </Popover>

      {(filters.organizations.length > 0 || filters.categories.length > 0) && (
        <div className="flex w-full flex-wrap gap-3 md:contents">
          <FilterChips
            organizations={organizations}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      )}
    </div>
  );
}
