import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { BasicOrganizationSchema } from "common";
import {
  OrganizationCard,
  CreateOrganizationCard,
} from "@/components/custom/OrganizationCard";

const getOrganizations = async (userId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/user/" + userId + "/organizations",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  // parse org data
  const data = BasicOrganizationSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }

  return data.data;
};

export default async function SellerHome() {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/");
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

  const organizations = await getOrganizations(user.id, session.access_token);

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">Organizations</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {organizations.map((org) => (
          <OrganizationCard key={org.id} organization={org} />
        ))}
        <CreateOrganizationCard />
      </div>
    </div>
  );
}
