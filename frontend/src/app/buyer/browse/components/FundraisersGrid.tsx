import { BasicFundraiserSchema } from "common";
import { FundraiserCard } from "./FundraiserCard";
import { z } from "zod";

export async function FundraisersGrid({
  fundraisers,
}: {
  fundraisers: z.infer<typeof BasicFundraiserSchema>[];
}) {
  if (fundraisers.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No fundraisers available
        </h3>
        <p className="text-gray-500">
          Check back soon for upcoming fundraisers
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {fundraisers.map((fundraiser) => (
        <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
      ))}
    </div>
  );
}
