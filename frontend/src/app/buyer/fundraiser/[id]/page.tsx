import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ShoppingBag } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider"

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

const formatDate = (startsAt: Date, endsAt: Date) => {
  return `${format(new Date(startsAt), "MMMM dd ")} at
    ${format(new Date(startsAt), " hh:mm a")} -
    ${format(new Date(endsAt), " MMMM dd ")} at
    ${format(new Date(endsAt), " hh:mm a")}`
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
		<div>
			<div className="p-10 border-b flex flex-col">
			  {fundraiser.imageUrls.length > 0 ? (
				  <FundraiserGallerySlider images={fundraiser.imageUrls} />) : (
					<div className="w-full h-40 sm:h-50 md:h-58 lg:h-64 bg-gray-200 rounded-lg mb-10 flex items-center justify-center">
						<p className="text-gray-500">No images available</p>
					</div>
				  ) }
				<h1 className="text-2xl font-bold mb-2">{fundraiser.name}</h1> 
				<p className="text-gray-600 mb-4">{fundraiser.description}</p>
				<div className="flex flex-col items-start w-full max-w-md">
					<div className="flex items-center mb-2">
						<ShoppingBag className="w-4 h-4 mr-2 text-gray-500" />
						<span className="text-sm text-gray-700">
							{"Buying Window: "}
							<span className="font-bold">
								{formatDate(fundraiser.buyingStartsAt, fundraiser.buyingEndsAt)}
							</span>
						</span>
					</div>
					<div className="flex items-center mb-2">
						<MapPin className="w-4 h-4 mr-2 text-gray-500" />
						<span className="text-sm text-gray-700">
							{"Pickup Location: "}
							<span className="font-bold">{fundraiser.pickupLocation}</span>
						</span>
					</div>
					<div className="flex items-center mb-2">
						<Calendar className="w-4 h-4 mr-2 text-gray-500" />
						<span className="text-sm text-gray-700">
							{"Pickup Window: "}
							<span className="font-bold">
								{formatDate(fundraiser.pickupStartsAt, fundraiser.pickupEndsAt)}
							</span>
						</span>
					</div>
				</div>
			</div>
			<FundraiserItemsPanel items={fundraiserItems} />
		</div>
	);
}
