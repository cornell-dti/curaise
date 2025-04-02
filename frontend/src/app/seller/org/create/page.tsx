import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { CreateOrganizationForm } from "@/components/custom/CreateOrganizationForm";

export default async function CreateOrganizationPage() {
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

  return (
    <div>
      <CreateOrganizationForm token={session.access_token} />
    </div>
  );
}
