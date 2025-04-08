import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ShoppingBag } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserAnnouncementPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserAnnouncementPanel";

const getFundraiser = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`
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
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`
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
};

const formatDate = (startsAt: Date, endsAt: Date) => {
  return `${format(new Date(startsAt), "MMMM dd ")} at
    ${format(new Date(startsAt), " hh:mm a")} -
    ${format(new Date(endsAt), " MMMM dd ")} at
    ${format(new Date(endsAt), " hh:mm a")}`;
};

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
    <div className="flex flex-col">
      <div className="p-10">
        {fundraiser.imageUrls.length > 0 ? (
          <FundraiserGallerySlider images={fundraiser.imageUrls} />
        ) : (
          <div className="w-full h-40 sm:h-50 md:h-58 lg:h-64 bg-gray-200 rounded-lg mb-6 flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-2">{fundraiser.name}</h1>
        <p className="text-gray-600 mb-4">{fundraiser.description}</p>
        <div className="flex flex-col items-start w-full max-w-md">
          <div className="flex items-center mb-2">
            {/* Adjust icon size and ensure alignment */}
            <ShoppingBag className="w-6 h-6 sm:w-4 sm:h-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {"Buying Window: "}
              <span className="font-bold">
                {formatDate(fundraiser.buyingStartsAt, fundraiser.buyingEndsAt)}
              </span>
            </span>
          </div>
          <div className="flex items-center mb-2">
            {/* Adjust icon size and ensure alignment */}
            <MapPin className="w-6 h-6 sm:w-4 sm:h-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {"Pickup Location: "}
              <span className="font-bold">{fundraiser.pickupLocation}</span>
            </span>
          </div>
          <div className="flex items-center">
            {/* Adjust icon size and ensure alignment */}
            <Calendar className="w-6 h-6 sm:w-4 sm:h-4 mr-2 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              {"Pickup Window: "}
              <span className="font-bold">
                {formatDate(fundraiser.pickupStartsAt, fundraiser.pickupEndsAt)}
              </span>
            </span>
          </div>
        </div>
      </div>
      <FundraiserAnnouncementPanel announcements={fundraiser.announcements} />
      <FundraiserItemsPanel items={fundraiserItems} />
    </div>
  );
}
