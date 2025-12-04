import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema } from "common";
import Decimal from "decimal.js";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { PickupStatusBadge } from "@/components/custom/PickupStatusBadge";
import { OrderActionButtons } from "@/components/custom/OrderActionButtons";
import { CreditCard, ShoppingBag, User, CalendarIcon } from "lucide-react";
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
    redirect("/");
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
    <div className="container max-w-4xl py-6 px-4 md:py-8 md:px-6 mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
      </div>

      <div className="grid gap-6">
        {/* Action Buttons Card */}
        <Card>
          <CardHeader>
            <CardTitle>Order Actions</CardTitle>
            <CardDescription>
              Confirm payment and mark order as picked up
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderActionButtons order={order} />
          </CardContent>
        </Card>

        {/* Order Status Card*/}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Payment Status</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <PaymentStatusBadge order={order} />
                      <span className="text-sm text-muted-foreground">
                        {order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Customer</h3>
                    <p className="text-sm mt-1">{order.buyer.name}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Pickup Status</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <PickupStatusBadge order={order} />
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShoppingBag className="h-5 w-5 flex-shrink-0 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold">Order Total</h3>
                    <p className="text-sm mt-1">
                      ${orderTotal} •{" "}
                      {order.items.reduce(
                        (total, item) => total + item.quantity,
                        0
                      )}{" "}
                      items
                    </p>
                  </div>
                </div>
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
                      $
                      {Decimal(orderItem.item.price)
                        .times(orderItem.quantity)
                        .toFixed(2)}
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

        {/* Buyer and Order Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Buyer Info</CardTitle>
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

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <CardTitle>Order Info</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <p className="font-medium mt-2 sm:mt-0">Order ID: {order.id}</p>
                <p className="text-sm text-muted-foreground">
                  Placed on: {format(order.createdAt, "MMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
