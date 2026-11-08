// @STEVEN CHECK THIS FUNCTION

"use client";
import Link from "next/link";
import { ColumnDef, Table } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, TriangleAlert } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown } from "lucide-react";
import { InfoTooltip } from "@/components/custom/MoreInfoToolTip";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";
import { toast } from "sonner";
import {
  getErrorMessage,
  showPickupUndoToast,
} from "@/components/custom/PickupUndoToast";
import { authFetcher, mutationFetch } from "@/lib/fetcher";
import { useEffect, useRef, useState } from "react";
import { LocalDate } from "@/components/ui/LocalDate";
import { getOrderBuyer } from "@/lib/order-buyer";
import { ORDER_CREATED_AT_FORMAT } from "./ordersCsv";

type Order = z.infer<typeof CompleteOrderSchema>;

export type PickupChangeHandler = (orderId: string, pickedUp: boolean) => void;

const orderItemLineClass =
  "flex min-h-10 items-center justify-center whitespace-nowrap px-2 py-1 text-center";

function OrderItemLines({ lines }: { lines: { key: string; text: string }[] }) {
  return (
    <div className="flex flex-col">
      {lines.map((line) => (
        <div key={line.key} className={orderItemLineClass}>
          {line.text}
        </div>
      ))}
    </div>
  );
}

function SelectAllCheckbox({ table }: { table: Table<Order> }) {
  const ref = useRef<HTMLInputElement>(null);
  const allSelected = table.getIsAllRowsSelected();
  const someSelected = table.getIsSomeRowsSelected();

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = someSelected && !allSelected;
    }
  }, [allSelected, someSelected]);

  return (
    <Checkbox
      ref={ref}
      checked={allSelected}
      onChange={table.getToggleAllRowsSelectedHandler()}
      aria-label="Select all orders"
      disabled={table.getRowModel().rows.length === 0}
    />
  );
}

// Component for the pickup status cell
export function PickupStatusCell({
  order,
  token,
  onPickupChange,
}: {
  order: z.infer<typeof CompleteOrderSchema>;
  token: string;
  onPickupChange: PickupChangeHandler;
}) {
  const [showWarning, setShowWarning] = useState(false);

  const { data } = useSWR(`/order/${order.id}`, authFetcher(CompleteOrderSchema), {
    fallbackData: order, // Use the original order data as fallback (default)
    revalidateOnFocus: false, // Don't revalidate on focus
  });

  // Check if the order is picked up
  const isPickedUp = data?.pickedUp === true;

  // Handle checkbox changes only if its not checked off yet
  function handleCheckboxChange() {
    if (order.paymentStatus == "PENDING") {
      setShowWarning(true);
    } else {
      void togglePickedUp();
    }
  }

  // Check off the box, ignoring the warning
  function handleIgnore() {
    void (async () => {
      const succeeded = await togglePickedUp();
      if (succeeded) {
        setShowWarning(false);
      }
    })();
  }
  function handleCancel() {
    setShowWarning(false);
  }

  // Triggers pickup status update when checkbox is clicked
  const togglePickedUp = async () => {
    try {
      await completePickup(order.id, token, () =>
        onPickupChange(order.id, false),
      );
      onPickupChange(order.id, true);
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error));
      return false;
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Checkbox
          id={order.id}
          checked={isPickedUp}
          onChange={!isPickedUp ? handleCheckboxChange : undefined}
          disabled={isPickedUp}
          className="cursor-pointer"
        />
      </div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                <TriangleAlert className="size-5" />
              </div>
              <AlertDialogTitle>Payment Not Confirmed</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-2">
              This order&apos;s payment must be confirmed before it can be
              checked off. Are you sure you want to proceed without confirming
              payment?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleIgnore}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Ignore &amp; Check Off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Component for the payment status cell (received / not received / unverified)
const PaymentStatusCell = ({ order }: { order: Order }) => {
  const { data } = useSWR(`/order/${order.id}`, authFetcher(CompleteOrderSchema), {
    fallbackData: order,
    revalidateOnFocus: false,
  });

  const paymentStatus = data?.paymentStatus as string;

  if (paymentStatus === "CONFIRMED") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#DCEBDE] text-[#086A19] rounded-full px-3 py-1 hover:bg-[#c5e0c6] hover:text-[#065a13] font-[700] text-md">
          Received
        </Badge>
      </div>
    );
  } else if (paymentStatus === "UNVERIFIABLE") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#F7F7F7] text-[#959494] rounded-full px-3 py-1 hover:bg-[#e5e5e5] hover:text-[#6e6e6e] font-[700] text-md">
          Unverified
        </Badge>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <Badge className="flex justify-center items-center min-w-[90px] bg-[#FBE6E6] text-[#E1080B] rounded-full px-3 py-1 hover:bg-[#f5c6c6] hover:text-[#b30607] font-[700] text-md">
        Not Received
      </Badge>
    </div>
  );
};

