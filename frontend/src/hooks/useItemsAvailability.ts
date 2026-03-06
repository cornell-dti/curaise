import useSWR from "swr";
import { noAuthFetcher } from "@/lib/fetcher";
import { ItemWithAvailabilitySchema } from "common";

export { ItemWithAvailabilitySchema } from "common";
export type { ItemWithAvailability } from "common";

export function useItemsAvailability(fundraiserId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    fundraiserId ? `/fundraiser/${fundraiserId}/items/availability` : null,
    noAuthFetcher(ItemWithAvailabilitySchema.array())
  );

  return {
    items: data,
    isLoading,
    error,
    mutate,
  };
}
