import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema } from "common";
import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  CreditCard,
  MapPin,
  Package,
  ShoppingBag,
  User,
} from "lucide-react";
import Image from "next/image";
import { OrderStatusBadge } from "@/components/custom/OrderStatusBadge";
import { Separator } from "@/components/ui/separator";

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
    <h1>Session invalid</h1>;
  }

  // get order
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/order/" + id,
    {
      headers: {
        Authorization: "Bearer " + session?.access_token,
      },
    }
  );
  const result = await response.json();
  if (!response.ok) {
    return <h1>{result.message}</h1>;
  }
  const data = CompleteOrderSchema.safeParse(result.data);
  if (!data.success) {
    return <h1>Couldn't parse order</h1>;
  }
  const order = data.data;
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
        <p className="text-muted-foreground">
          View the details of your order from <b>{order.fundraiser.name}</b>
        </p>
      </div>

      <div className="grid gap-6">
        {/* Order Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Order Summary</CardTitle>
            <OrderStatusBadge status={order.paymentStatus} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm break-words">
                    Ordered at {order.createdAt.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm">
                    Paid with {order.paymentMethod}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm">
                    {order.pickedUp ? "Picked up" : "Not picked up yet"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                  <span className="text-sm">
                    Pickup Location: <b>{order.fundraiser.pickupLocation}</b>
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-muted-foreground">
                    Order ID:
                  </span>
                  <span className="text-sm font-medium break-all">
                    {order.id}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="text-sm text-muted-foreground">
                    Last Updated:
                  </span>
                  <span className="text-sm">
                    {order.updatedAt.toLocaleString()}
                  </span>
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
              {order.items.map((orderItem, index) => (
                <div
                  key={orderItem.item.id}
                  className="flex flex-col sm:flex-row gap-4 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <Image
                      src={"/placeholder.svg"}
                      alt={orderItem.item.name}
                      width={80}
                      height={80}
                      className="rounded-md object-cover"
                    />
                  </div>
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

        {/* Buyer and Fundraiser Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <CardTitle>Buyer Information</CardTitle>
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
                <CardTitle>Fundraiser</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
                {/* <Image
                  src={order.fundraiser || "/placeholder.svg"}
                  alt={order.fundraiser.name}
                  width={40}
                  height={40}
                  className="rounded-md"
                /> */}
                <div>
                  <p className="font-medium mt-2 sm:mt-0">
                    {order.fundraiser.name}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {order.fundraiser.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
