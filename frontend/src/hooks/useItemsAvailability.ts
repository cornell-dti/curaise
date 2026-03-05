import useSWR from "swr";
import { noAuthFetcher } from "@/lib/fetcher";
import { ItemWithAvailabilitySchema } from "@/lib/schemas/itemAvailability";

export { ItemWithAvailabilitySchema } from "@/lib/schemas/itemAvailability";
export type { ItemWithAvailability } from "@/lib/schemas/itemAvailability";

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
