import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar } from "lucide-react";

const getFundraiser = async (id: string) => {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`,
	);
	const result = await response.json();
	if (!response.ok) {
		throw new Error(result.message);
	}
	const data = CompleteFundraiserSchema.safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse fundraiser data");
	}
	return data.data;
};

const getFundraiserItems = async (id: string) => { 
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`,
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteItemSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser items data");
  }
  return data.data;
}

export default async function FundraiserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
  await connection();
  
  const id = (await params).id;
  const fundraiser = await getFundraiser(id);
  const fundraiserItems = await getFundraiserItems(id);

  return (
		<div className="p-4 border-b">
			<h1 className="text-2xl font-bold mb-2">{fundraiser.name}</h1>
			<p className="text-gray-600 mb-4">{fundraiser.description}</p>
			<div className="flex items-center mb-2">
				<Calendar className="w-4 h-4 mr-2 text-gray-500" />
				<span className="text-sm text-gray-700">
					{format(new Date(fundraiser.pickupStartsAt), "EEEE, MM/dd/yyyy")}
				</span>
			</div>
			<div className="flex items-center mb-2">
				<MapPin className="w-4 h-4 mr-2 text-gray-500" />
				<span className="text-sm text-gray-700">
					{fundraiser.pickupLocation}
				</span>
			</div>
			<div className="flex items-center mb-2">
				<MapPin className="w-4 h-4 mr-2 text-gray-500" />
				<span className="text-sm text-gray-700">
					{fundraiser.pickupLocation}
				</span>
			</div>
		</div>
	);
}
