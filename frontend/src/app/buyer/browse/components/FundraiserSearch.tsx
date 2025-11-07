"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" />
            <Input
                type="text"
                placeholder="Search for fundraisers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full text-black"
            />
        </div>
    );
}
