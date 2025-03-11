import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { SignOutButton } from "../../components/auth/SignOutButton";

export default async function SellerHome() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Seller Home Page</h1>
      <p>Welcome {user.email}</p>
      <SignOutButton />
    </div>
  );
}
