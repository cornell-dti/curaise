"use client";

import { useState } from "react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { FundraiserCard } from "@/components/custom/FundraiserCard";
import { FundraiserSearch } from "./FundraiserSearch";

interface BrowseContentProps {
    fundraisers: z.infer<typeof BasicFundraiserSchema>[];
}

export function BrowseContent({ fundraisers }: BrowseContentProps) {
    const [filteredFundraisers, setFilteredFundraisers] = useState(fundraisers);

    return (
        <div className="flex flex-col p-6 md:p-10 space-y-6">
            {/* Search bar, full width on mobile, limited width on desktop */}
            <div className="w-full max-w-xl md:ml-0 mx-auto md:mx-0">
                <FundraiserSearch fundraisers={fundraisers} onFilteredChange={setFilteredFundraisers} />
            </div>

            {filteredFundraisers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                        {fundraisers.length === 0 ? "No fundraisers available" : "No fundraisers match your search"}
                    </h3>
                    <p className="text-gray-500">
                        {fundraisers.length === 0 ? "Check back soon for upcoming fundraisers" : "Try adjusting your search terms"}
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