// Component for the pickup status badge cell (picked up / not picked up)
const PickupStatusBadgeCell = ({ order }: { order: Order }) => {
  const { data } = useSWR(`/order/${order.id}`, authFetcher(CompleteOrderSchema), {
    fallbackData: order,
    revalidateOnFocus: false,
  });

  const isPickedUp = data?.pickedUp === true;

  if (isPickedUp) {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#DCE8FB] text-[#1D5FAD] rounded-full px-3 py-1 hover:bg-[#c2daf7] hover:text-[#174a87] font-[700] text-md">
          Picked Up
        </Badge>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <Badge className="flex justify-center items-center min-w-[90px] bg-[#FFEEC2] text-[#FEA839] rounded-full px-3 py-1 hover:bg-[#fddc9e] hover:text-[#d97a2b] font-[700] text-md">
        Not Picked Up
      </Badge>
    </div>
  );
};

// API call to complete pickup
// This function posts to the API to update the pickup status of an order
const completePickup = async (
  orderId: string,
  token: string,
  onUndone: () => void,
) => {
  await mutationFetch(`/order/${orderId}/complete-pickup`, { token });
  showPickupUndoToast(orderId, token, onUndone);
};

// Create a function that returns columns with the token (access token)
export const getColumns = (
  token: string,
  onPickupChange: PickupChangeHandler,
): ColumnDef<Order>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <SelectAllCheckbox table={table} />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select order for ${getOrderBuyer(row.original).name}`}
        />
      </div>
    ),
    enableSorting: false,
    enableColumnFilter: false,
  },
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
      return (
        <PickupStatusCell
          order={order}
          token={token}
          onPickupChange={onPickupChange}
        />
      );
    },
  },
  {
    accessorKey: "name",
    accessorFn: (row) => getOrderBuyer(row).name,
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
      <div className="flex items-center justify-center whitespace-nowrap">
        {getOrderBuyer(row.original).name}
      </div>
    ),
  },
  {
    accessorKey: "netid",
    accessorFn: (row) => getOrderBuyer(row).netId,
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
        {getOrderBuyer(row.original).netId}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    sortingFn: "datetime",
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
    cell: ({ row }) => (
      <div className="flex items-center justify-center whitespace-nowrap">
        <LocalDate
          date={row.original.createdAt}
          formatStr={ORDER_CREATED_AT_FORMAT}
        />
      </div>
    ),
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
    cell: ({ row }) => (
      <OrderItemLines
        lines={row.original.items.map((item) => ({
          key: `${item.item.id}-name`,
          text: item.item.name,
        }))}
      />
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
    cell: ({ row }) => (
      <OrderItemLines
        lines={row.original.items.map((item) => ({
          key: `${item.item.id}-qty`,
          text: String(item.quantity),
        }))}
      />
    ),
  },
  {
    accessorKey: "orderTotal",
    accessorFn: (row) => {
      const items = row.items;
      return items.reduce(
        (total, item) => total + Number(item.item.price) * item.quantity,
        0,
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
        0,
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
    // Return the displayed status for sorting (matches what user sees)
    accessorFn: (row) => {
      if (row.paymentStatus === "CONFIRMED") return "Received";
      if (row.paymentStatus === "UNVERIFIABLE") return "Unverified";
      return "Not Received";
    },
    header: ({ column }) => {
      return (
        <div className="flex items-center justify-center w-full px-2 gap-1">
          <Button
            variant="ghost"
            className="px-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Status
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <InfoTooltip
            content={
              <>
                • <strong>Received:</strong> Payment confirmed
                <br />• <strong>Not Received:</strong> Payment not yet verified
                <br />• <strong>Unverified:</strong> Payment can&apos;t be verified (cash/manual order), but can be picked up
              </>
            }
            size={18}
          />
        </div>
      );
    },
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const order = row.original;
      return <PaymentStatusCell order={order} />;
    },
  },
  {
    id: "pickupStatus",
    // Return the displayed status for sorting (matches what user sees)
    accessorFn: (row) => (row.pickedUp ? "Picked Up" : "Not Picked Up"),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex justify-center w-full px-2"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Pickup Status
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    filterFn: "arrIncludesSome",
    cell: ({ row }) => {
      const order = row.original;
      return <PickupStatusBadgeCell order={order} />;
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
            <DropdownMenuItem asChild>
              <Link href={`/seller/order/${order.id}`}>View Order</Link>
            </DropdownMenuItem>
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
