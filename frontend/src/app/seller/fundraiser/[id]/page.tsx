import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, ArrowUpDown } from "lucide-react";

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
  const result = await response.json();

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
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch fundraiser name");
  }

  return result.data?.name || "Unknown Fundraiser";
};

export default async function FundraiserOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, <span className="text-blue-600">{organizationName}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all orders associated with your fundraiser: <span className="font-semibold">{fundraiserName}</span>.
        </p>
      </div>

      <Card className="rounded-lg shadow-md">
        <div className="p-4 flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              className="w-48 h-10 pl-10 bg-white rounded-md border border-gray-300"
              placeholder="Search orders"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 px-4">
              Export
              <Download className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="h-10 px-4">
              Sort By
              <ArrowUpDown className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-3 text-left">Select</TableHead>
                <TableHead className="px-4 py-3 text-left">Name</TableHead>
                <TableHead className="px-4 py-3 text-left">Email</TableHead>
                <TableHead className="px-4 py-3 text-left">NetId</TableHead>
                <TableHead className="px-4 py-3 text-left">Order Details</TableHead>
                <TableHead className="px-4 py-3 text-left">Payment</TableHead>
                <TableHead className="px-4 py-3 text-left">Order Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No orders available
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: {
                  id: string;
                  buyer?: { name?: string; email?: string };
                  paymentMethod: string;
                  pickedUp: boolean;
                  createdAt: string;
                  items: { item: { name: string; price: number }; quantity: number }[];
                }) => {
                  const orderTotal = order.items.reduce(
                    (total: number, item: { item: { name: string; price: number }; quantity: number }) => total + item.quantity * item.item.price,
                    0
                  );
                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="px-4 py-3">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="px-4 py-3">{order.buyer?.name || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3">{order.buyer?.email || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3">{order.buyer?.email?.split('@')[0] || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3">
                        {order.items.map((item, index: number) => (
                          <div key={index}>
                            {item.quantity} {item.item.name}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="px-4 py-3">{order.paymentMethod || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3">${orderTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}