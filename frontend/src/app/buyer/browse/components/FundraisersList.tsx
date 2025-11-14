"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { FundraiserCard } from "@/components/custom/FundraiserCard";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type FilterType = "all" | "pickup-today";

interface FundraisersListProps {
	fundraisers: z.infer<typeof BasicFundraiserSchema>[];
	searchQuery?: string;
}

export function FundraisersList({
	fundraisers,
	searchQuery = "",
}: FundraisersListProps) {
	const [filter, setFilter] = useState<FilterType>("all");

	const filteredFundraisers = useMemo(() => {
		let filtered = fundraisers;

		// Apply search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(fundraiser) =>
					fundraiser.name.toLowerCase().includes(query) ||
					fundraiser.description.toLowerCase().includes(query) ||
					fundraiser.organization.name.toLowerCase().includes(query)
			);
		}

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

	return (
		<div className="flex flex-col space-y-6">
			{/* Filter Dropdown */}
			<div className="flex items-center gap-3">
				<Select
					value={filter}
					onValueChange={(value) => setFilter(value as FilterType)}>
					<SelectTrigger className="w-[200px]">
						<SelectValue placeholder="Select filter" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All Fundraisers</SelectItem>
						<SelectItem value="pickup-today">Pick-up Today</SelectItem>
					</SelectContent>
				</Select>
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{filteredFundraisers.map((fundraiser) => (
						<FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
					))}
				</div>
			)}
		</div>
	);
}
