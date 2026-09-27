import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { isPast } from "date-fns";

export type CategoryType = "desserts" | "food" | "crafts" | "drinks" | "all";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

export function filterFundraisers<T extends Fundraiser>(
  fundraisers: T[],
  searchQuery: string,
): T[] {
  let filtered = fundraisers;

  // Filter out all fundraisers from un-approved organizations and fundraiser
  filtered = filtered.filter(
    (fundraiser) =>
      fundraiser.organization.authorized === true &&
      !fundraiser.pickupEvents.every((event) => isPast(event.endsAt)),
  );

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter((fundraiser) =>
      fundraiser.name.toLowerCase().includes(query),
    );
  }

  // Apply category filter (for now, we'll show all since we don't have category data)
  // This can be implemented when categories are added to the schema

  return filtered;
}
