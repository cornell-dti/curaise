import { CompleteFundraiserSchema, CompleteOrderSchema } from "common";
import { createClient } from "@/utils/supabase/server";
import { AnalyticsSummaryCard } from "@/components/custom/AnalyticsSummary";
import { z } from "zod";
import Decimal from "decimal.js";
import TodoList from "@/components/custom/TodoList";
import Checklist from "@/components/custom/Checklist";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";

// Type definitions for API responses
type OrderItem = {
  item: { 
    name: string; 
    price: number;
  };
  quantity: number;
};

type Order = {
  id: string;
  buyer?: { 
    name?: string; 
    email?: string;
  };
  paymentMethod: string;
  pickedUp: boolean;
  createdAt: string;
  items: OrderItem[];
};

type OrderResponse = {
  data?: {
    cleanedOrders: Order[];
  };
  message?: string;
};

type FundraiserResponse = {
  data?: {
    name?: string;
    organization: {
      name: string;
    };
  };
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

  const result = (await response.json()) as OrderResponse;
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
  searchParams: { 
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  };
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

  let orders = await getOrdersByFundraiser(fundraiserId, session.access_token);
  const organizationName = await getOrganizationNameByFundraiserId(fundraiserId, session.access_token);
  const fundraiserName = await getFundraiserNameById(fundraiserId, session.access_token);
  
  // Handle search
  const search = searchParams.search?.toLowerCase() || '';
  if (search) {
    orders = orders.filter((order: Order) => 
      order.buyer?.name?.toLowerCase().includes(search) ||
      order.buyer?.email?.toLowerCase().includes(search) ||
      order.items.some(item => item.item.name.toLowerCase().includes(search))
    );
  }
  
  // Handle sorting
  const sortField = searchParams.sort || '';
  const sortOrder = searchParams.order || 'asc';
  
  if (sortField) {
    orders.sort((a: Order, b: Order) => {
      let aValue: string | number = '';
      let bValue: string | number = '';
      
      if (sortField === 'name') {
        aValue = a.buyer?.name || '';
        bValue = b.buyer?.name || '';
      } else if (sortField === 'netid') {
        aValue = a.buyer?.email?.split('@')[0] || '';
        bValue = b.buyer?.email?.split('@')[0] || '';
      } else if (sortField === 'total') {
        aValue = a.items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * item.item.price), 0);
        bValue = b.items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * item.item.price), 0);
      } else if (sortField === 'payment') {
        aValue = a.paymentMethod || '';
        bValue = b.paymentMethod || '';
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Function to create sort URL
  const createSortUrl = (field: string): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    if (params.get('sort') === field) {
      // Toggle order if same field
      params.set('order', params.get('order') === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('order', 'asc');
    }
    return `?${params.toString()}`;
  };

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
            <form>
              <Input
                className="w-64 h-10 pl-10 bg-white rounded-md border border-gray-300"
                placeholder="Search orders"
                name="search"
                defaultValue={searchParams.search || ''}
              />
            </form>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-10 px-4">
              Export
              <Download className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="px-4 py-3 text-left">Select</TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <a href={createSortUrl('name')} className="flex items-center">
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">Email</TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <a href={createSortUrl('netid')} className="flex items-center">
                    NetId
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">Order Details</TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <a href={createSortUrl('payment')} className="flex items-center">
                    Payment
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <a href={createSortUrl('total')} className="flex items-center">
                    Order Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </a>
                </TableHead>
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
                orders.map((order: Order) => {
                  const orderTotal = order.items.reduce(
                    (total: number, item: OrderItem) => total + item.quantity * item.item.price,
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
                      <TableCell className="px-4 py-3 font-medium">${orderTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 text-sm text-muted-foreground">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
        </div>
      </Card>
    </div>
  );
}
