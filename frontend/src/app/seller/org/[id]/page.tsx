import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BasicFundraiserSchema, CompleteOrganizationSchema } from "common";
import { connection } from "next/server";
import { FundraiserCard } from "@/components/custom/FundraiserCard";
import { ShieldCheck } from "lucide-react";
import { isPast } from "date-fns";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { EditOrgInfoDialog } from "@/components/custom/EditOrgInfoDialog";

const getOrganization = async (id: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/organization/" + id
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  const data = CompleteOrganizationSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse organization data");
  }
  return data.data;
};

export const getFundraisers = async (organizationId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organization/${organizationId}/fundraisers`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  const data = BasicFundraiserSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data.");
  }

  return data.data;
};

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

  const id = (await params).id;

  const org = await getOrganization(id);
  const fundraisers = await getFundraisers(id);

  // Check if user is an admin of the organization
  if (!org.admins.map((admin) => admin.id).includes(user.id)) {
    throw new Error("You are not authorized to view this organization.");
  }

  // Separate fundraisers into two categories: active and past

  const activeFundraisers = fundraisers.filter(
    (fundraiser) => !isPast(fundraiser.buyingEndsAt)
  );

  const pastFundraisers = fundraisers.filter((fundraiser) =>
    isPast(fundraiser.buyingEndsAt)
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
        <p className="text-lg my-auto">Welcome, admin!</p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="flex items-center text-4xl font-bold">
            {org.name}
            {org.authorized && <ShieldCheck className="text-gray-600 ml-1" />}
          </h1>
          <EditOrgInfoDialog org={org} token={session.access_token} />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Active Fundraisers</h1>
          <Link href={`/seller/org/${id}/create-fundraiser`}>
            <Button className="ml-2">Create New Fundraiser</Button>
          </Link>
        </div>

        <div className="space-y-4 mt-4">
          {activeFundraisers.length > 0 ? (
            activeFundraisers.map((fundraiser) => (
              <FundraiserCard
                key={fundraiser.id}
                fundraiser={fundraiser}
                seller
              />
            ))
          ) : (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium">No active fundraisers</h3>
              <p className="text-muted-foreground">
                {org.name} doesn't have any currently active fundraisers.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <h1 className="text-2xl font-bold">Past Fundraisers</h1>

        <div className="space-y-4 mt-4">
          {pastFundraisers.length > 0 ? (
            pastFundraisers.map((fundraiser) => (
              <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
            ))
          ) : (
            <div className="text-center py-6">
              <h3 className="text-lg font-medium">No past fundraisers</h3>
              <p className="text-muted-foreground">
                {org.name} doesn't have any past fundraisers.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
