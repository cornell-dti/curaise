import { connection } from "next/server";
import { CompleteFundraiserSchema, UserSchema } from "common";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { serverFetch } from "@/lib/fetcher";
import { CartForm } from "./components/CartForm";

export default async function CartPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ code?: string }>;
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
    redirect(`/login?next=/buyer/fundraiser/${id}/client`);
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

  const { code } = await searchParams;

  return (
    <div className=" md:overflow-y-clip">
      <CartForm code={code ? code : ""} />
    </div>
  );
}
