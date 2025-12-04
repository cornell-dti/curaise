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
  DollarSign,
  Mail,
  MapPin,
  User,
} from "lucide-react";
import { PaymentStatusBadge } from "@/components/custom/PaymentStatusBadge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ConfettiWrapper } from "@/components/custom/ConfettiWrapper";

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

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <ConfettiWrapper />
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-10 mb-2">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <PaymentStatusBadge order={order} />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-800">
          <span>
            Ordered on {format(order.createdAt, "MMM d, yyyy 'at' h:mm a")}
          </span>
          <span>|</span>
          <span>Order Id: {order.id}</span>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Two-column grid layout */}
        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          {/* Left Column: Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pickup Details Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Pickup Details</h3>
                  {order.fundraiser.pickupEvents.length > 0 && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {format(
                          order.fundraiser.pickupEvents[0].startsAt,
                          "EEEE, M/d/yyyy"
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {order.fundraiser.pickupEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">
                          <span className="font-medium">{event.location}</span>
                          <br />
                          {format(event.startsAt, "h:mm a")} to{" "}
                          {format(event.endsAt, "h:mm a")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Details Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Payment Details</h3>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Paid with {order.paymentMethod}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ${orderTotal} Total
                    </span>
                  </div>
                </div>

                {/* Buyer Info Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-base">Buyer Info</h3>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm">{order.buyer.name}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm break-all">
                      {order.buyer.email}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 text-sm font-semibold border-b pb-2">
                  <div>Items</div>
                  <div>Qty</div>
                  <div>Cost</div>
                </div>

                {/* Items */}
                {order.items.map((orderItem) => (
                  <div
                    key={orderItem.item.id}
                    className="grid grid-cols-[1fr_auto_auto] gap-4 items-center"
                  >
                    <div className="flex items-center gap-3">
                      {orderItem.item.imageUrl ? (
                        <img
                          src={orderItem.item.imageUrl || "/placeholder.svg"}
                          alt={orderItem.item.name}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                          <span className="text-xs text-gray-400">
                            No image
                          </span>
                        </div>
                      )}
                      <span className="text-sm">{orderItem.item.name}</span>
                    </div>
                    <div className="text-sm">x{orderItem.quantity}</div>
                    <div className="text-sm">
                      ${Decimal(orderItem.item.price).toFixed(2)}
                    </div>
                  </div>
                ))}

                {/* Total */}
                <Separator />
                <div className="grid grid-cols-[1fr_auto_auto] gap-4 font-bold">
                  <div>Total</div>
                  <div></div>
                  <div>${orderTotal}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Venmo QR Code Section */}
        <Card>
          <CardHeader>
            <CardTitle>Venmo QR Code</CardTitle>
            <CardDescription>
              Show this to DTI at pick up to get your order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              {/* Placeholder QR code - dashed border box */}
              <div className="w-64 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center rounded">
                <p className="text-sm text-muted-foreground">
                  QR Code Placeholder
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
