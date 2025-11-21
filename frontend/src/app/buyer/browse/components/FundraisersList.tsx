"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import {
	Lollipop,
	Utensils,
	Scissors,
	CupSoda,
	ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

type FilterType = "all" | "pickup-today";
type CategoryType = "desserts" | "food" | "crafts" | "drinks" | "all";

interface FundraisersListProps {
	fundraisers: z.infer<typeof BasicFundraiserSchema>[];
	searchQuery?: string;
}

export function FundraisersList({
	fundraisers,
	searchQuery = "",
}: FundraisersListProps) {
	const [filter, setFilter] = useState<FilterType>("all");
	const [category, setCategory] = useState<CategoryType>("desserts");
	const [sortOpen, setSortOpen] = useState(false);

	const filteredFundraisers = useMemo(() => {
		let filtered = fundraisers;

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((fundraiser) =>
				fundraiser.name.toLowerCase().includes(query)
			);
		}

		// Apply category filter (for now, we'll show all since we don't have category data)
		// This can be implemented when categories are added to the schema

		// Apply dropdown filter
		if (filter === "pickup-today") {
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			filtered = filtered.filter((fundraiser) =>
				fundraiser.pickupEvents.some((event) => {
					const eventDate = new Date(event.startsAt);
					eventDate.setHours(0, 0, 0, 0);
					return eventDate.getTime() === today.getTime();
				})
			);
		}

		return filtered;
	}, [fundraisers, filter, searchQuery]);

	const categories = [
		{ id: "desserts" as CategoryType, label: "Desserts", icon: Lollipop },
		{ id: "food" as CategoryType, label: "Food", icon: Utensils },
		{ id: "crafts" as CategoryType, label: "Crafts", icon: Scissors },
		{ id: "drinks" as CategoryType, label: "Drinks", icon: CupSoda },
	];

	return (
		<div className="flex flex-col gap-6 w-full max-w-[900px]">
			{/* Heading and Filters Section */}
			<div className="flex flex-col gap-4">
				<h1 className="text-[32px] font-semibold leading-[48px] text-black">
					Browse CURaise
				</h1>

				<div className="flex flex-col gap-5 w-full max-w-[479px]">
					{/* Category Filters */}
					<div className="flex gap-3 items-center">
						{categories.map((cat) => {
							const Icon = cat.icon;
							const isActive = category === cat.id;
							return (
								<button
									key={cat.id}
									onClick={() => setCategory(cat.id)}
									className={`h-[38px] rounded-full px-4 py-2 flex items-center justify-center gap-2 border transition-colors ${
										isActive
											? "bg-black border-black text-[#FEFDFD]"
											: "bg-white border-[#dddddd] text-black"
									}`}>
									<Icon className="h-5 w-5" />
									<span className="text-base font-normal leading-6">
										{cat.label}
									</span>
								</button>
							);
						})}
					</div>

					{/* Sort By Dropdown */}
					<div className="flex gap-3 items-center">
						<Popover open={sortOpen} onOpenChange={setSortOpen}>
							<PopoverTrigger asChild>
								<button className="bg-white border border-[#dddddd] rounded-md px-[10px] py-2 flex items-center justify-center gap-[10px]">
									<span className="text-base font-normal leading-6 text-black">
										Sort By
									</span>
									<ChevronDown className="h-4 w-4 text-black" />
								</button>
							</PopoverTrigger>
							<PopoverContent className="w-[172px] p-0" align="start">
								<div className="p-3 flex flex-col gap-3">
									<button
										onClick={() => {
											setFilter("all");
											setSortOpen(false);
										}}
										className="text-base font-normal leading-6 text-black text-left hover:bg-gray-50 rounded px-2 py-1">
										All fundraisers
									</button>
									<button
										onClick={() => {
											setFilter("pickup-today");
											setSortOpen(false);
										}}
										className="text-base font-normal leading-6 text-black text-left hover:bg-gray-50 rounded px-2 py-1">
										Pick-up Today
									</button>
								</div>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>

			{/* Fundraisers Grid */}
			{filteredFundraisers.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-lg">
					<h3 className="text-lg font-medium text-gray-600 mb-2">
						{filter === "pickup-today"
							? "No fundraisers with pick-up today"
							: "No fundraisers available"}
					</h3>
					<p className="text-gray-500">
						{filter === "pickup-today"
							? "Check back for fundraisers with pick-ups scheduled for today"
							: "Check back soon for upcoming fundraisers"}
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 gap-[30px]">
					{filteredFundraisers.map((fundraiser) => (
						<Link
							key={fundraiser.id}
							href={`/buyer/fundraiser/${fundraiser.id}`}
							className="flex flex-col gap-[15px] w-full max-w-[420px]">
							{/* Image */}
							<div className="bg-white h-[240px] rounded-md shadow-[2px_2px_5.1px_0px_rgba(140,140,140,0.25)] overflow-hidden relative">
								{fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
									<img
										src={fundraiser.imageUrls[0]}
										alt={fundraiser.name}
										className="w-full h-full object-cover"
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gray-200">
										<span className="text-gray-400">No image</span>
									</div>
								)}
							</div>

							{/* Title and Organization */}
							<div className="flex flex-col gap-1">
								<h3 className="text-[20px] font-semibold leading-6 text-black">
									{fundraiser.name}
								</h3>
								<p className="text-base font-normal leading-6 text-[#545454]">
									{fundraiser.organization?.name || "Organization"}
								</p>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
