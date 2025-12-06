import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { BasicOrganizationSchema } from "common";
import { OrganizationsList } from "./components/OrganizationsList";

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
    throw new Error("Could not parse organization data");
  }

  return data.data;
};

export default async function SellerHome({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
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
  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <div className="container mx-auto px-4 py-6 space-y-4 pt-20 md:pt-6">
      <h1 className="text-2xl font-bold">Organizations</h1>
      <OrganizationsList
        organizations={organizations}
        searchQuery={searchQuery}
      />
    </div>
  );
}
