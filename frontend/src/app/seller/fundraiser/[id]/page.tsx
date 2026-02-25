import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  CompleteFundraiserSchema,
  CompleteOrderSchema,
  CompleteItemSchema,
} from "common";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { OrdersSectionHeader } from "@/app/seller/fundraiser/[id]/orders/components/OrdersSectionHeader";
import { RealtimeOrdersWrapper } from "@/app/seller/fundraiser/[id]/orders/components/RealtimeOrdersWrapper";
import { RealtimeReferralsWrapper } from "@/app/seller/fundraiser/[id]/referrals/components/RealtimeReferralsWrapper";
import { RealtimeAnalyticsWrapper } from "@/app/seller/fundraiser/[id]/analytics/components/RealtimeAnalyticsWrapper";
import { FundraiserHeader } from "./components/FundraiserHeader";
import { serverFetch } from "@/lib/fetcher";

interface FundraiserAnalytics {
  total_revenue: number;
  total_orders: number;
  orders_picked_up: number;
  items: Record<string, number>;
  pending_orders: number;
  profit: number;
  goal_amount: number;
  sale_data: Record<string, number>;
  revenue_data: Record<string, number>;
  start_date: Date;
  end_date: Date;
}

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
    redirect("/login");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  // Fetch data in parallel
  // TODO: refactor fundraiseranalytics into a zod schema and validate it here instead of individually validating orders/items/fundraiser
  const [fundraiser, analytics, orders, items] = await Promise.all([
    serverFetch(`/fundraiser/${fundraiserId}`, {
      token: session.access_token,
      schema: CompleteFundraiserSchema,
    }),
    serverFetch(`/fundraiser/${fundraiserId}/analytics`, {
      token: session.access_token,
    }) as Promise<FundraiserAnalytics>,
    serverFetch(`/fundraiser/${fundraiserId}/orders`, {
      token: session.access_token,
      schema: CompleteOrderSchema.array(),
    }),
    serverFetch(`/fundraiser/${fundraiserId}/items`, {
      token: session.access_token,
      schema: CompleteItemSchema.array(),
    }),
  ]);

  // Create a map of item name to price for revenue calculation
  const itemPriceMap = new Map<string, number>();
  items.forEach((item) => {
    itemPriceMap.set(item.name, Number(item.price));
  });

  // Calculate revenue per item
  const itemRevenue: Record<string, number> = {};
  Object.entries(analytics.items).forEach(([itemName, count]) => {
    const price = itemPriceMap.get(itemName) || 0;
    itemRevenue[itemName] = count * price;
  });

  return (
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
          initialAnalytics={analytics}
          fundraiserId={fundraiserId}
          token={session.access_token}
          goalAmount={Number(fundraiser.goalAmount)}
          items={items}
        />

        {/* Orders Section */}
        <div className="mb-6">
          <OrdersSectionHeader
            fundraiserId={fundraiserId}
            items={items}
            token={session.access_token}
          />
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <RealtimeOrdersWrapper
                initialOrders={orders}
                fundraiserId={fundraiserId}
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
              <RealtimeReferralsWrapper
                initialReferrals={fundraiser.referrals}
                fundraiserId={fundraiserId}
                orders={orders}
                token={session.access_token}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
