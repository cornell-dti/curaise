import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicOrderSchema } from "common";
import { OrderCard } from "@/components/custom/OrderCard";

const getOrders = async (userId: string, token: string) => {
	const response = await fetch(
		process.env.NEXT_PUBLIC_API_URL + "/user/" + userId + "/orders",
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

	// parse order data
	const data = BasicOrderSchema.array().safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse order data");
	}

	return data.data;
};

export default async function BuyerHome() {
	await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

	const supabase = await createClient();

	// protect page (must use supabase.auth.getUser() according to docs)
	const {
		data: { user },
		error: error1,
	} = await supabase.auth.getUser();
	if (error1 || !user) {
		redirect("/");
	}

	// get auth jwt token
	const {
		data: { session },
		error: error2,
	} = await supabase.auth.getSession();
	if (error2 || !session?.access_token) {
		throw new Error("Session invalid");
	}

	const orders = await getOrders(user.id, session.access_token);

	const inProgressOrders = orders.filter((order) => !order.pickedUp);

	return (
		<div className="px-4 md:px-[157px] py-6">
			<div className="flex flex-col space-y-6">
				<h1 className="text-3xl font-bold">Orders</h1>

				<Tabs defaultValue="active" className="w-full">
					<TabsList className="h-auto w-auto bg-transparent rounded-none p-0 gap-8">
						<TabsTrigger
							value="active"
							className="text-[18px] rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 font-normal data-[state=active]:font-semibold data-[state=inactive]:text-gray-400">
							Active
						</TabsTrigger>
						<TabsTrigger
							value="completed"
							className="text-[18px] rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent data-[state=active]:shadow-none bg-transparent px-0 pb-3 font-normal data-[state=active]:font-semibold data-[state=inactive]:text-gray-400">
							Completed
						</TabsTrigger>
					</TabsList>

					<TabsContent value="active" className="space-y-4 mt-6">
						{inProgressOrders.length > 0 ? (
							inProgressOrders.map((order) => (
								<OrderCard key={order.id} order={order} />
							))
						) : (
							<div className="text-center py-12">
								<Clock className="mx-auto h-12 w-12 text-muted-foreground" />
								<h3 className="mt-4 text-lg font-medium">No active orders</h3>
								<p className="text-muted-foreground">
									You don&apos;t have any active orders at the moment.
								</p>
							</div>
						)}
					</TabsContent>

					<TabsContent value="completed" className="space-y-4 mt-6">
						{orders.filter((order) => order.pickedUp).length > 0 ? (
							orders
								.filter((order) => order.pickedUp)
								.map((order) => <OrderCard key={order.id} order={order} />)
						) : (
							<div className="text-center py-12">
								<Clock className="mx-auto h-12 w-12 text-muted-foreground" />
								<h3 className="mt-4 text-lg font-medium">
									No completed orders
								</h3>
								<p className="text-muted-foreground">
									You haven&apos;t completed any orders yet.
								</p>
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
