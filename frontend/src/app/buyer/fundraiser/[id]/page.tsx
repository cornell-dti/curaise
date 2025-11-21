import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ShoppingBag, Star } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserAnnouncementPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserAnnouncementPanel";
import { UnpublishedFundraiser } from "@/app/buyer/fundraiser/[id]/components/UnpublishedFundraiser";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FundraiserReferralCard } from "./components/FundraiserReferralCard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("Session invalid");
  }

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
        <div className="w-full">
          <FundraiserReferralCard
            token={session.access_token}
            fundraiser={fundraiser}
            id={id}
          />
        </div>
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

        <div className="flex flex-col gap-3 mt-4 w-full">
          <h3 className="text-lg font-semibold">Pickup Events</h3>
          <div className="flex flex-col gap-3">
            {fundraiser.pickupEvents.map((event) => (
              <Card key={event.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                      <span className="text-md">
                        <b>{event.location}</b>
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground mt-0.5" />
                      <span className="text-md">
                        <b>
                          {format(event.startsAt, "MMM d, yyyy 'at' h:mm a")} -{" "}
                          {format(event.endsAt, "MMM d, yyyy 'at' h:mm a")}
                        </b>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
