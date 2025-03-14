import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema } from "common";
import { z } from "zod";

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();
  const id = (await params).id;

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
    <h1>Session invalid</h1>;
  }

  // get order
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/order/" + id,
    {
      headers: {
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    return <h1>{result.message}</h1>;
  }
  const order = result.data as z.infer<typeof CompleteOrderSchema>;

  return <div>{order.id}</div>;
}
