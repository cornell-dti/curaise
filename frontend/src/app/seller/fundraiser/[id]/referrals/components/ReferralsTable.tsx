"use client";

import { useMemo, useState } from "react";
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
import {
	CELL_CLASS,
	HEAD_CLASS,
	CONFIRMED_COLUMN_FOR,
	ReferralWithQuantities,
} from "./ReferralsTableColumns";

interface ReferralsTableProps<TValue> {
	columns: ColumnDef<ReferralWithQuantities, TValue>[];
	data: ReferralWithQuantities[];
	includePending: boolean;
	toolbar?: React.ReactNode;
}

export function ReferralsTable<TValue>({
	columns,
	data,
	includePending,
	toolbar,
}: ReferralsTableProps<TValue>) {
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "totalOrderCount", desc: true }, // Referral with most order quantities default at the top
	]);
	const [globalFilter, setGlobalFilter] = useState("");

	const visibleSorting = useMemo(
		() =>
			includePending
				? sorting
				: sorting.map((sort) => ({
						...sort,
						id: CONFIRMED_COLUMN_FOR[sort.id] ?? sort.id,
				  })),
		[sorting, includePending]
	);
	const columnVisibility = useMemo(
		() =>
			Object.fromEntries(
				Object.keys(CONFIRMED_COLUMN_FOR).map((id) => [id, includePending])
			),
		[includePending]
	);

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
			sorting: visibleSorting,
			globalFilter,
			columnVisibility,
		},
	});
	const headerGroups = table.getHeaderGroups();

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
				<Table className={includePending ? "min-w-[820px]" : "min-w-[600px]"}>
					<TableHeader>
						{headerGroups.map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									if (headerGroup.depth > 0 && header.column.depth === 0) {
										return null;
									}
									return (
										<TableHead
											key={header.id}
											colSpan={header.colSpan}
											rowSpan={
												header.isPlaceholder ? headerGroups.length : undefined
											}
											className={HEAD_CLASS[header.column.id]}>
											{flexRender(
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
										<TableCell
											key={cell.id}
											className={CELL_CLASS[cell.column.id]}>
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
									colSpan={table.getVisibleLeafColumns().length}
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
