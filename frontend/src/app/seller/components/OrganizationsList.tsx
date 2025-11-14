"use client";

import { useMemo } from "react";
import { z } from "zod";
import { BasicOrganizationSchema } from "common";
import {
	OrganizationCard,
	CreateOrganizationCard,
} from "@/components/custom/OrganizationCard";

interface OrganizationsListProps {
	organizations: z.infer<typeof BasicOrganizationSchema>[];
	searchQuery?: string;
}

export function OrganizationsList({
	organizations,
	searchQuery = "",
}: OrganizationsListProps) {
	const filteredOrganizations = useMemo(() => {
		if (!searchQuery) {
			return organizations;
		}

		const query = searchQuery.toLowerCase();
		return organizations.filter(
			(org) =>
				org.name.toLowerCase().includes(query) ||
				org.description.toLowerCase().includes(query)
		);
	}, [organizations, searchQuery]);

	return (
		<>
			{filteredOrganizations.length === 0 && searchQuery ? (
				<div className="text-center py-12 bg-gray-50 rounded-lg col-span-full">
					<h3 className="text-lg font-medium text-gray-600 mb-2">
						No organizations found
					</h3>
					<p className="text-gray-500">
						Try adjusting your search to find what you&apos;re looking for
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{filteredOrganizations.map((org) => (
						<OrganizationCard key={org.id} organization={org} />
					))}
					<CreateOrganizationCard />
				</div>
			)}
		</>
	);
}
