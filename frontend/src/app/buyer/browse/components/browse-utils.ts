import { z } from "zod";
import { BasicFundraiserSchema, BasicOrganizationSchema } from "common";
import { isPast } from "date-fns";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

export type Organization = z.infer<typeof BasicOrganizationSchema>;
export type CategoryType = "desserts" | "food" | "crafts" | "drinks";
export type OrganizationId = Organization["id"];

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
): T[] {
  let filtered = fundraisers;

  // Filter out all fundraisers from un-approved organizations and fundraiser
  filtered = filtered.filter(
    (fundraiser) =>
      fundraiser.organization.authorized === true &&
      !fundraiser.pickupEvents.every((event) => isPast(event.endsAt)),
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
