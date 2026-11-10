import { BrowseView } from "./components/BrowseView";
import { BasicFundraiserSchema, BasicOrganizationSchema } from "common";
import { connection } from "next/server";
import { serverFetch } from "@/lib/fetcher";
import { headers } from "next/headers";
import { getLocalMockFundraiser } from "@/lib/local-mocks/fundraiser";

export default async function BrowseFundraisersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime

  const fundraisers = await serverFetch("/fundraiser", {
    schema: BasicFundraiserSchema.array(),
  });
  const organizations = await serverFetch("/organization", {
    schema: BasicOrganizationSchema.array(),
  });

  // Temporary local UI fixture: shared by grid, calendar, and organization filters.
  const mockFundraiser = getLocalMockFundraiser((await headers()).get("host") ?? "");
  if (mockFundraiser) {
    fundraisers.unshift(mockFundraiser);
    organizations.push(mockFundraiser.organization);
  }

  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <BrowseView
      organizations={organizations}
      fundraisers={fundraisers}
      searchQuery={searchQuery}
    />
  );
}
