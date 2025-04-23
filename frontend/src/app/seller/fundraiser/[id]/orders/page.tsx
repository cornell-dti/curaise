import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Card } from "@/components/ui/card";
import { CompleteOrderSchema } from "common/schemas/order";
import { CompleteFundraiserSchema } from "common/schemas/fundraiser";
import { z } from "zod";
import { OrderTable } from "@/app/seller/fundraiser/[id]/orders/components/OrderTable";

type Order = z.infer<typeof CompleteOrderSchema>;

type OrderResponse = {
  data?: {
    cleanedOrders: Order[];
  };
  message?: string;
};

type FundraiserResponse = {
  data?: z.infer<typeof CompleteFundraiserSchema>;
  message?: string;
};

// data fetching function
const getOrdersByFundraiser = async (fundraiserId: string, token: string): Promise<Order[]> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json() as OrderResponse;

  // Log the API call output
  console.log("API Response:", result);

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch orders");
  }

  // Access the cleanedOrders array from the response
  return Array.isArray(result.data?.cleanedOrders)
    ? result.data.cleanedOrders
    : [];
};

const getOrganizationNameByFundraiserId = async (fundraiserId: string, token: string): Promise<string> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json() as FundraiserResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch organization name");
  }

  return result.data?.organization.name || "Unknown Organization";
};

const getFundraiserNameById = async (fundraiserId: string, token: string): Promise<string> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json() as FundraiserResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch fundraiser name");
  }

  return result.data?.name || "Unknown Fundraiser";
};

export default async function FundraiserOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    paymentType?: string[];
    items?: string[];
    status?: string[];
    pickupStatus?: string[];
  }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();
  const fundraiserId = (await params).id;
  const resolvedSearchParams = await searchParams;

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
    throw new Error("No session found");
  }

  const orders = await getOrdersByFundraiser(fundraiserId, session.access_token);
  const organizationName = await getOrganizationNameByFundraiserId(fundraiserId, session.access_token);
  const fundraiserName = await getFundraiserNameById(fundraiserId, session.access_token);

  // Extract unique values for filter options
  const paymentTypes = [...new Set(orders.map(order => order.paymentMethod || "Unknown"))];
  const statuses = [...new Set(orders.map(order => order.paymentStatus || "Unknown"))];
  
  // Get all unique items across all orders
  const uniqueItems = new Set<string>();
  orders.forEach(order => {
    order.items.forEach(item => {
      uniqueItems.add(item.item.name);
    });
  });
  const itemsList = [...uniqueItems];

  // Get current filter selections
  const selectedPaymentTypes = Array.isArray(resolvedSearchParams.paymentType) 
    ? resolvedSearchParams.paymentType 
    : resolvedSearchParams.paymentType ? [resolvedSearchParams.paymentType] : [];
  
  const selectedStatuses = Array.isArray(resolvedSearchParams.status) 
    ? resolvedSearchParams.status 
    : resolvedSearchParams.status ? [resolvedSearchParams.status] : [];
  
  const selectedItems = Array.isArray(resolvedSearchParams.items) 
    ? resolvedSearchParams.items 
    : resolvedSearchParams.items ? [resolvedSearchParams.items] : [];
  
  const selectedPickupStatuses = Array.isArray(resolvedSearchParams.pickupStatus) 
    ? resolvedSearchParams.pickupStatus 
    : resolvedSearchParams.pickupStatus ? [resolvedSearchParams.pickupStatus] : [];

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl ">
      <div className="mb-4">
        <h1 className="text-2xl font-[Manrope] font-[400] text-gray-800">
          Welcome back, <span className="text-blue-600 text-2xl font-bold font-['Manrope'] tracking-wide">{organizationName}</span>
        </h1>
        <p className="text-black text-base ">
          View all orders for <span className="font-[700]">{fundraiserName}</span>
        </p>
      </div>

      <Card className="relative bg-[#F7F7F7] shadow-none outline outline-5 outline-offset-[-1px] outline-stone-300 overflow-hidden rounded-lg">
        <OrderTable
          orders={orders}
          resolvedSearchParams={resolvedSearchParams}
          fundraiserName={fundraiserName}
          token={session.access_token}
          paymentTypes={paymentTypes}
          statuses={statuses}
          itemsList={itemsList}
          selectedPaymentTypes={selectedPaymentTypes}
          selectedStatuses={selectedStatuses}
          selectedItems={selectedItems}
          selectedPickupStatuses={selectedPickupStatuses}
        />
      </Card>
    </div>
  );
}