import useSWR from "swr";
import { CompleteItemSchema } from "common";
import { noAuthFetcher } from "@/lib/fetcher";

export function useFundraiserItems(fundraiserId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    fundraiserId ? `/fundraiser/${fundraiserId}/items` : null,
    noAuthFetcher(CompleteItemSchema.array())
  );

  return {
    items: data,
    isLoading,
    error,
    mutate,
  };
}

