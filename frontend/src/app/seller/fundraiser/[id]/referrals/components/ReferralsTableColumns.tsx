"use client";
import { Column, ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown } from "lucide-react";
import { z } from "zod";
import { ReferralSchema } from "common/schemas/fundraiser";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmedLabel, PendingLabel } from "../../components/StatusLegend";
import { formatMoney } from "../../analytics/components/insights";

// Extended referral type with calculated order quantities
type Referral = z.infer<typeof ReferralSchema>;

export interface ReferralWithQuantities extends Referral {
	orderCount: number;
	amountRaised: number;
	pendingOrderCount: number;
	pendingAmount: number;
	totalAmount: number;
	// Every order credited to this referrer, including unpaid ones
	attributedOrderCount: number;
}

export const CONFIRMED_COLUMN_FOR: Record<string, string> = {
	pendingOrderCount: "orderCount",
	totalOrderCount: "orderCount",
	pendingAmount: "amountRaised",
	totalAmount: "amountRaised",
};

const GROUP_HEAD = "h-9 border-b border-l text-center font-semibold text-foreground";

export const HEAD_CLASS: Record<string, string> = {
	quantities: GROUP_HEAD,
	amounts: GROUP_HEAD,
	orderCount: "border-l",
	amountRaised: "border-l",
	totalOrderCount: "bg-zinc-50",
	totalAmount: "bg-zinc-50",
	approved: "border-l",
	actions: "w-12",
};

export const CELL_CLASS: Record<string, string> = {
	totalOrderCount: "bg-zinc-50",
	totalAmount: "bg-zinc-50",
};

function SortHeader({
	column,
	children,
}: {
	column: Column<ReferralWithQuantities>;
	children: React.ReactNode;
}) {
	return (
		<Button
			variant="ghost"
			className="flex justify-center w-full px-2"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
			{children}
			<ArrowUpDown className="ml-1 h-3 w-3" />
		</Button>
	);
}

const numberCell = (value: string | number, isTotal = false) => (
	<div
		className={cn(
			"flex items-center justify-center tabular-nums",
			isTotal && "font-semibold"
		)}>
		{value}
	</div>
);

export const getReferralsColumns = ({
	onRemove,
}: {
	onRemove: (referral: ReferralWithQuantities) => void;
}): ColumnDef<ReferralWithQuantities>[] => [
	{
		accessorKey: "name",
		accessorFn: (row) => row.referrer.name,
		header: ({ column }) => <SortHeader column={column}>Name</SortHeader>,
		cell: ({ row }) => (
			<div className="flex items-center justify-center text-center">
				{row.original.referrer.name}
			</div>
		),
	},
	{
		accessorKey: "netid",
		accessorFn: (row) => row.referrer.email,
		header: ({ column }) => <SortHeader column={column}>NetID</SortHeader>,
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				{row.original.referrer.email.split("@")[0]}
			</div>
		),
	},
	{
		id: "quantities",
		header: "Quantities",
		columns: [
			{
				accessorKey: "orderCount",
				header: ({ column }) => (
					<SortHeader column={column}>
						<ConfirmedLabel />
					</SortHeader>
				),
				cell: ({ row }) => numberCell(row.original.orderCount),
			},
			{
				accessorKey: "pendingOrderCount",
				header: ({ column }) => (
					<SortHeader column={column}>
						<PendingLabel />
					</SortHeader>
				),
				cell: ({ row }) => numberCell(row.original.pendingOrderCount),
			},
			{
				id: "totalOrderCount",
				accessorFn: (row) => row.attributedOrderCount,
				header: ({ column }) => <SortHeader column={column}>Total</SortHeader>,
				cell: ({ row }) => numberCell(row.original.attributedOrderCount, true),
			},
		],
	},
	{
		id: "amounts",
		header: "Amount Raised",
		columns: [
			{
				accessorKey: "amountRaised",
				header: ({ column }) => (
					<SortHeader column={column}>
						<ConfirmedLabel />
					</SortHeader>
				),
				cell: ({ row }) => numberCell(formatMoney(row.original.amountRaised)),
			},
			{
				accessorKey: "pendingAmount",
				header: ({ column }) => (
					<SortHeader column={column}>
						<PendingLabel />
					</SortHeader>
				),
				cell: ({ row }) => numberCell(formatMoney(row.original.pendingAmount)),
			},
			{
				accessorKey: "totalAmount",
				header: ({ column }) => <SortHeader column={column}>Total</SortHeader>,
				cell: ({ row }) =>
					numberCell(formatMoney(row.original.totalAmount), true),
			},
		],
	},
	{
		accessorKey: "approved",
		header: () => {
			return <div className="flex justify-center w-full px-2">Status</div>;
		},
		cell: ({ row }) => {
			const isApproved = row.original.approved;
			return (
				<div className="flex justify-center">
					{isApproved ? (
						<Badge className="flex justify-center items-center min-w-[90px] bg-[#DCEBDE] text-[#086A19] rounded-full px-3 py-1 hover:bg-[#c5e0c6] hover:text-[#065a13] font-[700] text-md">
							Approved
						</Badge>
					) : (
						<Badge className="flex justify-center items-center min-w-[90px] bg-[#FFEEC2] text-[#FEA839] rounded-full px-3 py-1 hover:bg-[#fddc9e] hover:text-[#d97a2b] font-[700] text-md">
							Pending
						</Badge>
					)}
				</div>
			);
		},
	},
	{
		id: "actions",
		header: () => <span className="sr-only">Actions</span>,
		cell: ({ row }) => {
			const referral = row.original;
			return (
				// Non-modal so the confirm dialog it opens keeps the page clickable after closing
				<DropdownMenu modal={false}>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => {
								navigator.clipboard.writeText(referral.id);
								toast.success("Referral ID copied to clipboard");
							}}>
							Copy referral ID
						</DropdownMenuItem>
						<DropdownMenuItem
							className="text-[#f74545] focus:text-[#f74545]"
							onClick={() => onRemove(referral)}>
							Remove referrer
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
