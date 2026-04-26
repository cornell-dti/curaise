import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { AdminOrganizationSchema } from "common";
import { serverFetch } from "@/lib/fetcher";
import AdminOrganizationsTable from "./components/AdminOrganizationsTable";

export default async function AdminPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    redirect("/");
  }

  // Verify admin access — redirects to home if not an admin
  try {
    await serverFetch("/admin/verify", { token: session.access_token });
  } catch {
    redirect("/");
  }

  const organizations = await serverFetch("/admin/organizations", {
    token: session.access_token,
    schema: AdminOrganizationSchema.array(),
  });

  return (
    <div className="w-full px-4 md:px-[157px] py-6 space-y-4">
      <h1 className="text-2xl font-bold">Organizations</h1>
      <AdminOrganizationsTable organizations={organizations} />
    </div>
  );
}
