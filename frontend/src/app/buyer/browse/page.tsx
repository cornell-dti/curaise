import { BrowseView } from "./components/BrowseView";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import { connection } from "next/server";
import { serverFetch } from "@/lib/fetcher";

export default async function BrowseFundraisersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime

  const fundraisers = await serverFetch("/fundraiser", {
    schema: BasicFundraiserSchema.array(),
  });
  const fundraisersWithItems = await Promise.all(
    fundraisers.map(async (fundraiser) => ({
      ...fundraiser,
      items: await serverFetch(`/fundraiser/${fundraiser.id}/items`, {
        schema: CompleteItemSchema.array(),
      }),
    })),
  );
  const organizations = await serverFetch("/organization", {
    schema: BasicOrganizationSchema.array(),
  });

  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <BrowseView
      organizations={organizations}
      fundraisers={fundraisers}
      fundraisersWithItems={fundraisersWithItems}
      searchQuery={searchQuery}
    />
  );
}
