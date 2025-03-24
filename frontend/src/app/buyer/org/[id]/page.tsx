import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { FaInstagram } from "react-icons/fa";
import { LuShieldCheck } from "react-icons/lu";
import { CompleteOrganizationSchema } from "common";
import { CompleteFundraiserSchema } from "common";
import { connection } from "next/server";
import { z } from "zod";
import { FundraiserDrawerContent } from "@/components/custom/FundraiserDrawerCard";
import { Separator } from "@/components/ui/separator";

const getOrganization = async (id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/organization/" + id,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  const data = CompleteOrganizationSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data;
};

export const getFundraisersByOrganization = async (
  organizationId: string,
  token: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organization/${organizationId}/fundraisers`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;

  const transformFundraiser = (fundraiser: Fundraiser) => ({
    ...fundraiser,
    goalAmount: Number(fundraiser.goalAmount),
    buyingStartsAt: new Date(fundraiser.buyingStartsAt),
    buyingEndsAt: new Date(fundraiser.buyingEndsAt),
    pickupStartsAt: new Date(fundraiser.pickupStartsAt),
    pickupEndsAt: new Date(fundraiser.pickupEndsAt),
    imageUrls: fundraiser.imageUrls ?? [],
    announcements: fundraiser.announcements ?? [],
  });

  const transformedData = result.data.map(transformFundraiser);

  const data = z.array(CompleteFundraiserSchema).safeParse(transformedData);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data.");
  }

  return data.data;
};

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const supabase = await createClient();
  const id = (await params).id;

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const org = await getOrganization(id, session.access_token);

  const fundraisers = await getFundraisersByOrganization(
    org.id,
    session.access_token
  );
  const fundraisersArray = Array.isArray(fundraisers)
    ? fundraisers
    : [fundraisers];

  const now = new Date();

  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;
  const pastFundraisers: Fundraiser[] = [];
  const currentAndFutureFundraisers: Fundraiser[] = [];
  fundraisersArray.forEach((fundraiser) => {
    const endDate = new Date(fundraiser.pickupEndsAt);

    if (endDate < now) {
      pastFundraisers.push(fundraiser);
    } else {
      currentAndFutureFundraisers.push(fundraiser);
    }
  });

  const instagramLink = org.instagramUsername
    ? `https://www.instagram.com/${org.instagramUsername}`
    : "#";

  return (
    <section className="container mx-auto px-6 py-8 md:py-12">
      <section className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex flex-row items-center gap-3">
            <h1 className="text-4xl md:text-4xl font-bold tracking-tight leading-tight">
              {org.name}
            </h1>
            {org.authorized ? (
              <LuShieldCheck className="text-gray-600" />
            ) : (
              <></>
            )}
          </div>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            {org.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Button asChild variant="outline" size="lg" className="h-10">
            <Link href={org.websiteUrl || "#"} className="no-underline">
              {org.name}&apos;s website
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-10 inline-flex items-center"
          >
            <Link href={instagramLink} className="flex items-center gap-2">
              <FaInstagram className="mr-2 h-4 w-4" /> @{org.instagramUsername}
            </Link>
          </Button>
        </div>

        <div className="flex flex-row items-center gap-5 pt-10">
          <h1 className="text-2xl md:text-2xl font-bold tracking-tight leading-tight">
            Current Fundraisers
          </h1>
          <Separator className="flex-1" />
        </div>
        <div>
          {currentAndFutureFundraisers.length > 0 ? (
            <FundraiserDrawerContent fundraisersArray={currentAndFutureFundraisers} />
          ) : (
            <p className="text-sm text-gray-500 pl-4">
              No active fundraisers found.
            </p>
          )}
        </div>

        <div className="flex flex-row items-center gap-5 pt-7">
          <h1 className="text-2xl md:text-2xl font-bold tracking-tight leading-tight">
            Past Fundraisers
          </h1>
          <Separator className="flex-1" />
        </div>
        <div>
          {pastFundraisers.length > 0 ? (
            <FundraiserDrawerContent fundraisersArray={pastFundraisers} />
          ) : (
            <p className="text-sm text-gray-500 pl-4">
              No active fundraisers found.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
