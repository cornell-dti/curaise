import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema } from "common";
import Decimal from "decimal.js";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { PickupStatusBadge } from "@/components/custom/PickupStatusBadge";
import { CalendarIcon, CreditCard, MapPin, ShoppingBag, User } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// data fetching function
const getOrder = async (id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/order/" + id,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch order");
  }

  // parse order data
  const data = CompleteOrderSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data;
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection(); // ensures server component is dynamically rendered at runtime, not statically rendered at build time

  const supabase = await createClient();
  const id = (await params).id;

  // protect page (must use supabase.auth.getUser() according to docs)
  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/login");
  }

  // get auth jwt token
  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const order = await getOrder(id, session.access_token);

  const orderTotal = order.items
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0)
    )
    .toFixed(2);

  return (
    <div className="container max-w-4xl py-6 px-4 md:py-8 md:px-6">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Seller Order View</h1>
        <p className="text-muted-foreground">
          Order #{order.id} from {order.buyer.name}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Order Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Order Summary</CardTitle>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
              <PaymentStatusBadge order={order} />
              <PickupStatusBadge order={order} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm break-words">
                    Ordered at {format(order.createdAt, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm">
                    Paid with {order.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-muted-foreground">Order ID:</span>
                  <span className="text-sm font-medium break-all">{order.id}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-muted-foreground">Last Updated:</span>
                  <span className="text-sm">
                    {format(order.updatedAt, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Pickup Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  Pickup Location: <b>{order.fundraiser.pickupLocation}</b>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  Pickup Window:{" "}
                  <b>
                    {format(order.fundraiser.pickupStartsAt, "MMM d, yyyy 'at' h:mm a")}{" "}
                    - {format(order.fundraiser.pickupEndsAt, "MMM d, yyyy 'at' h:mm a")}
                  </b>
                  </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
            <CardDescription>
              {order.items.reduce((total, item) => total + item.quantity, 0)}{" "}
              items purchased
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((orderItem) => (
                <div
                  key={orderItem.item.id}
                  className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex-1 space-y-1 text-center sm:text-left">
                    <h3 className="font-medium">{orderItem.item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {orderItem.item.description}
                    </p>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <span className="text-sm">Qty: {orderItem.quantity}</span>
                      <span className="text-sm text-muted-foreground">×</span>
                      <span className="text-sm">
                        ${Decimal(orderItem.item.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center sm:justify-end sm:w-24 mt-2 sm:mt-0">
                    <span className="font-medium">
                      ${Decimal(orderItem.item.price).times(orderItem.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-bold">${orderTotal}</span>
            </div>
          </CardContent>
        </Card>

        {/* Buyer Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>Customer Information</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <div>
                <p className="font-medium mt-2 sm:mt-0">{order.buyer.name}</p>
                <p className="text-sm text-muted-foreground break-all">
                  {order.buyer.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fundraiser Info */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <CardTitle>Fundraiser</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div>
              <p className="font-medium mt-2 sm:mt-0">{order.fundraiser.name}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {order.fundraiser.description}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
