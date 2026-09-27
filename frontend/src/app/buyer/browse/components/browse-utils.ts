import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { isPast } from "date-fns";

export type FilterType = "all" | "pickup-today";
export type CategoryType = "desserts" | "food" | "crafts" | "drinks" | "all";

type Fundraiser = z.infer<typeof BasicFundraiserSchema>;

export function filterFundraisers<T extends Fundraiser>(
  fundraisers: T[],
  { searchQuery, filter }: { searchQuery: string; filter: FilterType },
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

  // Apply dropdown filter
  if (filter === "pickup-today") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filtered = filtered.filter((fundraiser) =>
      fundraiser.pickupEvents.some((event) => {
        const eventDate = new Date(event.startsAt);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      }),
    );
  }

  return filtered;
}
