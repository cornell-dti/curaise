// @STEVEN CHECK THIS FUNCTION

"use client";

import { useState } from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	RowSelectionState,
	SortingState,
	flexRender,
	getCoreRowModel,
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

export function OrdersTable<TValue>({
	columns,
	data,
	fundraiserName,
}: OrderTableProps<TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [globalFilter, setGlobalFilter] = useState("");
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const table = useReactTable({
		data,
		columns,
		getRowId: (row) => row.id,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		// Every matching order stays on one list. Ten-row pages made Next/Previous
		// jump, and marking a pickup reset the seller to page 1.
		autoResetPageIndex: false,
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		onGlobalFilterChange: setGlobalFilter,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			globalFilter,
			rowSelection,
		},
	});

	const resetFilters = () => {
		setColumnFilters([]);
		setGlobalFilter("");
		setRowSelection({});
	};

	const filteredRows = table.getFilteredRowModel().rows;
	const selectedRows = table.getFilteredSelectedRowModel().rows;
	const exportRows = selectedRows.length > 0 ? selectedRows : filteredRows;
	const filteredCount = filteredRows.length;
	const selectedCount = selectedRows.length;
	const totalCount = data.length;
	const matchLabel =
		filteredCount === totalCount
			? `${totalCount} ${totalCount === 1 ? "order" : "orders"}`
			: `${filteredCount} of ${totalCount} orders`;
	const countLabel =
		selectedCount > 0 ? `${selectedCount} selected · ${matchLabel}` : matchLabel;

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
					value={globalFilter}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-sm rounded-lg border border-solid border-[#68b0ab]"
				/>
			</div>
			<div className="flex flex-wrap items-center gap-4">
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
							{ label: "ZELLE", value: "ZELLE" },
							{ label: "OTHER", value: "OTHER" },
						]}
					/>
				)}
				{table.getColumn("paymentStatus") && (
					<DataTableFacetedFilter
						column={table.getColumn("paymentStatus")}
						title="Payment Status"
						options={[
							{ label: "Received", value: "Received" },
							{ label: "Not Received", value: "Not Received" },
							{ label: "Unverified", value: "Unverified" },
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
				<p className="text-sm text-muted-foreground" aria-live="polite">
					{countLabel}
				</p>
				<div className="ml-auto space-x-2">
					<ExportButton
						orders={exportRows.map((row) => row.original)}
						fundraiserName={fundraiserName}
						label={
							selectedCount > 0
								? `Export ${selectedCount} selected`
								: "Export"
						}
					/>
					<Button
						variant="outline"
						onClick={resetFilters}
						className="rounded-lg border border-solid border-[#68b0ab]">
						Reset
					</Button>
				</div>
			</div>

			<div className="rounded-md border">
				<Table className="min-w-[1200px]">
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
														header.getContext(),
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
									data-state={row.getIsSelected() && "selected"}>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={
												cell.column.id === "orderDetails" ||
												cell.column.id === "quantity"
													? "align-top"
													: undefined
											}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center">
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
