import { connection } from "next/server";
import { BasicFundraiserSchema } from "common";
import { BrowseContent } from "./components/BrowseContent";

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

  return <BrowseContent fundraisers={fundraisers} />;
}
