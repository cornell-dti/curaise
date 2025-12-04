import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ShoppingBag, Star } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserAnnouncementPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserAnnouncementPanel";
import { UnpublishedFundraiser } from "@/app/buyer/fundraiser/[id]/components/UnpublishedFundraiser";
import { Card, CardContent } from "@/components/ui/card";
import { FundraiserReferralCard } from "./components/FundraiserReferralCard";
import { createClient } from "@/utils/supabase/server";
import { GoogleCalendarButton } from "./components/GoogleCalendarButton";

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

  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const id = (await params).id;
  const { preview } = await searchParams;
  const fundraiser = await getFundraiser(id);
  const fundraiserItems = await getFundraiserItems(id);

  if (!fundraiser.published && preview !== "true") {
    return <UnpublishedFundraiser fundraiser={fundraiser} />;
  }

  return (
    <div className="flex flex-col p-10 space-y-4">
      {fundraiser.imageUrls.length > 0 && (
        <FundraiserGallerySlider images={fundraiser.imageUrls} />
      )}

      <div className="flex flex-col items-start w-full space-y-2">
        <h1 className="text-3xl font-bold my-2">{fundraiser.name}</h1>
        <p className="text-gray-600 mb-4">{fundraiser.description}</p>

        {session && (
          <FundraiserReferralCard
            token={session.access_token}
            fundraiser={fundraiser}
            userId={session.user.id}
          />
        )}

        <Card className="w-full">
          <CardContent className="pt-6">
            <div className="flex items-start gap-2">
              <ShoppingBag className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Buying Window</span>
                <span className="text-md">
                  <b>
                    {format(
                      fundraiser.buyingStartsAt,
                      "MMM d, yyyy 'at' h:mm a"
                    )}{" "}
                    -{" "}
                    {format(fundraiser.buyingEndsAt, "MMM d, yyyy 'at' h:mm a")}
                  </b>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 w-full">
          <h3 className="text-lg font-semibold">Pickup Details</h3>
          <Card className="w-full border-[#f6f6f6]">
            <CardContent className="pt-[14px] px-[14px] pb-[14px]">
              <div className="flex flex-col gap-[10px]">
                {fundraiser.pickupEvents.map((event, index) => (
                  <div className="flex justify-between items-center">
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
                          {event.location}, {format(event.startsAt, "h:mm a")}{" "}
                          to {format(event.endsAt, "h:mm a")}
                        </span>
                      </div>
                    </div>
                    <GoogleCalendarButton
                      fundraiser={fundraiser}
                      pickupEvent={event}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <FundraiserAnnouncementPanel announcements={fundraiser.announcements} />

      <FundraiserItemsPanel
        fundraiserId={fundraiser.id}
        items={fundraiserItems}
      />
    </div>
  );
}
