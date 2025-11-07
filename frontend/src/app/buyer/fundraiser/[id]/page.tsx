import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserMobileView } from "@/app/buyer/fundraiser/[id]/components/FundraiserMobileView";

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
    <div className="bg-white min-h-screen pb-20 md:pb-0">
      {/* Mobile View */}
      <div className="md:hidden">
        <FundraiserMobileView
          fundraiser={fundraiser}
          fundraiserItems={fundraiserItems}
        />
      </div>

      {/* Desktop View - Keep existing layout */}
      <div className="hidden md:flex flex-col p-10 space-y-4">
        {fundraiser.imageUrls.length > 0 && (
          <FundraiserGallerySlider images={fundraiser.imageUrls} />
        )}

        <div className="flex flex-col items-start w-full space-y-2">
          <h1 className="text-3xl font-bold my-2">{fundraiser.name}</h1>
          <p className="text-gray-600 mb-4">{fundraiser.description}</p>
        </div>

        <FundraiserItemsPanel
          fundraiserId={fundraiser.id}
          items={fundraiserItems}
        />
      </div>
    </div>
  );
}
