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
import Image from "next/image";

type FilterType = "all" | "pickup-today";
// type CategoryType = "desserts" | "food" | "crafts" | "drinks" | "all";

interface FundraisersListProps {
	fundraisers: z.infer<typeof BasicFundraiserSchema>[];
	searchQuery?: string;
}

export function FundraisersList({
	fundraisers,
	searchQuery = "",
}: FundraisersListProps) {
	const [filter, setFilter] = useState<FilterType>("all");
	// const [category, setCategory] = useState<CategoryType>("desserts");
	const [sortOpen, setSortOpen] = useState(false);
	const [selectedLabel, setSelectedLabel] = useState("All Fundraisers");

	const filteredFundraisers = useMemo(() => {
		let filtered = fundraisers;

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter((fundraiser) =>
				fundraiser.name.toLowerCase().includes(query),
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
				}),
			);
		}

		return filtered;
	}, [fundraisers, filter, searchQuery]);

	// TODO This isn't actually used yet, but should be in the future; just adding to match Figma design right now
	// const categories = [
	// 	{ id: "desserts" as CategoryType, label: "Desserts", icon: Lollipop },
	// 	{ id: "food" as CategoryType, label: "Food", icon: Utensils },
	// 	{ id: "crafts" as CategoryType, label: "Crafts", icon: Scissors },
	// 	{ id: "drinks" as CategoryType, label: "Drinks", icon: CupSoda },
	// ];

	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Heading and Filters Section */}
			<div className="flex flex-col gap-2 md:gap-4">
				<h1 className="hidden md:block text-[32px] font-semibold leading-[48px] text-black">
					Browse CURaise
				</h1>

				<div className="flex flex-col gap-3 w-full">
					{/* Category Filters - Horizontal scroll on mobile
					<div className="flex gap-3 items-center overflow-x-auto md:overflow-x-visible -mt-8 md:mt-0 pb-4 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
						{categories.map((cat) => {
							const Icon = cat.icon;
							const isActive = category === cat.id;
							return (
								<button
									key={cat.id}
									onClick={() => setCategory(cat.id)}
									className={`h-[38px] rounded-full px-4 py-2 flex items-center justify-center gap-2 border transition-colors flex-shrink-0 ${
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
					</div> */}
					{/* Sort By Dropdown */}
					<div className="flex gap-3 items-center">
						<Popover open={sortOpen} onOpenChange={setSortOpen}>
							<PopoverTrigger asChild>
								<button className="bg-white border border-[#dddddd] rounded-md px-[20px] py-2 flex items-center justify-center gap-[10px]">
									<span className="text-base font-normal leading-6 text-black">
										{selectedLabel}
									</span>
									<ChevronDown className="h-4 w-4 text-black" />
								</button>
							</PopoverTrigger>

							<PopoverContent className="w-full p-0" align="start">
								<div className="p-3 flex flex-col gap-3">
									<button
										onClick={() => {
											setFilter("all");
											setSelectedLabel("All Fundraisers");
											setSortOpen(false);
										}}
										className="text-base font-normal leading-6 text-black text-left hover:bg-gray-50 rounded px-2 py-1">
										All Fundraisers
									</button>

									<button
										onClick={() => {
											setFilter("pickup-today");
											setSelectedLabel("Pick-up Today");
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
				<div className="w-full text-center py-12 bg-gray-100 rounded-lg">
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[50px]">
					{filteredFundraisers.map((fundraiser) => (
						<Link
							key={fundraiser.id}
							href={`/buyer/fundraiser/${fundraiser.id}`}
							className="flex flex-col gap-[15px] w-full">
							{/* Image */}
							<div className="bg-white h-[240px] rounded-md shadow-[2px_2px_5px_0px_rgba(140,140,140,0.25)] overflow-hidden relative">
								{fundraiser.imageUrls && fundraiser.imageUrls.length > 0 ? (
									<Image
										src={fundraiser.imageUrls[0]}
										alt={fundraiser.name}
										fill
										className="object-cover"
										sizes="100vw"
										style={{ objectFit: "cover" }}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gray-200">
										<span className="text-gray-400">No image</span>
									</div>
								)}
							</div>

							{/* Title and Organization */}
							<div className="flex flex-col gap-1 w-full">
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
