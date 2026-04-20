import { FundraisersList } from "./components/FundraisersList";
import { BasicFundraiserSchema, BasicOrganizationSchema } from "common";
import { connection } from "next/server";
import { serverFetch } from "@/lib/fetcher";
import { CalendarPage } from "./components/Calendar";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

export default async function BrowseFundraisersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime

  const supabase = await createClient();
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }
  let userOrganizations: z.infer<typeof BasicOrganizationSchema>[] = [];
  if (!error1 && user) {
    userOrganizations = await serverFetch(`/user/${user.id}/organizations`, {
      token: session.access_token,
      schema: BasicOrganizationSchema.array(),
    });
  }

  const fundraisers = await serverFetch("/fundraiser", {
    schema: BasicFundraiserSchema.array(),
  });
  const organizations = await serverFetch("/organization", {
    schema: BasicOrganizationSchema.array(),
  });
  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <div className="flex flex-col px-4 md:px-[157px] py-10">
      <h1 className="hidden md:block text-[32px] font-semibold text-black">
        Browse CURaise
      </h1>
      <CalendarPage
        organizations={organizations}
        userOrganizations={userOrganizations}
        fundraisers={fundraisers}
      />{" "}
      <FundraisersList fundraisers={fundraisers} searchQuery={searchQuery} />
    </div>
  );
}
