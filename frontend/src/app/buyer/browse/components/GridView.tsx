import { z } from "zod";
import { BasicFundraiserSchema } from "common";
import { BrowseFundraiserCard } from "./BrowseFundraiserCard";

export function GridView({
  fundraisers,
  isFiltered = false,
}: {
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
  isFiltered?: boolean;
}) {
  if (fundraisers.length === 0) {
    return (
      <div className="w-full text-center py-12 bg-gray-100 rounded-lg">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          {isFiltered
            ? "No fundraisers match your filters"
            : "No fundraisers available"}
        </h3>
        <p className="text-gray-500">
          {isFiltered
            ? "Try removing a filter or changing your search"
            : "Check back soon for upcoming fundraisers"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[50px]">
      {fundraisers.map((fundraiser) => (
        <BrowseFundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
      ))}
    </div>
  );
}
