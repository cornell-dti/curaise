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
  console.log("Organization Name:", organizationName);

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100">
      <div className="w-[1028px]">
        <h1 className="text-xl mb-4 mt-3 text-black">
          Welcome back, <span className="font-bold text-[#0D53AE]">{organizationName}</span>
        </h1>
        <Card className="h-[654px] bg-[#ebebeb] rounded-lg overflow-hidden">
          <div className="p-3 flex justify-between">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                className="w-[149px] h-[31px] pl-8 bg-white rounded-[9px] shadow-[0px_4px_4px_#00000040]"
                placeholder=""
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="h-[31px] flex items-center gap-3.5 px-3 py-[3px] bg-white rounded-md shadow-[0px_4px_4px_#00000040] [font-family:'Inter-Regular',Helvetica] font-normal text-black"
              >
                Export
                <Download className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                className="h-[31px] flex items-center gap-3.5 px-3 py-[3px] bg-white rounded-md shadow-[0px_4px_4px_#00000040] [font-family:'Inter-Regular',Helvetica] font-normal text-black"
              >
                Sort By
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-2">
            <Table>
              <TableHeader className="bg-[#c0c0c0]">
                <TableRow className="h-[60px] border-none">
                  <TableHead className="w-[50px] px-4 py-3 border-none"><Checkbox /></TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">Name</TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">Email</TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">NetId</TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">Order Details</TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">Payment</TableHead>
                  <TableHead className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">Order Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow className="h-[60px] border-none">
                    <TableCell colSpan={7} className="text-center font-normal px-4 py-3 border-none">No orders available</TableCell>
                  </TableRow>
                ) : (
                  orders.map(
                    (order: {
                      id: string;
                      buyer?: { name?: string; email?: string };
                      paymentMethod: string;
                      pickedUp: boolean;
                      createdAt: string;
                      items: { item: { name: string; price: number }; quantity: number }[];
                    }) => {
                      const orderTotal = order.items.reduce(
                        (total, item) => total + item.quantity * item.item.price,
                        0
                      );
                      return (
                        <TableRow key={order.id} className="hover:bg-gray-100 h-[60px] border-none">
                          <TableCell className="px-4 py-3 border-none"><Checkbox /></TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">{order.buyer?.name || "Unknown"}</TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">{order.buyer?.email || "Unknown"}</TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">{order.buyer?.email?.split('@')[0] || "Unknown"}</TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">
                            {order.items.map((item, index) => (
                              <div key={index}>{item.quantity} {item.item.name}{item.quantity > 1 ? "s" : ""}</div>
                            ))}
                          </TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">{order.paymentMethod || "Unknown"}</TableCell>
                          <TableCell className="[font-family:'Inter-Regular',Helvetica] font-normal text-black text-base text-center px-4 py-3 border-none">${orderTotal.toFixed(2) || "Unknown"}</TableCell>
                        </TableRow>
                      );
                    }
                  )
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}