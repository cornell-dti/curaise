"use client";

import { useState } from "react";
import { z } from "zod";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import { CalendarDays, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarPage } from "./Calendar";
import { FundraisersList } from "./FundraisersList";

type BrowseViewType = "grid" | "calendar";
type Organization = z.infer<typeof BasicOrganizationSchema>;
type Fundraiser = z.infer<typeof BasicFundraiserSchema>;
type FundraiserWithItems = Fundraiser & {
  items: z.infer<typeof CompleteItemSchema>[];
};

const viewOptions = [
  { value: "grid", label: "Grid view", icon: LayoutGrid },
  { value: "calendar", label: "Calendar view", icon: CalendarDays },
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

  return (
    <div>
      <div className="flex items-center justify-between py-4 md:py-10 px-4 md:px-[157px]">
        <h1 className="text-[28px] md:text-[32px] font-semibold text-black">
          Browse CURaise
        </h1>
        <div
          role="group"
          aria-label="Browse view"
          className="flex overflow-hidden rounded-[6px] border border-[#265B34]"
        >
          {viewOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              aria-label={label}
              aria-pressed={view === value}
              className={cn(
                "flex size-8 md:size-10 items-center justify-center transition-colors",
                view === value
                  ? "bg-[#265B34] text-white"
                  : "bg-white text-[#265B34] hover:bg-[#e6f0ea]",
              )}
            >
              <Icon className="size-4 md:size-5" />
            </button>
          ))}
        </div>
      </div>
      {view === "calendar" ? (
        <CalendarPage
          organizations={organizations}
          userOrganizations={userOrganizations}
          fundraisers={fundraisersWithItems}
        />
      ) : (
        <div className="flex flex-col px-4 md:px-[157px] pb-10">
          <FundraisersList fundraisers={fundraisers} searchQuery={searchQuery} />
        </div>
      )}
    </div>
  );
}
