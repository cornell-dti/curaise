import { connection } from "next/server";
import { CompleteFundraiserSchema, UserSchema } from "common";
import { CheckoutForm } from "./components/CheckoutForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/fetcher";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ referrer?: string }>;
}) {
  await connection();

  const supabase = await createClient();

  const id = (await params).id;
  const { referrer } = await searchParams;

  const nextPath =
    typeof referrer === "string" && referrer.length > 0
      ? `/buyer/fundraiser/${id}/checkout?referrer=${encodeURIComponent(referrer)}`
      : `/buyer/fundraiser/${id}/checkout`;

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
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
        referrer={referrer ? referrer : ""}
      />
    </div>
  );
}
