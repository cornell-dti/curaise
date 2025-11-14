"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BasicOrganizationSchema } from "common";
import { OrganizationsList } from "./components/OrganizationsList";
import { createClient } from "@/utils/supabase/client";
import { z } from "zod";

export default function SellerHome() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const searchQuery = searchParams.get("search") || "";

	const [organizations, setOrganizations] = useState<
		z.infer<typeof BasicOrganizationSchema>[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchOrganizations = async () => {
			try {
				setLoading(true);
				const supabase = createClient();

				// Check authentication
				const {
					data: { user },
					error: userError,
				} = await supabase.auth.getUser();
				if (userError || !user) {
					router.push("/");
					return;
				}

				// Get session token
				const {
					data: { session },
					error: sessionError,
				} = await supabase.auth.getSession();
				if (sessionError || !session?.access_token) {
					throw new Error("Session invalid");
				}

				// Fetch organizations
				const response = await fetch(
					`${process.env.NEXT_PUBLIC_API_URL}/user/${user.id}/organizations`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					}
				);
				const result = await response.json();
				if (!response.ok) {
					throw new Error(result.message);
				}

				// Parse org data
				const data = BasicOrganizationSchema.array().safeParse(result.data);
				if (!data.success) {
					throw new Error("Could not parse organization data");
				}

				setOrganizations(data.data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setLoading(false);
			}
		};

		fetchOrganizations();
	}, [router]);

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-6 space-y-4">
				<h1 className="text-2xl font-bold">Organizations</h1>
				<div className="text-center py-12">
					<p className="text-gray-500">Loading organizations...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="container mx-auto px-4 py-6 space-y-4">
				<h1 className="text-2xl font-bold">Organizations</h1>
				<div className="text-center py-12">
					<p className="text-red-500">Error: {error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 space-y-4">
			<h1 className="text-2xl font-bold">Organizations</h1>
			<OrganizationsList
				organizations={organizations}
				searchQuery={searchQuery}
			/>
		</div>
	);
}
