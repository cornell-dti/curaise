"use client";

import { useState } from "react";
import {
	ColumnDef,
	SortingState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getSortedRowModel,
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
import { Input } from "@/components/ui/input";
import { ReferralWithQuantities } from "./ReferralsTableColumns";

interface ReferralsTableProps<TValue> {
	columns: ColumnDef<ReferralWithQuantities, TValue>[];
	data: ReferralWithQuantities[];
	toolbar?: React.ReactNode;
}

export function ReferralsTable<TValue>({
	columns,
	data,
	toolbar,
}: ReferralsTableProps<TValue>) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "orderCount", desc: true }, // Referral with most order quantities default at the top
	]);
	const [globalFilter, setGlobalFilter] = useState("");

	// No pagination: sellers want to see every referrer at once
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		onGlobalFilterChange: setGlobalFilter,
		globalFilterFn: (row, _, filterValue) => {
			const name = row.original.referrer.name.toLowerCase();
			const email = row.original.referrer.email.toLowerCase();
			const search = filterValue.toLowerCase();
			return name.includes(search) || email.includes(search);
		},
		state: {
			sorting,
			globalFilter,
		},
	});

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3 py-4">
				<Input
					placeholder="Filter by name or netID"
					value={globalFilter ?? ""}
					onChange={(e) => setGlobalFilter(e.target.value)}
					className="max-w-sm rounded-lg border border-solid border-[#68b0ab]"
				/>
				{toolbar}
			</div>

			<div className="rounded-md border">
				<Table className="min-w-[600px]">
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
									data-state={row.getIsSelected() && "selected"}>
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
									className="h-24 text-center">
									No referrals found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
