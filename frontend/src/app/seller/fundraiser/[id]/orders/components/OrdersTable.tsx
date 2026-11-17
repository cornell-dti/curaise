// @STEVEN CHECK THIS FUNCTION

"use client";

import { useEffect, useState } from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	PaginationState,
	RowSelectionState,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
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
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "./ExportButton";
import { DataTableFacetedFilter } from "./DataTableFacetedFilter";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";

type Order = z.infer<typeof CompleteOrderSchema>;

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
// Page size used for the "All" option: larger than any fundraiser's order list
const ALL_ROWS_PAGE_SIZE = 100_000;

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
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 25,
	});
	const goToFirstPage = () =>
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));

	const table = useReactTable({
		data,
		columns,
		getRowId: (row) => row.id,
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		// Stay on the current page when an order updates (for example, marking a
		// pickup). Sorting, filtering, and searching go back to page 1 below.
		autoResetPageIndex: false,
		onSortingChange: (updater) => {
			setSorting(updater);
			goToFirstPage();
		},
		getSortedRowModel: getSortedRowModel(),
		// Changing a filter or the search clears the selection. Otherwise rows the
		// filter hides drop out of it and Export falls back to every visible row.
		onColumnFiltersChange: (updater) => {
			setColumnFilters(updater);
			setRowSelection({});
			goToFirstPage();
		},
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		onGlobalFilterChange: (updater) => {
			setGlobalFilter(updater);
			setRowSelection({});
			goToFirstPage();
		},
		onRowSelectionChange: setRowSelection,
		// The id column is only there so the search box can match order IDs
		initialState: { columnVisibility: { id: false } },
		state: {
			sorting,
			columnFilters,
			globalFilter,
			rowSelection,
			pagination,
		},
	});

	// If the last page empties out (orders removed, or a larger page size),
	// fall back to the new last page instead of showing an empty table.
	const pageCount = table.getPageCount();
	useEffect(() => {
		if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
			setPagination((prev) => ({
				...prev,
				pageIndex: Math.max(0, pageCount - 1),
			}));
		}
	}, [pagination.pageIndex, pageCount]);

	const resetFilters = () => {
		setColumnFilters([]);
		setGlobalFilter("");
		setRowSelection({});
		goToFirstPage();
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
					placeholder="Filter by name, netID, or order ID"
					value={globalFilter}
					onChange={(e) => table.setGlobalFilter(e.target.value)}
					className="max-w-sm rounded-lg border border-solid border-[#68b0ab]"
				/>
			</div>
			<div className="flex flex-wrap items-center gap-4">
				{/* Same order as the columns they filter appear in the table */}
				{table.getColumn("orderDetails") && data.length > 0 && (
					<DataTableFacetedFilter
						column={table.getColumn("orderDetails")}
						title="Item(s)"
						options={getUniqueItems(data)}
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
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											className={
												header.column.id === "select"
													? "pl-4 pr-2"
													: "whitespace-normal px-1"
											}>
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
												cell.column.id === "select" ? "pl-4 pr-2" : "px-1"
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

			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2 text-sm text-muted-foreground">
					<span id="orders-page-size-label">Rows per page</span>
					<Select
						value={
							pagination.pageSize === ALL_ROWS_PAGE_SIZE
								? "all"
								: String(pagination.pageSize)
						}
						onValueChange={(value) =>
							setPagination({
								pageIndex: 0,
								pageSize: value === "all" ? ALL_ROWS_PAGE_SIZE : Number(value),
							})
						}>
						<SelectTrigger
							className="h-8 w-[76px]"
							aria-labelledby="orders-page-size-label">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((size) => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
							<SelectItem value="all">All</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="flex items-center gap-2">
					<span className="text-sm tabular-nums text-muted-foreground">
						Page {pageCount === 0 ? 0 : pagination.pageIndex + 1} of{" "}
						{pageCount}
					</span>
					<Button
						variant="outline"
						size="sm"
						className="px-2"
						aria-label="First page"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}>
						<ChevronsLeft />
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}>
						Previous
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}>
						Next
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="px-2"
						aria-label="Last page"
						onClick={() => table.setPageIndex(pageCount - 1)}
						disabled={!table.getCanNextPage()}>
						<ChevronsRight />
					</Button>
				</div>
			</div>
		</div>
	);
}
