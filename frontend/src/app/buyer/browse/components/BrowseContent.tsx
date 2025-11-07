"use client";

import { useState, useMemo } from "react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { FundraiserCard } from "@/components/custom/FundraiserCard";
import { FundraiserSearch } from "./FundraiserSearch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc" | "org-asc";

interface BrowseContentProps {
    fundraisers: z.infer<typeof BasicFundraiserSchema>[];
}

export function BrowseContent({ fundraisers }: BrowseContentProps) {
    const [filteredFundraisers, setFilteredFundraisers] = useState(fundraisers);
    const [sortBy, setSortBy] = useState<SortOption>("newest");

    const sortedFundraisers = useMemo(() => {
        const sorted = [...filteredFundraisers];
        
        switch (sortBy) {
            case "newest":
                return sorted.sort((a, b) => 
                    new Date(b.buyingStartsAt).getTime() - new Date(a.buyingStartsAt).getTime()
                );
            case "oldest":
                return sorted.sort((a, b) => 
                    new Date(a.buyingStartsAt).getTime() - new Date(b.buyingStartsAt).getTime()
                );
            case "name-asc":
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case "name-desc":
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case "org-asc":
                return sorted.sort((a, b) => {
                    const orgA = a.organization?.name || "";
                    const orgB = b.organization?.name || "";
                    return orgA.localeCompare(orgB);
                });
            default:
                return sorted;
        }
    }, [filteredFundraisers, sortBy]);

    return (
        <div className="flex flex-col gap-5 px-6 py-6 md:p-10 md:items-start">
            <div className="w-full md:max-w-xl flex flex-col gap-5">
                <FundraiserSearch fundraisers={fundraisers} onFilteredChange={setFilteredFundraisers} />
                
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="bg-white border border-[#dddddd] rounded-[6px] h-auto px-[10px] py-2 w-fit text-[15px] leading-[18px] text-black focus:ring-0 focus:ring-offset-0">
                        <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="org-asc">Organization (A-Z)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {filteredFundraisers.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg w-full md:max-w-none">
                    <h3 className="text-lg font-medium text-gray-600 mb-2">
                        {fundraisers.length === 0 ? "No fundraisers available" : "No fundraisers match your search"}
                    </h3>
                    <p className="text-gray-500">
                        {fundraisers.length === 0 ? "Check back soon for upcoming fundraisers" : "Try adjusting your search terms"}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-[25px] w-full md:max-w-none md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                    {sortedFundraisers.map((fundraiser) => (
                        <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
                    ))}
                </div>
            )}
        </div>
    );
}
