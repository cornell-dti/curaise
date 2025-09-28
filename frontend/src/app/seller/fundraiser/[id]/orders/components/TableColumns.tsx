// @STEVEN CHECK THIS FUNCTION

"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";
import { toast } from "sonner";

type Order = z.infer<typeof CompleteOrderSchema>;

// Component for the pickup status cell
const PickupStatusCell = ({
  order,
  token,
}: {
  order: Order;
  token: string;
}) => {
  const { data, mutate } = useSWR(`/order/${order.id}`, null, {
    fallbackData: order, // Use the original order data as fallback (default)
    revalidateOnFocus: false, // Don't revalidate on focus
  });

  // Triggers pickup status update when checkbox is clicked
  const togglePickedUp = async () => {
    try {
      await completePickup(order.id, token);

      // Mutate the cached data to reflect the updated status
      mutate(
        {
          ...data,
          pickedUp: true,
        },
        false // Without revalidation
      );

      toast.success("Pickup status updated successfully");
    } catch (error) {
      console.error("Error updating pickup status:", error);
      toast.error("Failed to update pickup status");
    }
  };
  // Check if the order is picked up
  const isPickedUp = data?.pickedUp === true;

  return (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={isPickedUp}
        onChange={!isPickedUp ? togglePickedUp : undefined}
        disabled={isPickedUp}
        aria-label={isPickedUp ? "Mark as not picked up" : "Mark as picked up"}
      />
    </div>
  );
};

// Component for the payment status cell
const PaymentStatusCell = ({ order }: { order: Order }) => {
  const { data } = useSWR(`/order/${order.id}`, null, {
    fallbackData: order,
    revalidateOnFocus: false,
  });

  const paymentStatus = data?.paymentStatus as string;
  const isPickedUp = data?.pickedUp === true;

  if (isPickedUp) {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#DCEBDE] text-[#086A19] rounded-full px-3 py-1 hover:bg-[#c5e0c6] hover:text-[#065a13] font-[700] text-md">
          Picked Up
        </Badge>
      </div>
    );
  } else if (paymentStatus === "UNVERIFIABLE") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#FBE6E6] text-[#E1080B] rounded-full px-3 py-1 hover:bg-[#f5c6c6] hover:text-[#b30607] font-[700] text-md">
          Unverifiable
        </Badge>
      </div>
    );
  } else if (paymentStatus === "PENDING") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#FFEEC2] text-[#FEA839] rounded-full px-3 py-1 hover:bg-[#fddc9e] hover:text-[#d97a2b] font-[700] text-md">
          Pending
        </Badge>
      </div>
    );
  } else if (paymentStatus === "CONFIRMED") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#FBE6E6] text-[#E1080B] rounded-full px-3 py-1 hover:bg-[#f5c6c6] hover:text-[#b30607] font-[700] text-md">
          Not Picked Up
        </Badge>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <Badge className="flex justify-center items-center min-w-[90px] bg-[#F7F7F7] text-[#959494] rounded-full px-3 py-1 font-[700] text-md hover:bg-[#e5e5e5] hover:text-[#6e6e6e]">
        Unknown
      </Badge>
    </div>
  );
};

// API call to complete pickup
// This function posts to the API to update the pickup status of an order
const completePickup = async (orderId: string, token: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/order/${orderId}/complete-pickup`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.message || "Failed to update pickup status");
  }

  return response.json();
};

// Create a function that returns columns with the token (access token)
export const getColumns = (token: string): ColumnDef<Order>[] => [
  {
    accessorKey: "pickedUp",
    header: () => {
      return <div className="flex justify-center w-full px-2">Picked Up</div>;
    },
    // filterFn params:
    // row: The current row being processed
    // id: The column id (e.g "pickedUp", "createdAt", etc.)
    // filterValue: The value being filtered (e.g. true, false)
    filterFn: (row, id, filterValue) => {
      const value = String(row.getValue(id));
      return filterValue.includes(value);
    },
    cell: ({ row }) => {
      const order = row.original;
      return <PickupStatusCell order={order} token={token} />;
    },
  },
  {
    accessorKey: "name",
    accessorFn: (row) => row.buyer.name,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.buyer.name}
      </div>
    ),
  },
  {
    accessorKey: "netid",
    accessorFn: (row) => row.buyer.email,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          NetID
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.original.buyer.email.split("@")[0]}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const createdAt = new Date(row.original.createdAt);
      const createdAtStr = `${createdAt.getFullYear()}-${String(
        createdAt.getMonth() + 1
      ).padStart(2, "0")}-${String(createdAt.getDate()).padStart(
        2,
        "0"
      )} ${String(createdAt.getHours()).padStart(2, "0")}:${String(
        createdAt.getMinutes()
      ).padStart(2, "0")}`;

      return (
        <div className="flex items-center justify-center">{createdAtStr}</div>
      );
    },
  },
  {
    accessorKey: "orderDetails",
    header: () => {
      return (
        <div className="flex justify-center w-full px-2">Order Details</div>
      );
    },
    // This function is used to extract the item names from the nested items
    accessorFn: (row) => {
      // This transforms the nested items into a simple array of names
      // that can be used for filtering
      return row.items.map((item) => item.item.name);
    },
    // Custom filter function for comparing arrays
    filterFn: (row, id, filterValue) => {
      if (!filterValue || !filterValue.length) return true;

      // Get the transformed data (already processed by accessorFn)
      const items = row.getValue(id);
      // Make sure items is always an array that has the includes method
      return (
        Array.isArray(items) &&
        filterValue.some((val: string) => items.includes(val))
      );
    },
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <div className="flex flex-col items-center justify-center">
          {items.map((item) => (
            <div
              key={`${item.item.id}-name`}
              className="py-1 w-full text-center"
            >
              {item.item.name}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => {
      const items = row.original.items;
      return (
        <div className="flex flex-col items-center justify-center">
          {items.map((item) => (
            <div
              key={`${item.item.id}-name`}
              className="py-1 w-full text-center"
            >
              {item.quantity}
            </div>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "orderTotal",
    accessorFn: (row) => {
      const items = row.items;
      return items.reduce(
        (total, item) => total + Number(item.item.price) * item.quantity,
        0
      );
    },
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Order Total
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const items = row.original.items;
      const orderTotal = items.reduce(
        (total, item) => total + Number(item.item.price) * item.quantity,
        0
      );
      return (
        <div className="flex items-center justify-center">
          ${orderTotal.toFixed(2)}
        </div>
      );
    },
  },
  {
    accessorKey: "paymentMethod",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Payment Method
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    filterFn: "arrIncludesSome",
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        {row.getValue("paymentMethod")}
      </div>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: () => {
      return (
        <div className="flex justify-center w-full px-2">Order Status</div>
      );
    },
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const order = row.original;
      return <PaymentStatusCell order={order} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(order.id)}
            >
              Copy order ID
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
