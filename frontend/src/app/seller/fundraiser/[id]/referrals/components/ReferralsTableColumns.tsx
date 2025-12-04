"use client";
import { ColumnDef } from "@tanstack/react-table";
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

// Extended referral type with calculated order quantities
type Referral = z.infer<typeof ReferralSchema>;

export interface ReferralWithQuantities extends Referral {
	orderCount: number;
}

// Create a function that returns columns with the token (access token)
export const getReferralsColumns = (): ColumnDef<ReferralWithQuantities>[] => [
	{
		accessorKey: "name",
		accessorFn: (row) => row.referrer.name,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					className="flex justify-center w-full px-2"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Name
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				{row.original.referrer.name}
			</div>
		),
	},
	{
		accessorKey: "netid",
		accessorFn: (row) => row.referrer.email,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					className="flex justify-center w-full px-2"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					NetID
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				{row.original.referrer.email.split("@")[0]}
			</div>
		),
	},
	{
		accessorKey: "orderCount",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					className="flex justify-center w-full px-2"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Quantities
					<ArrowUpDown className="ml-1 h-3 w-3" />
				</Button>
			);
		},
		cell: ({ row }) => (
			<div className="flex items-center justify-center">
				{row.original.orderCount}
			</div>
		),
	},
	{
		accessorKey: "approved",
		header: () => {
			return <div className="flex justify-center w-full px-2">Approved</div>;
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
		cell: ({ row }) => {
			const referral = row.original;
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
							onClick={() => {
								navigator.clipboard.writeText(referral.referrer.id);
								toast.success("User ID copied to clipboard");
							}}>
							Copy referrer ID
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
