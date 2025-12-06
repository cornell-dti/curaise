import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
	CompleteFundraiserSchema,
	CompleteOrderSchema,
	CompleteItemSchema,
} from "common";
import { ArrowLeft, Banknote, Goal, Receipt } from "lucide-react";
import Link from "next/link";
import { ProfitGoalChart } from "@/app/seller/fundraiser/[id]/analytics/components/ProfitGoalChart";
import { RevenueBreakdownChart } from "@/app/seller/fundraiser/[id]/analytics/components/RevenueBreakdownChart";
import { ItemsSoldCard } from "@/app/seller/fundraiser/[id]/analytics/components/ItemsSoldCard";
import { OrdersTableWrapper } from "@/app/seller/fundraiser/[id]/orders/components/OrdersTableWrapper";
import { OrdersSectionHeader } from "@/app/seller/fundraiser/[id]/orders/components/OrdersSectionHeader";
import { ReferralsTableWrapper } from "@/app/seller/fundraiser/[id]/referrals/components/ReferralsTableWrapper";
import { FundraiserHeader } from "./components/FundraiserHeader";

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

const getFundraiserAnalytics = async (
	id: string,
	token: string
): Promise<FundraiserAnalytics> => {
	const response = await fetch(
		process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + id + "/analytics",
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
	return result.data;
};

const getFundraiser = async (id: string, token: string) => {
	const response = await fetch(
		process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + id,
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

	const data = CompleteFundraiserSchema.safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse fundraiser data");
	}
	return data.data;
};

// Fetch orders associated with the fundraiser
const getOrdersByFundraiser = async (fundraiserId: string, token: string) => {
	const response = await fetch(
		process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
		{
			headers: {
				Authorization: "Bearer " + token,
			},
		}
	);

	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.message || "Failed to fetch orders");
	}

	const data = CompleteOrderSchema.array().safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse order data");
	}
	return data.data;
};

// Fetch items associated with the fundraiser
const getFundraiserItems = async (fundraiserId: string, token: string) => {
	const response = await fetch(
		process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/items",
		{
			headers: {
				Authorization: "Bearer " + token,
			},
		}
	);

	const result = await response.json();

	if (!response.ok) {
		throw new Error(result.message || "Failed to fetch items");
	}

	const data = CompleteItemSchema.array().safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse item data");
	}
	return data.data;
};

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
	const [fundraiser, analytics, orders, items] = await Promise.all([
		getFundraiser(fundraiserId, session.access_token),
		getFundraiserAnalytics(fundraiserId, session.access_token),
		getOrdersByFundraiser(fundraiserId, session.access_token),
		getFundraiserItems(fundraiserId, session.access_token),
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
						className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
						<ArrowLeft className="w-4 h-4" />
						CURaise
					</Link>

					<FundraiserHeader
						token={session.access_token}
						fundraiser={fundraiser}
						fundraiserItems={items}
					/>
				</div>

				{/* Key Insights */}
				<div className="mb-6">
					<h2 className="text-xl font-bold mb-6">Key Insights</h2>
					<div className="grid grid-cols-[0.6fr_0.8fr_1fr_1.5fr] gap-6">
						{/* First Column - Revenue and Total Orders stacked */}
						<div className="flex flex-col gap-6 h-full">
							{/* Revenue Card */}
							<div className="bg-white rounded-lg shadow p-6 flex-1 flex flex-col">
								<div className="flex items-center gap-2 mb-2 font-semibold">
									<Banknote />
									Revenue
								</div>
								<div className="text-3xl font-semibold">
									${analytics.total_revenue.toFixed(2)}
								</div>
							</div>

							{/* Total Orders Card */}
							<div className="bg-white rounded-lg shadow p-6 flex-1">
								<div className="flex items-center gap-2 mb-2 font-semibold">
									<Receipt />
									Total Orders
								</div>
								<div className="text-3xl font-semibold">
									{analytics.total_orders}
								</div>
							</div>
						</div>

						{/* Profit Goal Card */}
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center gap-2 mb-4 font-semibold">
								<Goal />
								Profit Goal
							</div>
							<ProfitGoalChart
								profit={0}
								goalAmount={Number(fundraiser.goalAmount)}
							/>
						</div>

						{/* Revenue Breakdown Card */}
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center gap-2 mb-4 font-semibold">
								<Receipt />
								Revenue Breakdown
							</div>
							<RevenueBreakdownChart
								itemRevenue={itemRevenue}
								totalRevenue={analytics.total_revenue}
							/>
						</div>

						{/* Items Sold Card */}
						<div className="bg-white rounded-lg shadow p-6">
							<div className="flex items-center gap-2 mb-4 font-semibold">
								<Receipt />
								Items Sold
							</div>
							<ItemsSoldCard items={analytics.items} />
						</div>
					</div>
				</div>

				{/* Orders Section */}
				<div className="mb-6">
					<OrdersSectionHeader
						fundraiserId={fundraiserId}
						items={items}
						token={session.access_token}
					/>
					<div className="bg-white rounded-lg shadow-sm">
						<div className="p-6">
							<OrdersTableWrapper
								orders={orders}
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
							<ReferralsTableWrapper
								referrals={fundraiser.referrals}
								orders={orders}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
