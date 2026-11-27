"use client";

import { memo, useMemo, useState } from "react";
import {
	Cell,
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
import { FoldX } from "../../components/Fold";
import {
	CELL_CLASS,
	HEAD_CLASS,
	CONFIRMED_COLUMN_FOR,
	ReferralWithQuantities,
} from "./ReferralsTableColumns";

const CELL_PADDING_PX = 8;
const MIN_WIDTH_PX = { confirmedOnly: 600, withPending: 820 };

const CellContent = memo(function CellContent({
	cell,
}: {
	cell: Cell<ReferralWithQuantities, unknown>;
}) {
	return flexRender(cell.column.columnDef.cell, cell.getContext());
});

interface ReferralsTableProps<TValue> {
	columns: ColumnDef<ReferralWithQuantities, TValue>[];
	data: ReferralWithQuantities[];
	includePending: boolean;
	pendingProgress: number;
	toolbar?: React.ReactNode;
}

export function ReferralsTable<TValue>({
	columns,
	data,
	includePending,
	pendingProgress,
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
	const showPendingColumns = pendingProgress > 0;
	const columnVisibility = useMemo(
		() =>
			Object.fromEntries(
				Object.keys(CONFIRMED_COLUMN_FOR).map((id) => [id, showPendingColumns])
			),
		[showPendingColumns]
	);
	const foldingStyle = (columnId: string) =>
		columnId in CONFIRMED_COLUMN_FOR && pendingProgress < 1
			? {
					paddingLeft: CELL_PADDING_PX * pendingProgress,
					paddingRight: CELL_PADDING_PX * pendingProgress,
					textAlign: "center" as const,
			  }
			: undefined;
	const fold = (columnId: string, content: React.ReactNode) =>
		columnId in CONFIRMED_COLUMN_FOR ? (
			<FoldX progress={pendingProgress}>{content}</FoldX>
		) : (
			content
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
				<Table
					style={{
						minWidth:
							MIN_WIDTH_PX.confirmedOnly +
							(MIN_WIDTH_PX.withPending - MIN_WIDTH_PX.confirmedOnly) *
								pendingProgress,
					}}>
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
											className={HEAD_CLASS[header.column.id]}
											style={foldingStyle(header.column.id)}>
											{fold(
												header.column.id,
												flexRender(
													header.column.columnDef.header,
													header.getContext()
												)
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
											className={CELL_CLASS[cell.column.id]}
											style={foldingStyle(cell.column.id)}>
											{fold(cell.column.id, <CellContent cell={cell} />)}
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
