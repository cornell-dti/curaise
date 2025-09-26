// @STEVEN CHECK THIS FUNCTION

"use client";

import { useState } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExportButton } from "./ExportButton";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";

type Order = z.infer<typeof CompleteOrderSchema>;

interface OrderTableProps<TValue> {
  columns: ColumnDef<Order, TValue>[];
  data: Order[];
  fundraiserName: string;
}

export function OrderTable2<TValue>({
  columns,
  data,
  fundraiserName,
}: OrderTableProps<TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [globalFilter, setGlobalFilter] = useState<any>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  const resetFilters = () => {
    setColumnFilters([]);
    setGlobalFilter("");
  };

  // Get all unique items
  const getUniqueItems = (orders: Order[]) => {
    const uniqueItems = new Set<string>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        uniqueItems.add(item.item.name);
      });
    });
    return Array.from(uniqueItems).map((name) => ({
      label: name,
      value: name,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter by name or netID"
          value={globalFilter ?? ""}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            table.setGlobalFilter(String(e.target.value));
          }}
          className="max-w-sm rounded-lg border border-solid border-[#68b0ab]"
        />
      </div>
      <div className="flex flex-wrap gap-4">
        {table.getColumn("pickedUp") && (
          <DataTableFacetedFilter
            column={table.getColumn("pickedUp")}
            title="Pickup Status"
            options={[
              { label: "Picked Up", value: "true" },
              { label: "Not Picked Up", value: "false" },
            ]}
          />
        )}
        {table.getColumn("paymentMethod") && (
          <DataTableFacetedFilter
            column={table.getColumn("paymentMethod")}
            title="Payment Type"
            options={[
              { label: "VENMO", value: "VENMO" },
              { label: "OTHER", value: "OTHER" },
            ]}
          />
        )}
        {table.getColumn("paymentStatus") && (
          <DataTableFacetedFilter
            column={table.getColumn("paymentStatus")}
            title="Payment Status"
            options={[
              { label: "CONFIRMED", value: "CONFIRMED" },
              { label: "UNVERIFIABLE", value: "UNVERIFIABLE" },
              { label: "PENDING", value: "PENDING" },
            ]}
          />
        )}
        {table.getColumn("orderDetails") && data.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn("orderDetails")}
            title="Item(s)"
            options={getUniqueItems(data)}
          />
        )}
        <div className="ml-auto space-x-2">
          <ExportButton orders={data} fundraiserName={fundraiserName} />
          <Button
            variant="outline"
            onClick={resetFilters}
            className="rounded-lg border border-solid border-[#68b0ab]"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
