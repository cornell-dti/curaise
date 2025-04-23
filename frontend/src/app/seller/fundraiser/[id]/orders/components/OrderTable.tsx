"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ChevronsDownUp, ChevronUp, ChevronDown, Search } from "lucide-react";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";
import { toast } from "sonner";
import useSWR from "swr";
import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
// } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ExportButton } from "@/app/seller/fundraiser/[id]/orders/components/ExportButton";

type Order = z.infer<typeof CompleteOrderSchema>;
type OrderItem = Order['items'][0];

function PickupButton({
  order,
  token,
  onSuccess,
  className,
}: {
  order: Order;
  token: string;
  onSuccess?: () => void;
  className?: string;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const { data, mutate } = useSWR(
    `/order/${order.id}`,
    null,
    {
      fallbackData: order,
      revalidateOnFocus: false,
    }
  );

  const isPickedUp = data.pickedUp;

  async function markAsPickedUp() {
    if (isPickedUp) return; // Already picked up, do nothing

    setIsLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/order/${order.id}/complete-pickup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message || "Failed to update pickup status");
      } else {
        mutate(
          {
            ...data,
            pickedUp: true,
          },
          false
        );

        toast.success("Order marked as picked up");
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      toast.error("An error occurred while updating pickup status");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className || ""}`}>
      <Checkbox
        id={`pickup-${order.id}`}
        checked={isPickedUp}
        onChange={() => markAsPickedUp()}
        disabled={isLoading || isPickedUp}
        className="h-5 w-5 cursor-pointer"
      />
      <label
        htmlFor={`pickup-${order.id}`}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 select-none cursor-pointer"
      ></label>
    </div>
  );
}

export function OrderTable({
  orders,
  resolvedSearchParams,
  token,
  fundraiserName,
  // Filter-related props
  paymentTypes,
  statuses,
  itemsList,
  selectedPaymentTypes,
  selectedStatuses,
  selectedItems,
  selectedPickupStatuses,
}: {
  orders: Order[];
  resolvedSearchParams: {
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    paymentType?: string[];
    items?: string[];
    status?: string[];
    pickupStatus?: string[];
  };
  fundraiserName: string;
  token: string;
  paymentTypes: string[];
  statuses: string[];
  itemsList: string[];
  selectedPaymentTypes: string[];
  selectedStatuses: string[];
  selectedItems: string[];
  selectedPickupStatuses: string[];
}) {
  // State for selected order (for sheet display)
  // const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Calculate total selected filters
  const totalSelectedFilters =
    selectedPaymentTypes.length +
    selectedStatuses.length +
    selectedItems.length +
    selectedPickupStatuses.length;

  // Define pickup status options
  const pickupStatuses = [
    { value: "true", label: "Picked Up" },
    { value: "false", label: "Not Picked Up" }
  ];

  // Handle filter reset
  const handleReset = () => {
    // Create and submit a form that goes to the same URL without any filters
    const form = document.createElement('form');
    form.method = 'get';
    form.action = '';

    // Preserve search and sort if they exist
    if (resolvedSearchParams.search) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'search';
      input.value = resolvedSearchParams.search;
      form.appendChild(input);
    }

    if (resolvedSearchParams.sort) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'sort';
      input.value = resolvedSearchParams.sort;
      form.appendChild(input);
    }

    if (resolvedSearchParams.order) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'order';
      input.value = resolvedSearchParams.order;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  const createSortUrl = (field: string): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearchParams)) {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    if (params.get('sort') === field) {
      params.set('order', params.get('order') === 'asc' ? 'desc' : 'asc');
    } else {
      params.set('sort', field);
      params.set('order', 'asc');
    }
    return `?${params.toString()}`;
  };

  const getSortIcon = (field: string) => {
    if (resolvedSearchParams.sort === field) {
      return resolvedSearchParams.order === 'asc'
        ? <ChevronUp className="ml-2 h-4 w-4 text-blue-600" />
        : <ChevronDown className="ml-2 h-4 w-4 text-blue-600" />;
    }
    return <ChevronsDownUp className="ml-2 h-4 w-4" />;
  };

  const getOrderStatusBadge = (order: Order) => {
    const isPaid = order.paymentStatus?.toLowerCase() === "confirmed";
    const isPickedUp = order.pickedUp === true;

    if (isPaid && isPickedUp) {
      return (
        <Badge className="bg-[#DCEBDE] text-[#086A19] rounded-full px-3 py-1 hover:bg-[#c5e0c6] hover:text-[#065a13] font-[700] text-md">
          <span className="inline-block w-3 h-3 mr-3 bg-[#086A19] rounded-full hover:bg-[#065a13]"></span>
          Fulfilled
        </Badge>
      );
    } else if (!isPaid) {
      return (
        <Badge className="bg-[#FBE6E6] text-[#E1080B] rounded-full px-3 py-1 hover:bg-[#f5c6c6] hover:text-[#b30607] font-[700] text-md">
          <span className="inline-block w-3 h-3 mr-3 bg-[#E1080B] rounded-full hover:bg-[#b30607]"></span>
          Unfulfilled
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-[#FFEEC2] text-[#FEA839] rounded-full px-3 py-1 hover:bg-[#fddc9e] hover:text-[#d97a2b] font-[700] text-md">
          <span className="inline-block w-3 h-3 mr-3 bg-[#FEA839] rounded-full hover:bg-[#d97a2b]"></span>
          Pending
        </Badge>
      );
    }
  };

  // Apply filters to the orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Apply search filter
    if (resolvedSearchParams.search) {
      const searchTerm = resolvedSearchParams.search.toLowerCase();
      result = result.filter(order =>
        order.buyer?.name?.toLowerCase().includes(searchTerm) ||
        order.buyer?.email?.toLowerCase().includes(searchTerm) ||
        order.items.some(item => item.item.name.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by payment type
    if (resolvedSearchParams.paymentType && resolvedSearchParams.paymentType.length > 0) {
      const paymentTypes = Array.isArray(resolvedSearchParams.paymentType)
        ? resolvedSearchParams.paymentType
        : [resolvedSearchParams.paymentType];

      result = result.filter(order =>
        paymentTypes.includes(order.paymentMethod || "Unknown")
      );
    }

    // Filter by status
    if (resolvedSearchParams.status && resolvedSearchParams.status.length > 0) {
      const statuses = Array.isArray(resolvedSearchParams.status)
        ? resolvedSearchParams.status
        : [resolvedSearchParams.status];

      result = result.filter(order =>
        statuses.includes(order.paymentStatus || "Unknown")
      );
    }

    // Filter by pickup status
    if (resolvedSearchParams.pickupStatus && resolvedSearchParams.pickupStatus.length > 0) {
      const pickupStatuses = Array.isArray(resolvedSearchParams.pickupStatus)
        ? resolvedSearchParams.pickupStatus
        : [resolvedSearchParams.pickupStatus];

      result = result.filter(order => {
        // Convert pickup status to string for comparison
        const isPickedUp = order.pickedUp === true ? "true" : "false";
        return pickupStatuses.includes(isPickedUp);
      });
    }

    // Filter by items
    if (resolvedSearchParams.items && resolvedSearchParams.items.length > 0) {
      const items = Array.isArray(resolvedSearchParams.items)
        ? resolvedSearchParams.items
        : [resolvedSearchParams.items];

      result = result.filter(order =>
        order.items.some(item =>
          items.includes(item.item.name)
        )
      );
    }

    // Apply sorting
    if (resolvedSearchParams.sort) {
      const isAsc = resolvedSearchParams.order !== 'desc';

      result.sort((a, b) => {
        let valueA, valueB;

        switch (resolvedSearchParams.sort) {
          case 'name':
            valueA = a.buyer?.name || '';
            valueB = b.buyer?.name || '';
            break;
          case 'status':
            valueA = a.paymentStatus || '';
            valueB = b.paymentStatus || '';
            break;
          case 'netid':
            valueA = a.buyer?.email?.split('@')[0] || '';
            valueB = b.buyer?.email?.split('@')[0] || '';
            break;
          case 'payment':
            valueA = a.paymentMethod || '';
            valueB = b.paymentMethod || '';
            break;
          case 'total':
            valueA = a.items.reduce(
              (total: number, item: OrderItem) => total + item.quantity * Number(item.item.price),
              0
            );
            valueB = b.items.reduce(
              (total: number, item: OrderItem) => total + item.quantity * Number(item.item.price),
              0
            );
            break;
          default:
            return 0;
        }

        if (valueA < valueB) return isAsc ? -1 : 1;
        if (valueA > valueB) return isAsc ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [orders, resolvedSearchParams]);

  return (
    <div className="bg-[#F7F7F7]">
      {/* Header controls */}
      <div className="p-4 flex justify-between items-center bg-[#F7F7F7]">
        {/* Search Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#959494]" />
          <form>
            <Input
              className="w-64 h-8 pl-10 bg-white rounded-lg border border-[#68B0AB] text-[#959494] text-xs font-light"
              placeholder="Search Orders"
              name="search"
              defaultValue={resolvedSearchParams.search || ''}
            />
          </form>
        </div>

        <div className="flex gap-3">
          {/* Export Button */}
          <ExportButton orders={orders} fundraiserName={fundraiserName} />

          {/* Filter Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="shadow-none h-8 px-4 font-[400] bg-[#68b0ab] rounded-lg text-white border-[#68b0ab]">
                <span>Filter</span>
                <ChevronDown className="h-4 w-4" />
                {totalSelectedFilters > 0 && (
                  <span className="ml-1 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {totalSelectedFilters}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-4" align="end">
              <form action="" method="get">
                {/* Preserve existing search and sort params */}
                {resolvedSearchParams.search && (
                  <input type="hidden" name="search" value={resolvedSearchParams.search} />
                )}
                {resolvedSearchParams.sort && (
                  <input type="hidden" name="sort" value={resolvedSearchParams.sort} />
                )}
                {resolvedSearchParams.order && (
                  <input type="hidden" name="order" value={resolvedSearchParams.order} />
                )}

                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Payment Type</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {paymentTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`paymentType-${type}`}
                          name="paymentType"
                          value={type}
                          defaultChecked={selectedPaymentTypes.includes(type)}
                        />
                        <Label htmlFor={`paymentType-${type}`}>{type}</Label>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-medium text-sm">Payment Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {statuses.map((status) => (
                      <div key={status} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${status}`}
                          name="status"
                          value={status}
                          defaultChecked={selectedStatuses.includes(status)}
                        />
                        <Label htmlFor={`status-${status}`}>{status}</Label>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-medium text-sm">Pickup Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {pickupStatuses.map((status) => (
                      <div key={status.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`pickupStatus-${status.value}`}
                          name="pickupStatus"
                          value={status.value}
                          defaultChecked={selectedPickupStatuses.includes(status.value)}
                        />
                        <Label htmlFor={`pickupStatus-${status.value}`}>{status.label}</Label>
                      </div>
                    ))}
                  </div>

                  <h4 className="font-medium text-sm">Items</h4>
                  <div className="space-y-2">
                    {itemsList.map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`item-${item}`}
                          name="items"
                          value={item}
                          defaultChecked={selectedItems.includes(item)}
                        />
                        <Label htmlFor={`item-${item}`}>{item}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleReset}
                    >
                      Reset
                    </Button>
                    <Button type="submit">Apply Filters</Button>
                  </div>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Order Table */}
      <div className="overflow-x-auto">
        <Table className="bg-[#f7f7f7] text-black border-separate border-spacing-y-1">
          <TableHeader className="bg-[#ffffff] mb-3">
            <TableRow>
              <TableHead className="px-4 py-3 text-center text-black font-[400]">
                Picked Up
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-black font-[400]">
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  window.location.href = createSortUrl('name');
                }} className="flex items-center text-black">
                  Name
                  {getSortIcon('name')}
                </a>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-black font-[400]">NetId</TableHead>
              <TableHead className="px-4 py-3 text-left text-black font-[400]">
                <a href="#" onClick={(e) => {
                  e.preventDefault();
                  window.location.href = createSortUrl('total');
                }} className="flex items-center text-black">
                  Order Total
                  {getSortIcon('total')}
                </a>
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-black font-[400]">
                Order Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-black font-[400]">
                  No orders available
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: Order) => {
                const orderTotal = order.items.reduce(
                  (total: number, item: OrderItem) => total + item.quantity * Number(item.item.price),
                  0
                );

                return (
                  <TableRow
                    key={order.id}
                    className={`hover:bg-gray-200 bg-white`}
                  >
                    {/* Status Badge */}
                    <TableCell className="px-4 py-3 text-black text-center" onClick={(e) => e.stopPropagation()}>
                      <PickupButton order={order} token={token} onSuccess={() => window.location.reload()} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-black font-[400]">{order.buyer?.name || "Unknown"}</TableCell>
                    <TableCell className="px-4 py-3 text-black font-[400]">{order.buyer?.email?.split('@')[0] || "Unknown"}</TableCell>
                    <TableCell className="px-4 py-3 text-black font-[400]">${orderTotal.toFixed(2)}</TableCell>
                    <TableCell className="px-4 py-3 text-black">
                      {getOrderStatusBadge(order)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet for displaying order items
      <Sheet open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Order Details</SheetTitle>
            <SheetDescription>
              {selectedOrder && (
                <span>Order for {selectedOrder.buyer?.name || "Unknown"}</span>
              )}
            </SheetDescription>
          </SheetHeader>
          {selectedOrder && (
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-medium text-sm mb-2">Contact Information</h3>
                <p className="text-sm text-muted-foreground">
                  Email: {selectedOrder.buyer?.email || "Unknown"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Payment Details</h3>
                <p className="text-sm text-muted-foreground">
                  Method: {selectedOrder.paymentMethod || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: {selectedOrder.paymentStatus || "Unknown"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Pickup Status</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.pickedUp ? "Picked Up" : "Not Picked Up"}
                </p>
              </div>

              <div>
                <h3 className="font-medium text-sm mb-2">Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center pb-2">
                      <div>
                        <p className="font-medium">{item.item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.item.description}</p>
                      </div>
                      <div className="text-right">
                        <p>{item.quantity} × ${Number(item.item.price).toFixed(2)}</p>
                        <p className="font-medium">${(item.quantity * Number(item.item.price)).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t font-medium">
                <span>Total</span>
                <span>${selectedOrder.items.reduce(
                  (total, item) => total + item.quantity * Number(item.item.price),
                  0
                ).toFixed(2)}</span>
              </div>

              <div className="pt-4">
                {selectedOrder && !selectedOrder.pickedUp && (
                  <Button
                    className="w-full mb-2 bg-gray-700 text-white hover:bg-gray-800"
                    onClick={async () => {
                      const pickupButton = document.getElementById(`pickup-${selectedOrder.id}`);
                      if (pickupButton) {
                        pickupButton.click();
                      }
                      setSelectedOrder(null); // Close the sheet after clicking
                      window.location.reload(); // Refresh the table
                    }}
                  >
                    Mark as Picked Up
                  </Button>
                )}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet> */}
    </div>
  );
}
