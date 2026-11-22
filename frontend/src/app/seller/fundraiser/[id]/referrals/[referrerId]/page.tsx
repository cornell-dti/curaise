import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import Link from "next/link";
import Decimal from "decimal.js";
import {
  ReferrerOrdersResponseSchema,
  ReferrerOtherFundraisersResponseSchema,
} from "common";
import { serverFetch } from "@/lib/fetcher";
import { getOrderBuyer } from "@/lib/order-buyer";
import { LocalDate } from "@/components/ui/LocalDate";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

function PaymentStatusPill({
  paymentStatus,
}: {
  paymentStatus: "CONFIRMED" | "PENDING" | "UNVERIFIABLE";
}) {
  if (paymentStatus === "CONFIRMED") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#DCEBDE] text-[#086A19] rounded-full px-3 py-1 hover:bg-[#c5e0c6] hover:text-[#065a13] font-[700] text-md">
          Received
        </Badge>
      </div>
    );
  }
  if (paymentStatus === "UNVERIFIABLE") {
    return (
      <div className="flex justify-center">
        <Badge className="flex justify-center items-center min-w-[90px] bg-[#F7F7F7] text-[#959494] rounded-full px-3 py-1 hover:bg-[#e5e5e5] hover:text-[#6e6e6e] font-[700] text-md">
          Unverified
        </Badge>
      </div>
    );
  }
  return (
    <div className="flex justify-center">
      <Badge className="flex justify-center items-center min-w-[90px] bg-[#FBE6E6] text-[#E1080B] rounded-full px-3 py-1 hover:bg-[#f5c6c6] hover:text-[#b30607] font-[700] text-md">
        Not Received
      </Badge>
    </div>
  );
}

export default async function ReferrerDetailPage({
  params,
}: {
  params: Promise<{ id: string; referrerId: string }>;
}) {
  await connection();

  const { id: fundraiserId, referrerId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/seller/fundraiser/${fundraiserId}/referrals/${referrerId}`
      )}`
    );
  }

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("No session found");
  }

  const [referrerOrders, otherFundraisers] = await Promise.all([
    serverFetch(
      `/fundraiser/${fundraiserId}/referrals/${referrerId}/orders`,
      {
        token: session.access_token,
        schema: ReferrerOrdersResponseSchema,
      }
    ),
    serverFetch(
      `/fundraiser/${fundraiserId}/referrals/${referrerId}/other-fundraisers`,
      {
        token: session.access_token,
        schema: ReferrerOtherFundraisersResponseSchema,
      }
    ),
  ]);

  const { referrer, orders } = referrerOrders;
  const netId = referrer.email.split("@")[0];

  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div className="space-y-2">
        <Link
          href={`/seller/fundraiser/${fundraiserId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to fundraiser
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {referrer.name}
        </h1>
        <p className="text-muted-foreground">{netId}</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">
          Referred orders ({orders.length})
        </h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Order date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>
                  <div className="flex items-center justify-center w-full px-2">
                    Payment Status
                  </div>
                </TableHead>
                <TableHead>Order</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No counted referred orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const buyer = getOrderBuyer(order);
                  const total = order.items
                    .reduce(
                      (sum, line) =>
                        sum.plus(
                          new Decimal(line.item.price).times(line.quantity)
                        ),
                      new Decimal(0)
                    )
                    .toFixed(2);

                  return (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div>{buyer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {buyer.netId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <LocalDate
                          date={order.createdAt}
                          formatStr="MMM d, yyyy"
                        />
                      </TableCell>
                      <TableCell>${total}</TableCell>
                      <TableCell>
                        <PaymentStatusPill paymentStatus={order.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/seller/order/${order.id}`}
                          className="text-sm font-medium underline underline-offset-4"
                        >
                          View order
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">Other fundraisers</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fundraiser</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {otherFundraisers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No other fundraisers in this organization.
                  </TableCell>
                </TableRow>
              ) : (
                otherFundraisers.map((row) => (
                  <TableRow key={row.fundraiserId}>
                    <TableCell>{row.fundraiserName}</TableCell>
                    <TableCell>{row.orderCount}</TableCell>
                    <TableCell>
                      <Link
                        href={`/seller/fundraiser/${row.fundraiserId}/referrals/${referrerId}`}
                        className="text-sm font-medium underline underline-offset-4"
                      >
                        View referrer
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  );
}
