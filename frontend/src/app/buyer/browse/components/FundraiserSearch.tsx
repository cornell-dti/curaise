"use client";

import { useState, useMemo, useEffect } from "react";
import { Search } from "lucide-react";
import { z } from "zod";
import { BasicFundraiserSchema } from "common";

interface FundraiserSearchProps {
    fundraisers: z.infer<typeof BasicFundraiserSchema>[];
    onFilteredChange: (filtered: z.infer<typeof BasicFundraiserSchema>[]) => void;
}

export function FundraiserSearch({ fundraisers, onFilteredChange }: FundraiserSearchProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredFundraisers = useMemo(() => {
        if (!searchQuery.trim()) {
            return fundraisers;
        }

        const query = searchQuery.toLowerCase().trim();

        //   Filter by name, description, organization, and location
        return fundraisers.filter((fundraiser) => {
            const nameMatch = fundraiser.name.toLowerCase().includes(query);
            const descriptionMatch = fundraiser.description.toLowerCase().includes(query);
            const orgMatch = fundraiser.organization?.name.toLowerCase().includes(query);
            const locationMatch = fundraiser.pickupLocation.toLowerCase().includes(query);

            return nameMatch || descriptionMatch || orgMatch || locationMatch;
        });
    }, [searchQuery, fundraisers]);

    useEffect(() => {
        onFilteredChange(filteredFundraisers);
    }, [filteredFundraisers, onFilteredChange]);

    return (
        <div className="bg-white border border-[#dddddd] rounded-[6px] w-full">
            <div className="flex gap-2 items-center px-5 py-[13px]">
                <Search className="size-5 shrink-0" />
                <input
                    type="text"
                    placeholder="Search for fundraisers"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 text-[15px] leading-[18px] text-black placeholder:text-black outline-none bg-transparent"
                />
            </div>
        </div>
    );
}
