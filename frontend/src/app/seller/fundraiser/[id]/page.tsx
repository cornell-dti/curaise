import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { connection } from "next/server";
import { FundraiserHeader } from "./components/FundraiserHeader";

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

const getFundraiserItems = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteItemSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser items data");
  }
  return data.data;
};

export default async function FundraiserPage({
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

  const id = (await params).id;
  const fundraiser = await getFundraiser(id);
  const currentFundraiserItems = await getFundraiserItems(fundraiser.id);

  return (
    <div className="h-full py-[64px] bg-[#F6F6F6] flex flex-col items-center">
      {/* TODO: @Eric add the other stuff here */}
      <FundraiserHeader
        token={session.access_token}
        fundraiser={fundraiser}
        fundraiserItems={currentFundraiserItems}
      />
    </div>
  );
}
