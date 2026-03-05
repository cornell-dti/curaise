import { FundraisersList } from "./components/FundraisersList";
import { BasicFundraiserSchema } from "common";
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
  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <div className="flex flex-col px-4 md:px-[157px] py-10">
      <FundraisersList fundraisers={fundraisers} searchQuery={searchQuery} />
    </div>
  );
}
