import { connection } from "next/server";
import { FundraisersGrid } from "./components/FundraisersGrid";
import { BasicFundraiserSchema } from "common";

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
      <FundraisersGrid fundraisers={fundraisers} />
    </div>
  );
}
