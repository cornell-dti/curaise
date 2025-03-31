import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { UserSchema } from "common";
import AccountInfo from "./AccountInfo";

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

export default async function AccountPage() {
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

  // fallback data
  const userProfile = await getUserProfile(user.id, session.access_token);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="text-2xl font-bold">Account Information</h1>
      <p className="">
        Make changes to your account here. Click save when you're done.
      </p>
      <AccountInfo user={userProfile} token={session.access_token} />
    </div>
  );
}
