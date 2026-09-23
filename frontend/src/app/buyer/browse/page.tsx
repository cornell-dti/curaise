import { BrowseView } from "./components/BrowseView";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteItemSchema,
} from "common";
import { connection } from "next/server";
import { serverFetch } from "@/lib/fetcher";
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
      userOrganizations={userOrganizations}
      fundraisers={fundraisers}
      fundraisersWithItems={fundraisersWithItems}
      searchQuery={searchQuery}
    />
  );
}
