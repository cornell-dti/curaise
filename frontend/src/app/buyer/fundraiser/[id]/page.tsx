import { connection } from "next/server";
import { CompleteFundraiserSchema, CompleteItemSchema } from "common";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronLeft, UserStar } from "lucide-react";
import { FundraiserItemsPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserItemsPanel";
import { FundraiserGallerySlider } from "@/app/buyer/fundraiser/[id]/components/FundraiserGallerySlider";
import { FundraiserAnnouncementPanel } from "@/app/buyer/fundraiser/[id]/components/FundraiserAnnouncementPanel";
import { UnpublishedFundraiser } from "@/app/buyer/fundraiser/[id]/components/UnpublishedFundraiser";
import { FundraiserCartSidebar } from "@/app/buyer/fundraiser/[id]/components/FundraiserCartSidebar";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { FundraiserReferralCard } from "./components/FundraiserReferralCard";
import { createClient } from "@/utils/supabase/server";
import { GoogleCalendarButton } from "./components/GoogleCalendarButton";
import { serverFetch } from "@/lib/fetcher";

export default async function FundraiserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string; code?: string }>;
}) {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const id = (await params).id;
  const { code, preview } = await searchParams;
  const codeValue = typeof code === "string" ? code : "";

  const fundraiser = await serverFetch(`/fundraiser/${id}`, {
    schema: CompleteFundraiserSchema,
  });
  const fundraiserItems = await serverFetch(`/fundraiser/${id}/items`, {
    schema: CompleteItemSchema.array(),
  });

  if (!fundraiser.published && preview !== "true") {
    return <UnpublishedFundraiser fundraiser={fundraiser} />;
  }

  return (
    <div className="flex flex-col -mt-16 md:mt-0">
      {/* Back button - Mobile only */}
      <Link
        href="/buyer/browse"
        className="md:hidden fixed top-5 left-5 z-50 rounded-full transition-colors flex-shrink-0 flex items-center justify-center p-1"
        style={{ backgroundColor: "rgba(178, 178, 178, 0.21)" }}
      >
        <ChevronLeft strokeWidth={2} className="h-8 w-8 text-stone-800" />
      </Link>

      <div className="relative mb-10">
        {fundraiser.imageUrls.length > 0 ? (
          <FundraiserGallerySlider images={fundraiser.imageUrls} />
        ) : (
          <div className="w-full h-[379px] md:h-[400px] bg-gray-200" />
        )}
      </div>

      <div className="flex flex-col px-4 md:px-[157px] pb-10 space-y-[22px] md:space-y-6">
        <div className="flex flex-col items-start w-full space-y-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-medium">{fundraiser.name}</h1>
            <p className="text-base text-muted-foreground">
              Hosted by: <span>{fundraiser.organization.name}</span>
            </p>
          </div>
          <div className="w-full">
            {codeValue == "" && user && session?.access_token && (
              <FundraiserReferralCard
                token={session.access_token}
                fundraiser={fundraiser}
                userId={user.id}
              />
            )}
            {codeValue != "" && (
              <Card className="w-full">
                <CardContent className="py-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <span className="flex gap-2 items-start text-md font-semibold">
                      <UserStar /> This order will be referring{" "}
                      {fundraiser.referrals.find((r) => r.id === codeValue)
                        ?.referrer.name || "No Referral"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
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
                    <div
                      key={event.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex flex-col gap-3">
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
              <FundraiserCartSidebar
                fundraiserId={fundraiser.id}
                referralId={codeValue}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
