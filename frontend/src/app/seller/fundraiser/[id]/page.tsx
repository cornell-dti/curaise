import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { ExportButton } from "@/components/custom/ExportButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompleteOrderSchema } from "common/schemas/order";
import { CompleteFundraiserSchema } from "common/schemas/fundraiser";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;
type OrderItem = Order['items'][0];

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

  let orders = await getOrdersByFundraiser(fundraiserId, session.access_token);
  const organizationName = await getOrganizationNameByFundraiserId(fundraiserId, session.access_token);
  const fundraiserName = await getFundraiserNameById(fundraiserId, session.access_token);
  
  // Handle search
  const search = resolvedSearchParams.search?.toLowerCase() || '';
  if (search) {
    orders = orders.filter((order: Order) =>
      order.buyer?.name?.toLowerCase().includes(search) ||
      order.buyer?.email?.toLowerCase().includes(search) ||
      order.items.some(item => item.item.name.toLowerCase().includes(search))
    );
  }
  
  // Apply filters if they exist, for paymentType, status, and items
  if (resolvedSearchParams.paymentType && resolvedSearchParams.paymentType.length > 0) {
    const paymentTypes = Array.isArray(resolvedSearchParams.paymentType)
      ? resolvedSearchParams.paymentType
      : [resolvedSearchParams.paymentType];
    
    orders = orders.filter((order: Order) =>
      paymentTypes.includes(order.paymentMethod || '')
    );
  }
  
  if (resolvedSearchParams.status && resolvedSearchParams.status.length > 0) {
    const statuses = Array.isArray(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : [resolvedSearchParams.status];
    
    orders = orders.filter((order: Order) =>
      statuses.includes(order.paymentStatus || '')
    );
  }
  
  if (resolvedSearchParams.items && resolvedSearchParams.items.length > 0) {
    const itemFilters = Array.isArray(resolvedSearchParams.items)
      ? resolvedSearchParams.items
      : [resolvedSearchParams.items];
    
    orders = orders.filter((order: Order) =>
      order.items.some(item => itemFilters.includes(item.item.id))
    );
  }
  
  // Handle sorting
  const sortField = resolvedSearchParams.sort || '';
  const sortOrder = resolvedSearchParams.order || 'asc';
  
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
        aValue = a.items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * Number(item.item.price)), 0);
        bValue = b.items.reduce((sum: number, item: OrderItem) => sum + (item.quantity * Number(item.item.price)), 0);
      } else if (sortField === 'payment') {
        aValue = a.paymentMethod || '';
        bValue = b.paymentMethod || '';
      } else if (sortField === 'status') {
        aValue = a.paymentStatus || '';
        bValue = b.paymentStatus || '';
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
    // Use resolvedSearchParams instead of searchParams
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
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

  // Function to determine which sort icon to display
  const getSortIcon = (field: string) => {
    if (resolvedSearchParams.sort === field) {
      return resolvedSearchParams.order === 'asc'
        ? <ArrowUp className="ml-2 h-4 w-4 text-blue-600" />
        : <ArrowDown className="ml-2 h-4 w-4 text-blue-600" />;
    }
    return <ArrowUpDown className="ml-2 h-4 w-4" />;
  };

  // Extract available filter options from orders
  const paymentTypes = [...new Set(orders.map(order => order.paymentMethod || 'Unknown'))];
  const orderStatuses = [...new Set(orders.map(order => order.paymentStatus || 'Unknown'))];
  
  // Get unique items across all orders
  const uniqueItems = new Map();
  orders.forEach(order => {
    order.items.forEach(item => {
      uniqueItems.set(item.item.id, item.item.name);
    });
  });
  
  const availableItems = Array.from(uniqueItems).map(([id, name]) => ({
    id,
    name,
  }));

  // Get active filters
  const activeFilters = {
    paymentType: Array.isArray(resolvedSearchParams.paymentType)
      ? resolvedSearchParams.paymentType
      : resolvedSearchParams.paymentType ? [resolvedSearchParams.paymentType] : [],
    items: Array.isArray(resolvedSearchParams.items)
      ? resolvedSearchParams.items
      : resolvedSearchParams.items ? [resolvedSearchParams.items] : [],
    status: Array.isArray(resolvedSearchParams.status)
      ? resolvedSearchParams.status
      : resolvedSearchParams.status ? [resolvedSearchParams.status] : []
  };

  const totalActiveFilters =
    activeFilters.paymentType.length +
    activeFilters.items.length +
    activeFilters.status.length;

  // Function to create URL for clearing filters
  const createClearFiltersUrl = () => {
    const params = new URLSearchParams();
    
    // Preserve existing non-filter search params
    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
      if (!['paymentType', 'items', 'status'].includes(key) && value) {
        if (Array.isArray(value)) {
          value.forEach(v => params.append(key, v));
        } else {
          params.set(key, String(value));
        }
      }
    });
    
    return `?${params.toString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, <span className="text-blue-600">{organizationName}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          View all orders associated with <span className="font-semibold">{fundraiserName}</span>
        </p>
      </div>

      <Card className="rounded-lg shadow-md bg-[#F7F7F7]">
        <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
            <form>
              <Input
                className="w-64 h-10 pl-10 bg-white rounded-md border border-gray-300"
                placeholder="Search orders"
                name="search"
                defaultValue={resolvedSearchParams.search || ''}
              />
            </form>
          </div>
          <div className="flex gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-4">
                  <span>Filter</span>
                  <Filter className="h-4 w-4" />
                  {totalActiveFilters > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 rounded-sm px-1 font-normal"
                    >
                      {totalActiveFilters}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-4" align="end">
                <form method="get" action="">
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    {/* Preserve non-filter parameters */}
                    {Object.entries(resolvedSearchParams).map(([key, value]) => {
                      if (!['paymentType', 'items', 'status'].includes(key) && value !== undefined && key !== 'search') {
                        if (Array.isArray(value)) {
                          return value.map((v, i) => (
                            <input key={`${key}-${i}`} type="hidden" name={key} value={v} />
                          ));
                        } else {
                          return <input key={key} type="hidden" name={key} value={String(value)} />;
                        }
                      }
                      return null;
                    })}
                    
                    {/* Preserve search parameter */}
                    {resolvedSearchParams.search && (
                      <input type="hidden" name="search" value={String(resolvedSearchParams.search)} />
                    )}

                    {/* Payment Type Section */}
                    <div className="mb-4">
                      <h3 className="font-medium text-sm mb-2 text-muted-foreground">Payment Type</h3>
                      <div className="space-y-2">
                        {paymentTypes.map((type) => (
                          <div
                            key={type}
                            className="flex items-center space-x-2 rounded-md p-1"
                          >
                            <Checkbox
                              id={`payment-${type}`}
                              name="paymentType"
                              value={type}
                              defaultChecked={activeFilters.paymentType.includes(type)}
                            />
                            <label
                              htmlFor={`payment-${type}`}
                              className="flex flex-1 cursor-pointer select-none items-center justify-between text-sm"
                            >
                              {type}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Status Section */}
                    <div className="mb-4">
                      <h3 className="font-medium text-sm mb-2 text-muted-foreground">Order Status</h3>
                      <div className="space-y-2">
                        {orderStatuses.map((status) => (
                          <div
                            key={status}
                            className="flex items-center space-x-2 rounded-md p-1"
                          >
                            <Checkbox
                              id={`status-${status}`}
                              name="status"
                              value={status}
                              defaultChecked={activeFilters.status.includes(status)}
                            />
                            <label
                              htmlFor={`status-${status}`}
                              className="flex flex-1 cursor-pointer select-none items-center justify-between text-sm"
                            >
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Items Section */}
                    <div className="mb-4">
                      <h3 className="font-medium text-sm mb-2 text-muted-foreground">Items</h3>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto">
                        {availableItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center space-x-2 rounded-md p-1"
                          >
                            <Checkbox
                              id={`item-${item.id}`}
                              name="items"
                              value={item.id}
                              defaultChecked={activeFilters.items.includes(item.id)}
                            />
                            <label
                              htmlFor={`item-${item.id}`}
                              className="flex flex-1 cursor-pointer select-none items-center justify-between text-sm"
                            >
                              {item.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <a href={createClearFiltersUrl()} className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground hover:bg-primary/90 h-9 px-3">
                      Clear filters
                    </a>
                    <Button size="sm" type="submit">
                      Apply filters
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>
            <ExportButton orders={orders} fundraiserName={fundraiserName} />
          </div>
        </div>
        <div className="overflow-x-auto bg-[#F7F7F7]">
          <Table className="bg-[#F7F7F7] text-black">
            <TableHeader className="bg-[#C1C1C1]">
              <TableRow>
                <TableHead className="px-4 py-3 text-left text-black">
                  <a href={createSortUrl('status')} className="flex items-center text-black">
                    Status
                    {getSortIcon('status')}
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black">
                  <a href={createSortUrl('name')} className="flex items-center text-black">
                    Name
                    {getSortIcon('name')}
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black">Email</TableHead>
                <TableHead className="px-4 py-3 text-left text-black">
                  <a href={createSortUrl('netid')} className="flex items-center text-black">
                    NetId
                    {getSortIcon('netid')}
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black">Order Details</TableHead>
                <TableHead className="px-4 py-3 text-left text-black">
                  <a href={createSortUrl('payment')} className="flex items-center text-black">
                    Payment
                    {getSortIcon('payment')}
                  </a>
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black">
                  <a href={createSortUrl('total')} className="flex items-center text-black">
                    Order Total
                    {getSortIcon('total')}
                  </a>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4 text-black">
                    No orders available
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order: Order) => {
                  const orderTotal = order.items.reduce(
                    (total: number, item: OrderItem) => total + item.quantity * Number(item.item.price),
                    0
                  );
                  // Determine row color based on payment status
                  const isConfirmed = order.paymentStatus?.toLowerCase() === "confirmed";
                  
                  return (
                    <TableRow 
                      key={order.id} 
                      className={`hover:bg-gray-200 ${isConfirmed ? 'bg-[#C1C1C1]' : ''}`}
                    >
                      <TableCell className="px-4 py-3 text-black">
                        {order.paymentStatus || "Unknown"}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-black">{order.buyer?.name || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3 text-black">{order.buyer?.email || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3 text-black">{order.buyer?.email?.split('@')[0] || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3 text-black">
                        {order.items.map((item, index: number) => (
                          <div key={index}>
                            {item.quantity} {item.item.name}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-black">{order.paymentMethod || "Unknown"}</TableCell>
                      <TableCell className="px-4 py-3 font-medium text-black">${orderTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 text-sm text-muted-foreground bg-[#F7F7F7]">
          {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
        </div>
      </Card>
    </div>
  );
}