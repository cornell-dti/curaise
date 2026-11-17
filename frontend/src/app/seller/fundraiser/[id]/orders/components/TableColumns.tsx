// @STEVEN CHECK THIS FUNCTION

"use client";
import Link from "next/link";
import { ColumnDef, Table } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronDown,
  Copy,
  ExternalLink,
  MoreHorizontal,
  TriangleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
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
import {
  ORDER_CREATED_DATE_FORMAT,
  ORDER_CREATED_TIME_FORMAT,
} from "./ordersCsv";

type Order = z.infer<typeof CompleteOrderSchema>;

export type PickupChangeHandler = (orderId: string, pickedUp: boolean) => void;
export type PaymentConfirmedHandler = (orderId: string) => void;

// Quantity sits next to the item name so names can wrap without drifting out
// of line with a separate quantity column.
function OrderItemLines({ items }: { items: Order["items"] }) {
  return (
    <div className="flex flex-col gap-1.5 py-1 text-center leading-tight">
      {items.map((item) => (
        <div key={item.item.id}>
          <span className="tabular-nums text-muted-foreground">
            {item.quantity} ×
          </span>{" "}
          {item.item.name}
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

const statusBadgeClass =
  "flex items-center justify-center gap-0.5 whitespace-nowrap rounded-full py-1 pl-2.5 pr-1.5 font-[700] text-md";

const statusTriggerClass =
  "rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const PAYMENT_STATUS_OPTIONS = [
  {
    status: "CONFIRMED",
    label: "Received",
    className:
      "bg-[#DCEBDE] text-[#086A19] hover:bg-[#c5e0c6] hover:text-[#065a13]",
  },
  {
    status: "PENDING",
    label: "Not Received",
    className:
      "bg-[#FBE6E6] text-[#E1080B] hover:bg-[#f5c6c6] hover:text-[#b30607]",
  },
  {
    status: "UNVERIFIABLE",
    label: "Unverified",
    className:
      "bg-[#F7F7F7] text-[#959494] hover:bg-[#e5e5e5] hover:text-[#6e6e6e]",
  },
] as const;

const PICKUP_STATUS_OPTIONS = [
  {
    value: "true",
    label: "Picked Up",
    className:
      "bg-[#DCE8FB] text-[#1D5FAD] hover:bg-[#c2daf7] hover:text-[#174a87]",
  },
  {
    value: "false",
    label: "Not Picked Up",
    className:
      "bg-[#FFEEC2] text-[#FEA839] hover:bg-[#fddc9e] hover:text-[#d97a2b]",
  },
] as const;

// Shared by the Picked Up checkbox and the Pickup Status dropdown: marks an
// order picked up (warning first if payment is still pending) or undoes it.
function usePickupActions(
  order: Order,
  token: string,
  onPickupChange: PickupChangeHandler,
) {
  const [showWarning, setShowWarning] = useState(false);

  const { data } = useSWR(`/order/${order.id}`, authFetcher(CompleteOrderSchema), {
    fallbackData: order, // Use the original order data as fallback (default)
    revalidateOnFocus: false, // Don't revalidate on focus
    // The page already loaded every order, so don't refetch one per row
    revalidateOnMount: false,
  });

  const isPickedUp = data?.pickedUp === true;

  const markPickedUp = async () => {
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

  // Asks for confirmation first when the payment hasn't been received
  const requestPickup = () => {
    if (order.paymentStatus == "PENDING") {
      setShowWarning(true);
    } else {
      void markPickedUp();
    }
  };

  // The backend only allows this for a minute after the order was picked up
  const undoPickup = async () => {
    try {
      await mutationFetch(`/order/${order.id}/undo-pickup`, { token });
      onPickupChange(order.id, false);
      toast.success("Pickup undone");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleIgnore = () => {
    void (async () => {
      const succeeded = await markPickedUp();
      if (succeeded) {
        setShowWarning(false);
      }
    })();
  };

  const warningDialog = (
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
          <AlertDialogCancel onClick={() => setShowWarning(false)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleIgnore}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Ignore &amp; Check Off
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { isPickedUp, requestPickup, undoPickup, warningDialog };
}

// Component for the pickup status cell
export function PickupStatusCell({
  order,
  token,
  onPickupChange,
}: {
  order: Order;
  token: string;
  onPickupChange: PickupChangeHandler;
}) {
  const { isPickedUp, requestPickup, warningDialog } = usePickupActions(
    order,
    token,
    onPickupChange,
  );

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center gap-3">
        <Checkbox
          id={order.id}
          checked={isPickedUp}
          onChange={!isPickedUp ? requestPickup : undefined}
          disabled={isPickedUp}
          className="cursor-pointer"
        />
      </div>
      {warningDialog}
    </div>
  );
}

// Payment status badge. Clicking it opens a menu to mark the payment received.
const PaymentStatusCell = ({
  order,
  token,
  onPaymentConfirmed,
}: {
  order: Order;
  token: string;
  onPaymentConfirmed: PaymentConfirmedHandler;
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const { data } = useSWR(`/order/${order.id}`, authFetcher(CompleteOrderSchema), {
    fallbackData: order,
    revalidateOnFocus: false,
    revalidateOnMount: false,
  });

  const status = data?.paymentStatus ?? order.paymentStatus;
  const current =
    PAYMENT_STATUS_OPTIONS.find((option) => option.status === status) ??
    PAYMENT_STATUS_OPTIONS[1];

  const confirmPayment = async () => {
    setIsSaving(true);
    try {
      await mutationFetch(`/order/${order.id}/confirm-payment`, { token });
      onPaymentConfirmed(order.id);
      toast.success("Payment marked as received");
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "Failed to confirm payment",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isSaving}>
          <button
            type="button"
            aria-label={`Payment status: ${current.label}. Change`}
            className={statusTriggerClass}
          >
            <Badge className={cn(statusBadgeClass, current.className)}>
              {current.label}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuRadioGroup
            value={current.status}
            onValueChange={(value) => {
              if (value === "CONFIRMED" && status !== "CONFIRMED") {
                void confirmPayment();
              }
            }}
          >
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <DropdownMenuRadioItem
                key={option.status}
                value={option.status}
                // The backend only moves a payment forward to Received
                disabled={
                  option.status !== status && option.status !== "CONFIRMED"
                }
              >
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <p className="max-w-48 px-2 py-1.5 text-xs text-muted-foreground">
            {status === "CONFIRMED"
              ? "A received payment can't be changed back."
              : "A payment can only be marked as received."}
          </p>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// Pickup status badge. Clicking it opens a menu to change the pickup status.
const PickupStatusBadgeCell = ({
  order,
  token,
  onPickupChange,
}: {
  order: Order;
  token: string;
  onPickupChange: PickupChangeHandler;
}) => {
  const { isPickedUp, requestPickup, undoPickup, warningDialog } =
    usePickupActions(order, token, onPickupChange);
  const current = PICKUP_STATUS_OPTIONS[isPickedUp ? 0 : 1];

  return (
    <div className="flex justify-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Pickup status: ${current.label}. Change`}
            className={statusTriggerClass}
          >
            <Badge className={cn(statusBadgeClass, current.className)}>
              {current.label}
              <ChevronDown className="h-3 w-3" aria-hidden="true" />
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center">
          <DropdownMenuRadioGroup
            value={current.value}
            onValueChange={(value) => {
              if (value === current.value) return;
              if (value === "true") {
                requestPickup();
              } else {
                void undoPickup();
              }
            }}
          >
            {PICKUP_STATUS_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          {isPickedUp && (
            <>
              <DropdownMenuSeparator />
              <p className="max-w-48 px-2 py-1.5 text-xs text-muted-foreground">
                A pickup can be undone for 1 minute after it&apos;s marked.
              </p>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {warningDialog}
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
  onPaymentConfirmed: PaymentConfirmedHandler,
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
      return <div className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight">Picked Up</div>;
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
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex items-center justify-center text-center leading-tight">
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
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
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
  // Hidden column (see columnVisibility in OrdersTable). It only exists so the
  // search box can match on the full order ID.
  {
    accessorKey: "id",
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "createdAt",
    sortingFn: "datetime",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Created At
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="flex flex-col items-center whitespace-nowrap leading-tight">
        <span>
          <LocalDate
            date={row.original.createdAt}
            formatStr={ORDER_CREATED_DATE_FORMAT}
          />
        </span>
        <span className="text-muted-foreground">
          <LocalDate
            date={row.original.createdAt}
            formatStr={ORDER_CREATED_TIME_FORMAT}
          />
        </span>
      </div>
    ),
  },
  {
    accessorKey: "orderDetails",
    header: () => {
      return (
        <div className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight">Order Details</div>
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
    cell: ({ row }) => <OrderItemLines items={row.original.items} />,
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
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
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
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
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
        <div className="flex w-full items-center justify-center">
          <Button
            variant="ghost"
            className="h-auto whitespace-normal px-1 py-1 text-center leading-tight"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Status
            <ArrowUpDown className="ml-1 h-3 w-3" />
          </Button>
          <InfoTooltip
            content={
              <>
                • <strong>Received:</strong> Payment confirmed, either
                matched from Venmo or confirmed by a seller
                <br />• <strong>Not Received:</strong> Venmo payment not
                matched yet
                <br />• <strong>Unverified:</strong> Zelle or other payment
                that CURaise can&apos;t check. Confirm it from the order page
                once you&apos;ve been paid.
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
      return (
        <PaymentStatusCell
          order={order}
          token={token}
          onPaymentConfirmed={onPaymentConfirmed}
        />
      );
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
          className="flex h-auto w-full justify-center whitespace-normal px-1 py-1 text-center leading-tight"
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
      return (
        <PickupStatusBadgeCell
          order={order}
          token={token}
          onPickupChange={onPickupChange}
        />
      );
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
              <Link href={`/seller/order/${order.id}`}>
                View Order
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="pb-0 text-sm font-normal">
              Order ID
            </DropdownMenuLabel>
            <DropdownMenuItem
              aria-label={`Copy order ID ${order.id}`}
              className="gap-2 font-mono text-xs text-muted-foreground"
              onClick={() => {
                navigator.clipboard.writeText(order.id);
                toast.success("Order ID copied");
              }}
            >
              {order.id}
              <Copy className="ml-auto h-3 w-3 text-muted-foreground" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
