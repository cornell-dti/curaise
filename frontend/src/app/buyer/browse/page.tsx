import { connection } from "next/server";
import { BasicFundraiserSchema } from "common";
import { FundraiserCard } from "@/components/custom/FundraiserCard";

const getAllFundraisers = async () => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/fundraiser`);
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = BasicFundraiserSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data");
  }
  return data.data;
};

export default async function BrowseFundraisersPage() {
  await connection();

  const fundraisers = await getAllFundraisers();

  return (
    <div className="flex flex-col p-6 md:p-10 space-y-6">
      <h1 className="text-3xl font-bold">Browse Fundraisers</h1>

      {fundraisers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No fundraisers available
          </h3>
          <p className="text-gray-500">
            Check back soon for upcoming fundraisers
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fundraisers.map((fundraiser) => (
            <FundraiserCard key={fundraiser.id} fundraiser={fundraiser} />
          ))}
        </div>
      )}
    </div>
  );
}
