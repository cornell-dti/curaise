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
        {fundraiser.imageUrls.length > 0 && (
          <FundraiserGallerySlider images={fundraiser.imageUrls} />
        )}

        <h1 className="text-3xl font-bold my-2">{fundraiser.name}</h1>
        <p className="text-gray-600 mb-4">{fundraiser.description}</p>

        <div className="flex flex-col items-start w-full space-y-2">
          <div className="flex sm:items-center gap-2">
            <ShoppingBag className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <span className="text-md">
              Buying Window:{" "}
              <b>
                {format(fundraiser.buyingStartsAt, "MMM d, yyyy 'at' h:mm a")} -{" "}
                {format(fundraiser.buyingEndsAt, "MMM d, yyyy 'at' h:mm a")}
              </b>
            </span>
          </div>

          <div className="flex sm:items-center gap-2">
            <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <span className="text-md">
              Pickup Location: <b>{fundraiser.pickupLocation}</b>
            </span>
          </div>

          <div className="flex sm:items-center gap-2">
            <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <span className="text-md">
              Pickup Window:{" "}
              <b>
                {format(fundraiser.pickupStartsAt, "MMM d, yyyy 'at' h:mm a")} -{" "}
                {format(fundraiser.pickupEndsAt, "MMM d, yyyy 'at' h:mm a")}
              </b>
            </span>
          </div>
        </div>
      </div>

      <FundraiserAnnouncementPanel announcements={fundraiser.announcements} />
      <FundraiserItemsPanel items={fundraiserItems} />
    </div>
  );
}
