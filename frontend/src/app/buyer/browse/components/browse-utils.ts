import { z } from "zod";
import { BasicFundraiserSchema, BasicOrganizationSchema } from "common";
import { format, isPast } from "date-fns";
import { CupSoda, Hamburger, Lollipop, Scissors } from "lucide-react";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

export type Organization = z.infer<typeof BasicOrganizationSchema>;
export type CategoryType = "desserts" | "food" | "crafts" | "drinks";
export type OrganizationId = Organization["id"];

export const categories = [
  { id: "desserts" as CategoryType, label: "Desserts", icon: Lollipop },
  { id: "food" as CategoryType, label: "Food", icon: Hamburger },
  { id: "drinks" as CategoryType, label: "Drinks", icon: CupSoda },
  { id: "crafts" as CategoryType, label: "Crafts", icon: Scissors },
];

const organizationColors = [
  "#f74545ff", // red
  "#6a9f48", // green
  "#3197f7", // blue
  "#f78b2d", // orange
  "#f7c948", // yellow
  "#5b6cf7", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#2dd4bf", // teal
  "#6b7280", // gray
];

const FALLBACK_ORGANIZATION_COLOR = "#3174ad";

export function getOrganizationColor(index: number): string {
  if (index < 0) return FALLBACK_ORGANIZATION_COLOR;
  return organizationColors[index % organizationColors.length];
}

export function formatTime(date: Date): string {
  return format(date, date.getMinutes() === 0 ? "h a" : "h:mm a");
}

export function formatCompactTime(date: Date): string {
  return format(date, date.getMinutes() === 0 ? "ha" : "h:mma");
}

export function formatTimeRange(start: Date, end: Date): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

export type Filters = {
  organizations: OrganizationId[]; // Stored as unique ID instead of name
  categories: CategoryType[];
}

export const emptyFilters: Filters = { organizations: [], categories: [] };

export function toggleFilter<T>(filterList: T[], filter: T): T[] {
  return filterList.includes(filter)
    ? filterList.filter((x) => x !== filter)
    : [...filterList, filter];
}

export function filterFundraisers<T extends Fundraiser>(
  fundraisers: T[],
  searchQuery: string,
  filters: Filters,
  { includeEnded = false }: { includeEnded?: boolean } = {},
): T[] {
  let filtered = fundraisers;

  // Filter out all fundraisers from un-approved organizations and fundraiser
  filtered = filtered.filter(
    (fundraiser) =>
      fundraiser.organization.authorized === true &&
      (includeEnded ||
        !fundraiser.pickupEvents.every((event) => isPast(event.endsAt))),
  );

  // Apply search query 
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((fundraiser) =>
      fundraiser.name.toLowerCase().includes(query),
    );
  }

  // Apply filters
  if (filters.organizations.length > 0) {
    filtered = filtered.filter((fundraiser) =>
      filters.organizations.includes(fundraiser.organization.id),
    );
  }

  return filtered;
}
