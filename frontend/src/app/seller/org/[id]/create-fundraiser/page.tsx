import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { CreateFundraiserForm } from "@/app/seller/org/[id]/create-fundraiser/components/CreateFundraiserForm";
import { CompleteOrganizationSchema } from "common";

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
    throw new Error("Could not parse order data");
  }
  return data.data;
};

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

  // Check if user is an admin of the organization
  if (!org.admins.map((admin) => admin.id).includes(user.id)) {
    return <p>naw</p>;
  }

  return (
    <div>
      <CreateFundraiserForm token={session.access_token} organizationId={id} />
    </div>
  );
}
