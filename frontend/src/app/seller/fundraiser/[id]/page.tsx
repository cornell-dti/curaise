import { BasicOrganizationSchema, CompleteFundraiserSchema, CompleteOrderSchema, CompleteOrganizationSchema, UserSchema } from "common";
import { createClient } from "@/utils/supabase/server";
import { AnalyticsSummaryCard } from "@/app/seller/fundraiser/[id]/components/AnalyticsSummary";
import { z } from "zod";
import Decimal from "decimal.js";
import TodoList from "@/app/seller/fundraiser/[id]/components/TodoList";
import Checklist from "@/app/seller/fundraiser/[id]/components/Checklist";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { redirect } from "next/navigation";
import { SeeMoreLink } from "@/app/seller/fundraiser/[id]/components/SeeMoreLink";

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

  // parse order data
  const data = CompleteFundraiserSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse order data");
  }
  return data.data;
};

type Order = z.infer<typeof CompleteOrderSchema>;
type OrderResponse = {
  data?: {
    cleanedOrders?: Order[];
  };
  message?: string;
};

const getOrdersByFundraiser = async (
  fundraiserId: string,
  token: string
): Promise<Order[]> => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const result = (await response.json()) as OrderResponse;

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch orders");
  }
  // Access the cleanedOrders array from the response
  return Array.isArray(result.data?.cleanedOrders)
    ? result.data.cleanedOrders
    : [];
};

export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const id = (await params).id;

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

  const fundraiser = await getFundraiser(id, session.access_token);

  const orders = await getOrdersByFundraiser(
    fundraiser.id,
    session.access_token
  );

  const totalOrderAmount = orders
    .reduce((total, order) => {
      const orderTotal = order.items.reduce(
        (orderSum, item) =>
          orderSum.plus(Decimal(item.item.price).times(item.quantity)),
        new Decimal(0)
      );
      return total.plus(orderTotal);
    }, new Decimal(0))
    .toFixed(2);

  const latestOrder = orders[orders.length - 1];
  const latestOrderCost = latestOrder.items
    .reduce(
      (total, item) =>
        total.plus(Decimal(item.item.price).times(item.quantity)),
      new Decimal(0)
    )
    .toFixed(2);

  // Calculate the total number of picked-up orders
  const totalOrdersPickedUp = orders.filter((order) => order.pickedUp).length;

  return (
    <div>
      <aside className="w-10 h-full hidden md:block fixed md:relative">
        <AppSidebar org={fundraiser.organization.name} icon={fundraiser.organization.logoUrl || ""}/>
      </aside>
      <main>
        <div className="flex flex-col w-full">
          <div className="md:mt-[20] md:ml-[20]">
            <h1 className=" text-3xl tracking-tight md:text-3xl lg:text-4xl">
              {fundraiser.name}
            </h1>
            <p className="py-2">
              {fundraiser.pickupLocation}
              {", "}
              {fundraiser.pickupStartsAt.toLocaleDateString()}
              {", "}
              {fundraiser.pickupStartsAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {"-"}
              {fundraiser.pickupEndsAt.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>

            <div className="max-w-3xl mr-6 flex flex-col lg:flex-row gap-6">
              <AnalyticsSummaryCard
                fundraiser={fundraiser}
                raised={Number(totalOrderAmount)}
                itemsPicked={totalOrdersPickedUp}
                totalOrders={orders.length}
                profit={23}
              ></AnalyticsSummaryCard>

              <section className="flex flex-col gap-6">
                <div className="flex flex-col justify-between h-fit min-w-[400] gap-2 bg-[#EEF09A] shadow-md rounded-lg p-6">
                  <div className="flex flex-row gap-1">
                    <h1 className="text-[20px]">Recent Orders</h1>
                  </div>
                  <div className="flex flex-row gap-3 items-center justify-between">
                    <p>
                      {new Date(latestOrder.createdAt).toLocaleTimeString(
                        "en-US",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        }
                      )}
                    </p>

                    <section className="flex flex-col">
                      {latestOrder.items.map((item, index) => (
                        <div key={index}>
                          <p className="text-[16px]">{item.item.name}</p>
                          <p className="text-[12px]">
                            {item.quantity} {" x "} $
                            {Number(item.item.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </section>

                    <p>${latestOrderCost}</p>
                  </div>

                  <SeeMoreLink path="orders"></SeeMoreLink>
                </div>

                <div className="flex flex-col h-fit min-w-[400] max-w-[400] gap-2 bg-[#A8CCC9] shadow-md rounded-lg p-6">
                  <div className="flex flex-row gap-1">
                    <Link
                      href=""
                      className="text-[#0D53AE] underline cursor-pointer"
                    >
                      Preview Store Front
                    </Link>{" "}
                    <MdArrowOutward className="mt-1" />
                  </div>
                  <div className="flex flex-row gap-1">
                    <Link
                      href=""
                      className="text-[#0D53AE] underline cursor-pointer"
                    >
                      Edit Buyer Form
                    </Link>{" "}
                    <MdArrowOutward className="mt-1" />
                  </div>
                </div>
              </section>
            </div>

            <h1 className="text-2xl mt-6">Fundraiser Checklist</h1>
            <section className="flex flex-row gap-6 mr-6">
              <div className="py-4 flex-grow max-w-3xl">
                <Checklist></Checklist>
              </div>
              <div className="py-4 flex-grow max-w-md">
                <TodoList></TodoList>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
