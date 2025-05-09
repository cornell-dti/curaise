import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema } from "common/schemas/order";
import { CompleteFundraiserSchema } from "common/schemas/fundraiser";
import { z } from "zod";
import { OrdersTableWrapper } from "./components/OrdersTableWrapper";

type Order = z.infer<typeof CompleteOrderSchema>;

// data fetching function
const getOrdersByFundraiser = async (fundraiserId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch orders");
  }

  const data = CompleteOrderSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data;
};

// TODO: @STEVEN FIX THIS FUNCTION
const getOrganizationNameByFundraiserId = async (
  fundraiserId: string,
  token: string
): Promise<string> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch organization name");
  }

  return result.data?.organization.name || "Unknown Organization";
};

// TODO: @STEVEN FIX THIS FUNCTION
const getFundraiserNameById = async (
  fundraiserId: string,
  token: string
): Promise<string> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch fundraiser name");
  }

  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data.name || "Unknown Fundraiser";
};

export default async function FundraiserOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: "asc" | "desc";
    paymentType?: string[];
    items?: string[];
    status?: string[];
    pickupStatus?: string[];
  }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();
  const fundraiserId = (await params).id;

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
    throw new Error("No session found");
  }

  const orders = await getOrdersByFundraiser(
    fundraiserId,
    session.access_token
  );
  const organizationName = await getOrganizationNameByFundraiserId(
    fundraiserId,
    session.access_token
  );
  const fundraiserName = await getFundraiserNameById(
    fundraiserId,
    session.access_token
  );

  // Get all unique items across all orders
  const uniqueItems = new Set<string>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      uniqueItems.add(item.item.name);
    });
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl ">
      <div className="mb-4">
        <h1 className="text-2xl font-[400] text-gray-800">
          Welcome back,{" "}
          <span className="text-blue-600 text-2xl font-bold tracking-wide">
            {organizationName}
          </span>
        </h1>
        <p className="text-black text-base font-[400]">
          View all orders for{" "}
          <span className="font-[700]">{fundraiserName}</span>
        </p>
      </div>
      <OrdersTableWrapper
        orders={orders}
        token={session.access_token}
        fundraiserName={fundraiserName}
      />
    </div>
  );
}
