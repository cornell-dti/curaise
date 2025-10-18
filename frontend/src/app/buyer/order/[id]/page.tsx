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
  ShoppingBag,
  User,
  ExternalLink,
} from "lucide-react";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { Separator } from "@/components/ui/separator";
import { PickupStatusBadge } from "@/components/custom/PickupStatusBadge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CopyOrderIdButton } from "@/components/custom/CopyOrderIdButton";

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
    throw new Error(result.message);
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

  // Use full order ID for Venmo payment
  const orderIdForPayment = order.id;

  // Get banner styling based on payment status and method
  const getBannerStyling = () => {
    // Handle OTHER payment method - should always show UNVERIFIABLE messaging (except when CONFIRMED)
    if (order.paymentMethod === "OTHER") {
      if (order.paymentStatus === "CONFIRMED") {
        return {
          borderColor: "border-green-500",
          bgColor: "",
          textColor: "text-green-800 dark:text-green-200",
          title: "Payment Confirmed",
          message: "Your payment has been verified. No further action is required.",
        };
      } else {
        // OTHER + PENDING or OTHER + UNVERIFIABLE both show UNVERIFIABLE messaging
        return {
          borderColor: "border-blue-500",
          bgColor: "",
          textColor: "text-blue-800 dark:text-blue-200",
          title: "Order Processed",
          message: "Your order has been received. Payment will have to be manually verified by the fundraiser managers.",
        };
      }
    }

    // Handle VENMO payment method
    switch (order.paymentStatus) {
      case "PENDING":
        return {
          borderColor: "border-blue-500",
          bgColor: "",
          textColor: "text-blue-800 dark:text-blue-200",
          title: "Payment Required",
          message: "Complete your payment to confirm your order.",
        };
      case "CONFIRMED":
        return {
          borderColor: "border-green-500",
          bgColor: "",
          textColor: "text-green-800 dark:text-green-200",
          title: "Payment Confirmed",
          message: "Your payment has been verified. No further action is required.",
        };
      case "UNVERIFIABLE":
        // This shouldn't happen for VENMO orders, but handle it gracefully
        return {
          borderColor: "border-blue-500",
          bgColor: "",
          textColor: "text-blue-800 dark:text-blue-200",
          title: "Order Processed",
          message: "Your order has been received. Payment will have to be manually verified by the fundraiser managers.",
        };
    }
  };

  const bannerStyle = getBannerStyling();

  return (
    <div className="container max-w-4xl py-6 px-4 md:py-8 md:px-6 mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Order Details</h1>
        <p className="text-muted-foreground">
          View the details of your order from <b>{order.fundraiser.name}</b>
        </p>
      </div>

      <div className="grid gap-6">

        {/* Payment Banner */}
        <Card className={`${bannerStyle.borderColor} ${bannerStyle.bgColor}`}>
          <CardHeader className="py-6">
            <CardTitle className={bannerStyle.textColor}>
              {bannerStyle.title}
            </CardTitle>
            <CardDescription className={bannerStyle.textColor}>
              {bannerStyle.message}
            </CardDescription>
          </CardHeader>
           {/* Only show CardContent for PENDING orders */}
           {order.paymentStatus === "PENDING" && (
            <CardContent>
              <div className="space-y-4">
                {/* Show Venmo button only for VENMO payment method */}
                {order.paymentMethod === "VENMO" && (
                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      asChild
                      className="flex items-center gap-2 bg-[#3D95CE] hover:bg-[#2E7BB8] text-white font-semibold px-8 py-3 text-md"
                    >
                      <a
                        href={order.fundraiser.venmoUsername
                          ? `https://venmo.com/${order.fundraiser.venmoUsername}?txn=pay&note=${orderIdForPayment}&amount=${orderTotal}`
                          : `https://venmo.com?txn=pay&note=${orderIdForPayment}&amount=${orderTotal}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Pay with Venmo</a>
                    </Button>
                  </div>
                )}

                {/* Show payment details only for VENMO orders */}
                <details className="text-sm text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground">
                    Link not working?
                  </summary>
                  <div className="mt-2 pl-4 border-l-2 border-muted space-y-3">
                    <p className="mb-1 text-sm">
                      Manual entry details (enter exactly as shown, or the order may not be processed correctly):
                    </p>
                    {order.fundraiser.venmoUsername && (
                      <>
                        <p className="mb-1 text-sm">Send to Venmo username:</p>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                            @{order.fundraiser.venmoUsername}
                          </code>
                          <CopyOrderIdButton orderId={`${order.fundraiser.venmoUsername}`} />
                        </div>
                      </>
                    )}

                    <div>
                      <p className="mb-1 text-sm">Amount to send:</p>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono">
                          ${orderTotal}
                        </code>
                        <CopyOrderIdButton orderId={orderTotal} />
                      </div>
                    </div>

                    <div>
                      <p className="mb-1 text-sm">Send this exact order ID as your Venmo message:</p>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                          {orderIdForPayment}
                        </code>
                        <CopyOrderIdButton orderId={orderIdForPayment} />
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Order Summary Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Order Summary</CardTitle>
            <PaymentStatusBadge order={order} />
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <span className="text-sm break-words">
                    Ordered at{" "}
                    {format(order.createdAt, "MMM d, yyyy 'at' h:mm a")}
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
                    {format(order.updatedAt, "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pickup Info Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Pickup Info</CardTitle>
            <PickupStatusBadge order={order} />
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
                    {format(
                      order.fundraiser.pickupStartsAt,
                      "MMM d, yyyy 'at' h:mm a"
                    )}{" "}
                    -{" "}
                    {format(
                      order.fundraiser.pickupEndsAt,
                      "MMM d, yyyy 'at' h:mm a"
                    )}
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
              {order.items.map((orderItem,) => (
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

        {/* Buyer and Fundraiser Info */}
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

          <Link href={`/buyer/fundraiser/${order.fundraiser.id}`}>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  <CardTitle>Fundraiser</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-medium mt-2 sm:mt-0">
                    {order.fundraiser.name}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {order.fundraiser.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
