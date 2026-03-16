import { connection } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
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
  const { code } = await searchParams;

  const nextPath =
    typeof code === "string" && code.length > 0
      ? `/buyer/fundraiser/${id}/cart?code=${encodeURIComponent(code)}`
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
      <CartForm code={code ? code : ""} />
    </div>
  );
}
