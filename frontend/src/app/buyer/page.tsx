import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Clock, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicOrderSchema, UserSchema } from "common";
import { OrderCard } from "@/components/custom/OrderCard";
import { isPast } from "date-fns";
import { EditBuyerInfoDialog } from "@/components/custom/EditBuyerInfoDialog";

const getUserProfile = async (userId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/user/" + userId,
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

  // parse user data
  const data = UserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse user data");
  }
  return data.data;
};

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

  const userProfile = await getUserProfile(user.id, session.access_token);
  const orders = await getOrders(user.id, session.access_token);

  const inProgressOrders = orders.filter((order) =>
    order.fundraiser.pickupEvents.some((event) => !isPast(event.endsAt))
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-3">
            <ShoppingBag className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-lg my-auto">
            You currently have {inProgressOrders.length} active{" "}
            {inProgressOrders.length == 1 ? "order" : "orders"}.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between space-x-4 mb-6 p-4">
        <p>Looking to edit your account information?</p>
        <EditBuyerInfoDialog user={userProfile} token={session.access_token} />
      </div>

      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">My Orders</h1>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4 mt-4">
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

          <TabsContent value="all" className="space-y-4 mt-4">
            {orders.length > 0 ? (
              orders.map((order) => <OrderCard key={order.id} order={order} />)
            ) : (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No orders</h3>
                <p className="text-muted-foreground">
                  You haven&apos;t placed any orders yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
