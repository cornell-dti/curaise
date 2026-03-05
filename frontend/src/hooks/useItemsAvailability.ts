import useSWR from "swr";
import { CompleteItemSchema } from "common";
import { noAuthFetcher } from "@/lib/fetcher";
import { z } from "zod";

export const ItemWithAvailabilitySchema = CompleteItemSchema.extend({
  confirmedCount: z.number(),
  available: z.number().nullable(),
});

export type ItemWithAvailability = z.infer<typeof ItemWithAvailabilitySchema>;

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
