import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { CartForm } from "./components/CartForm";
export default async function CartPage({
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
      ? `/buyer/fundraiser/${id}/cart?referrer=${encodeURIComponent(referrer)}`
      : `/buyer/fundraiser/${id}/cart`;

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

  return (
    <div className=" md:overflow-y-clip">
      <CartForm referrer={referrer ? referrer : ""} />
    </div>
  );
}
