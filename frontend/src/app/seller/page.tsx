import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { BasicOrganizationSchema } from "common";
import { OrganizationsList } from "./components/OrganizationsList";
import { serverFetch } from "@/lib/fetcher";

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

  const organizations = await serverFetch(`/user/${user.id}/organizations`, {
    token: session.access_token,
    schema: BasicOrganizationSchema.array(),
  });
  const params = await searchParams;
  const searchQuery = params.search || "";

  return (
    <div className="w-full px-4 md:px-[157px] py-6 space-y-4 pt-6">
      <h1 className="text-2xl font-bold">Organizations</h1>
      <OrganizationsList
        organizations={organizations}
        searchQuery={searchQuery}
      />
    </div>
  );
}
