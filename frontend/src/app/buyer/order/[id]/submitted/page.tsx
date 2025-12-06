import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CompleteOrderSchema, CompleteItemSchema } from "common";
import Decimal from "decimal.js";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import Link from "next/link";
import { ConfettiWrapper } from "@/components/custom/ConfettiWrapper";
import Image from "next/image";

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

  const data = CompleteOrderSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }

  return data.data;
};

const getFundraiserItems = async (fundraiserId: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/items`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }

  const data = CompleteItemSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser items");
  }

  return data.data;
};

export default async function OrderSubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();

  const supabase = await createClient();
  const id = (await params).id;

  const {
    data: { user },
    error: error1,
  } = await supabase.auth.getUser();
  if (error1 || !user) {
    redirect("/");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const order = await getOrder(id, session.access_token);
  const items = await getFundraiserItems(order.fundraiser.id);
  const itemsById = new Map(items.map((item) => [item.id, item]));

  const orderTotal = order.items
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0)
    )
    .toFixed(2);

  return (
    <div className="container max-w-4xl px-4 md:px-6 mx-auto">
      <ConfettiWrapper />

      <div className="min-h-[calc(100vh-9rem)] md:min-h-[calc(100vh-7rem)] flex items-center justify-center py-8 md:py-10">
        <Card className="w-full max-w-[593px] border-0 md:border md:border-[#dddddd] shadow-none bg-white">
          <CardContent className="p-6 md:p-8 flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="h-24 w-24 rounded-full bg-[#C6DDC8] flex items-center justify-center">
                <Check className="h-10 w-10 text-[#3C5243]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[22px] font-semibold leading-[33px]">
                  Thank you for ordering!
                </h2>
                <p className="text-[16px] md:text-[18px] leading-[24px] md:leading-[27px] text-muted-foreground">
                  You will get a confirmation email once we verify your payment.
                </p>
              </div>
            </div>

            {/* Order summary: desktop only */}
            <Card className="w-full bg-[#ffffff] border border-[#f6f6f6] shadow-none hidden md:block">
              <CardHeader className="pb-3">
                <CardTitle className="text-[20px] font-semibold leading-[24px]">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-5">
                  {order.items.map((orderItem) => (
                    (() => {
                      const fullItem = itemsById.get(orderItem.item.id);
                      return (
                        <div
                          key={orderItem.item.id}
                          className="flex gap-3 items-start"
                        >
                          <div className="h-[95px] w-[118px] rounded-[5px] overflow-hidden relative flex-shrink-0 bg-gray-200">
                            {fullItem?.imageUrl ? (
                              <Image
                                src={fullItem.imageUrl || "/placeholder.svg"}
                                alt={fullItem.name}
                                fill
                                className="object-cover"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="flex flex-col gap-0.25">
                              <p className="text-[18px] font-semibold leading-[27px]">
                                {orderItem.item.name}
                              </p>
                              <p className="text-[16px] leading-[24px] mb-2">
                                ${Decimal(orderItem.item.price).toFixed(2)}
                              </p>
                            </div>
                            <p className="text-[16px] leading-[24px] text-muted-foreground">
                              Qty: {orderItem.quantity} x
                            </p>
                          </div>
                        </div>
                      );
                    })()
                  ))}
                </div>

              </CardContent>
            </Card>

            <Link href={`/buyer/order/${id}`} className="w-full mt-2">
              <Button className="w-full h-[50px] rounded-[8px] bg-black hover:bg-black/90 text-[#fefdfd] text-[18px] leading-[27px] font-normal">
                View Order Details and Pay
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


