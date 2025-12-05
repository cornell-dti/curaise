import { FundraisersList } from "./components/FundraisersList";
import { BasicFundraiserSchema } from "common";
import { connection } from "next/server";

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

export default async function BrowseFundraisersPage({
	searchParams,
}: {
	searchParams: Promise<{ search?: string }>;
}) {
	await connection(); // ensures server component is dynamically rendered at runtime

	const fundraisers = await getAllFundraisers();
	const params = await searchParams;
	const searchQuery = params.search || "";

	return (
		<div className="flex flex-col px-4 md:px-[157px] pt-10">
			<FundraisersList fundraisers={fundraisers} searchQuery={searchQuery} />
		</div>
	);
}
