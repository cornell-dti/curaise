import { connection } from "next/server";
import { CompleteFundraiserSchema, UserSchema } from "common";
import { CheckoutForm } from "./components/CheckoutForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/fetcher";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const supabase = await createClient();

  const id = (await params).id;

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect(`/login?next=/buyer/fundraiser/${id}/checkout`);
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

  const userProfile = await serverFetch(`/user/${user.id}`, {
    token: session.access_token,
    schema: UserSchema,
  });

  const fundraiser = await serverFetch(`/fundraiser/${id}`, {
    schema: CompleteFundraiserSchema,
  });
  if (!fundraiser.published) {
    throw new Error("Fundraiser is not published");
  }

  return (
    <div className=" md:overflow-y-clip">
      <CheckoutForm
        fundraiser={fundraiser}
        token={session.access_token}
        userProfile={userProfile}
      />
    </div>
  );
}
