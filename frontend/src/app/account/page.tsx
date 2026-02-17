import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { UserSchema } from "common";
import { AccountForm } from "./components/AccountForm";
import { serverFetch } from "@/lib/fetcher";

export default async function AccountPage() {
  await connection(); // ensures dynamic rendering

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

  const userProfile = await serverFetch(`/user/${user.id}`, {
    token: session.access_token,
    schema: UserSchema,
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex flex-col space-y-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <AccountForm user={userProfile} token={session.access_token} />
      </div>
    </div>
  );
}
