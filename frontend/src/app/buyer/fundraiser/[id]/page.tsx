import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronLeft } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserAnnouncementPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserAnnouncementPanel";
import { UnpublishedFundraiser } from "@/app/buyer/fundraiser/[id]/components/UnpublishedFundraiser";
import { FundraiserCartSidebar } from "@/app/buyer/fundraiser/[id]/components/FundraiserCartSidebar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

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
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  await connection();

  const id = (await params).id;
  const { preview } = await searchParams;
  const fundraiser = await getFundraiser(id);
  const fundraiserItems = await getFundraiserItems(id);

  if (!fundraiser.published && preview !== "true") {
    return <UnpublishedFundraiser fundraiser={fundraiser} />;
  }

  return (
    <div className="flex flex-col -mt-16 md:mt-0">
      {/* Back button - Mobile only */}
      <Link
        href="/buyer/browse"
        className="md:hidden fixed top-5 left-5 z-50 rounded-full p-2.5 transition-colors"
        style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
      >
        <ChevronLeft strokeWidth={3} className="h-6 w-6 text-black" />
      </Link>

      <div className="relative mb-10">
        {fundraiser.imageUrls.length > 0 ? (
          <FundraiserGallerySlider images={fundraiser.imageUrls} />
        ) : (
          <div className="w-full h-[379px] md:h-[600px] bg-gray-200" />
        )}
      </div>

      <div className="flex flex-col px-[17px] md:px-10 pb-10 space-y-[22px] md:space-y-6">
        <div className="flex flex-col items-start w-full space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">{fundraiser.name}</h1>
            <p className="text-base text-muted-foreground">
              Hosted by: <span>{fundraiser.organization.name}</span>
            </p>
          </div>

          <div className="h-px w-full bg-[#f6f6f6]" />

          <div className="w-full">
            <p className="text-lg leading-[27px] whitespace-pre-wrap">
              {fundraiser.description}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <h3 className="text-lg font-semibold">Pickup Details</h3>
            <Card className="w-full border-[#f6f6f6]">
              <CardContent className="pt-[14px] px-[14px] pb-[14px]">
                <div className="flex flex-col gap-[10px]">
                  {fundraiser.pickupEvents.map((event, index) => (
                    <div key={event.id} className="flex flex-col gap-3">
                      {index > 0 && <div className="h-px bg-[#f6f6f6]" />}
                      <div className="flex items-start gap-3">
                        <Calendar className="h-[23px] w-[23px] flex-shrink-0 text-muted-foreground mt-0.5" />
                        <span className="text-base">
                          {format(event.startsAt, "EEEE, M/d/yyyy")}
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <MapPin className="h-[23px] w-[23px] flex-shrink-0 text-muted-foreground mt-0.5" />
                        <span className="text-base">
                          {event.location}, {format(event.startsAt, "h:mm a")} to{" "}
                          {format(event.endsAt, "h:mm a")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <FundraiserAnnouncementPanel announcements={fundraiser.announcements} />

        <div className="flex flex-col gap-6 md:gap-6 w-full">
          <h3 className="text-lg font-semibold">Items</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FundraiserItemsPanel
                fundraiserId={fundraiser.id}
                items={fundraiserItems}
              />
            </div>
            <div className="lg:col-span-1">
              <FundraiserCartSidebar fundraiserId={fundraiser.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
