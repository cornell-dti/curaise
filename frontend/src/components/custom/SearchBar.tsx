"use client";

import { Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SearchBarProps {
	/** Callback when search query changes */
	onSearchChange?: (query: string) => void;
}

export function SearchBar({ onSearchChange }: SearchBarProps) {
	const searchParams = useSearchParams();
	const [query, setQuery] = useState(searchParams.get("search") || "");

	// Update local state of search bar input when URL search param changes
	useEffect(() => {
		const urlQuery = searchParams.get("search") || "";
		setQuery(urlQuery);
	}, [searchParams]);

	const handleSearchChange = (value: string) => {
		setQuery(value);
		onSearchChange?.(value);
	};

	return (
		<div className="flex items-center justify-center w-full">
			<div className="relative w-full max-w-2xl">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-black" />
				<Input
					type="text"
					placeholder="Search fundraisers"
					value={query}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10 pr-10 h-10 border-gray-300"
				/>
				<TooltipProvider delayDuration={200}>
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								aria-label="What does the search look through?"
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none">
								<Info className="h-4 w-4" />
							</button>
						</TooltipTrigger>
						<TooltipContent side="bottom">
							Searches fundraiser name, description, and organization
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}
