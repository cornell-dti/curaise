"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SearchBarProps {
	/** Type of search: 'fundraisers' or 'organizations' */
	searchType: "fundraisers" | "organizations";
	/** Callback when search query changes */
	onSearchChange?: (query: string) => void;
}

export function SearchBar({ searchType, onSearchChange }: SearchBarProps) {
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

	const placeholder =
		searchType === "fundraisers"
			? "Search for fundraisers"
			: "Search for organizations";

	return (
		<div className="flex items-center justify-center w-full">
			<div className="relative w-full max-w-2xl">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder={placeholder}
					value={query}
					onChange={(e) => handleSearchChange(e.target.value)}
					className="pl-10 pr-4 h-10"
				/>
			</div>
		</div>
	);
}
