import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  CompleteFundraiserSchema,
  CompleteOrderSchema,
  CompleteItemSchema,
} from "common";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OrdersProvider } from "@/app/seller/fundraiser/[id]/orders/components/OrdersProvider";
import { OrdersSectionHeader } from "@/app/seller/fundraiser/[id]/orders/components/OrdersSectionHeader";
import { OrdersTableWrapper } from "@/app/seller/fundraiser/[id]/orders/components/OrdersTableWrapper";
import { ReferralsProvider } from "@/app/seller/fundraiser/[id]/referrals/components/ReferralsProvider";
import { ReferralsTableWrapper } from "@/app/seller/fundraiser/[id]/referrals/components/ReferralsTableWrapper";
import { RealtimeAnalyticsWrapper } from "@/app/seller/fundraiser/[id]/analytics/components/RealtimeAnalyticsWrapper";
import { FundraiserHeader } from "./components/FundraiserHeader";
import { serverFetch } from "@/lib/fetcher";
import { isPast } from "date-fns";

export default async function FundraiserAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Authentication
  const supabase = await createClient();
  const fundraiserId = (await params).id;

  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect(`/login?next=${encodeURIComponent(`/seller/fundraiser/${fundraiserId}`)}`);
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  // Fetch data in parallel
  const [fundraiser, orders, items] = await Promise.all([
    serverFetch(`/fundraiser/${fundraiserId}`, {
      token: session.access_token,
      schema: CompleteFundraiserSchema,
    }),
    serverFetch(`/fundraiser/${fundraiserId}/orders`, {
      token: session.access_token,
      schema: CompleteOrderSchema.array(),
    }),
    serverFetch(`/fundraiser/${fundraiserId}/items`, {
      token: session.access_token,
      schema: CompleteItemSchema.array(),
    }),
  ]);

  return (
    <ReferralsProvider
      initialReferrals={fundraiser.referrals}
      fundraiserId={fundraiserId}
      token={session.access_token}
    >
    <OrdersProvider
      initialOrders={orders}
      fundraiserId={fundraiserId}
      token={session.access_token}
    >
    <div className="px-4 md:px-[157px] min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        <div className="mb-6">
          <Link
            // Return back to seller organization page
            href={`/seller/org/${fundraiser.organization.id}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            CURaise
          </Link>

          <FundraiserHeader
            token={session.access_token}
            fundraiser={fundraiser}
            fundraiserItems={items}
          />
        </div>

        {/* Key Insights - Realtime */}
        <RealtimeAnalyticsWrapper
          goalAmount={Number(fundraiser.goalAmount)}
          items={items}
        />

        {/* Orders Section */}
        <div className="mb-6">
          <OrdersSectionHeader
            fundraiserId={fundraiserId}
            items={items}
            token={session.access_token}
            isPast={fundraiser.pickupEvents.every((event) =>
              isPast(event.endsAt),
            )}
          />
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <OrdersTableWrapper
                token={session.access_token}
                fundraiserName={fundraiser.name}
              />
            </div>
          </div>
        </div>

        {/* Referrals Section */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-6">Referrals</h2>
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <ReferralsTableWrapper fundraiserName={fundraiser.name} />
            </div>
          </div>
        </div>
      </div>
    </div>
    </OrdersProvider>
    </ReferralsProvider>
  );
}
