import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { CreateFundraiserForm } from "@/app/seller/org/[id]/create-fundraiser/components/CreateFundraiserForm";
import { CompleteOrganizationSchema } from "common";
import { serverFetch } from "@/lib/fetcher";

export default async function CreateFundraiserPage({
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

  const id = (await params).id;
  const org = await serverFetch(`/organization/${id}`, {
    schema: CompleteOrganizationSchema,
  });

  // Check if user is an admin of the organization
  if (!org.admins.map((admin) => admin.id).includes(user.id)) {
    throw new Error("User is not an admin of the organization");
  }

  return (
    <div>
      <CreateFundraiserForm token={session.access_token} organizationId={id} />
    </div>
  );
}
