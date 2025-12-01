import { connection } from "next/server";
import { CompleteFundraiserSchema, UserSchema } from "common";
import { CheckoutForm } from "./components/CheckoutForm";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

const getUserProfile = async (userId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/user/" + userId,
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

  // parse user data
  const data = UserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse user data");
  }
  return data.data;
};

const getFundraiser = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data");
  }
  return data.data;
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

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

  const userProfile = await getUserProfile(user.id, session.access_token);

  const id = (await params).id;
  const fundraiser = await getFundraiser(id);
  if (!fundraiser.published) {
    throw new Error("Fundraiser is not published");
  }

  return (
    <CheckoutForm
      fundraiser={fundraiser}
      token={session.access_token}
      userProfile={userProfile}
    />
  );
}
