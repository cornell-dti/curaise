"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BasicFundraiserSchema } from "common";
import { FundraisersList } from "./components/FundraisersList";
import { z } from "zod";

export default function BrowseFundraisersPage() {
	const searchParams = useSearchParams();
	const searchQuery = searchParams.get("search") || "";

	const [fundraisers, setFundraisers] = useState<
		z.infer<typeof BasicFundraiserSchema>[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchFundraisers = async () => {
			try {
				setLoading(true);
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/fundraiser`
				);
				const result = await response.json();
				if (!response.ok) {
					throw new Error(result.message);
				}
				const data = BasicFundraiserSchema.array().safeParse(result.data);
				if (!data.success) {
					throw new Error("Could not parse fundraiser data");
				}
				setFundraisers(data.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		};

		fetchFundraisers();
	}, []);

	if (loading) {
		return (
			<div className="flex flex-col p-6 md:p-10 space-y-6">
				<div className="text-center py-12">
					<p className="text-gray-500">Loading fundraisers...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col p-6 md:p-10 space-y-6">
				<div className="text-center py-12">
					<p className="text-red-500">Error: {error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col p-6 md:p-10 space-y-6">
			<FundraisersList fundraisers={fundraisers} searchQuery={searchQuery} />
		</div>
	);
}
