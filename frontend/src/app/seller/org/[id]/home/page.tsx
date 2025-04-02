import { SellerFundraiserCard } from "@/components/custom/SellerFundraiserCard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import {
  CompleteFundraiserSchema,
  CompleteItemSchema,
  CompleteOrderSchema,
  CompleteOrganizationSchema,
} from "common";
import { connection } from "next/server";
import { z } from "zod";
import { AppSidebar } from "@/components/ui/app-sidebar";

const getOrganization = async (id: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/organization/" + id,
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

  const data = CompleteOrganizationSchema.safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse org data");
  }
  return data.data;
};

export const getFundraisersByOrganization = async (
  organizationId: string,
  token: string
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/organization/${organizationId}/fundraisers`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message);
  }

  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;

  const transformFundraiser = (fundraiser: Fundraiser) => ({
    ...fundraiser,
    goalAmount: Number(fundraiser.goalAmount),
    buyingStartsAt: new Date(fundraiser.buyingStartsAt),
    buyingEndsAt: new Date(fundraiser.buyingEndsAt),
    pickupStartsAt: new Date(fundraiser.pickupStartsAt),
    pickupEndsAt: new Date(fundraiser.pickupEndsAt),
    imageUrls: fundraiser.imageUrls ?? [],
    announcements: fundraiser.announcements ?? [],
  });

  const transformedData = result.data.map(transformFundraiser);

  const data = z.array(CompleteFundraiserSchema).safeParse(transformedData);
  if (!data.success) {
    throw new Error("Could not parse fundraiser data.");
  }

  return data.data;
};

const getItemsByFundraiser = async (fundraiserId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/items",
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
  
  type Item = z.infer<typeof CompleteItemSchema>;
  const transformedData = result.data.map((item: Item) => ({
    ...item,
    price: Number(item.price),
  }));

  const data = z.array(CompleteItemSchema).safeParse(transformedData);
  if (!data.success) {
    throw new Error("Could not parse items data");
  }
  return data.data;
};

const getOrdersByFundraiser = async (fundraiserId: string, token: string) => {
  const response = await fetch(
    process.env.NEXT_PUBLIC_API_URL + "/fundraiser/" + fundraiserId + "/orders",
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
  console.log(result);

  const data = z.array(CompleteOrderSchema).safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse orders data");
  }
  return data.data;
};

export default async function SellerHomepage({
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
    redirect("/login");
  }

  const {
    data: { session },
    error: error2,
  } = await supabase.auth.getSession();
  if (error2 || !session?.access_token) {
    throw new Error("No session found");
  }

  const org = await getOrganization(id, session.access_token);

  const fundraisers = await getFundraisersByOrganization(
    org.id,
    session.access_token
  );
  const fundraisersArray = Array.isArray(fundraisers)
    ? fundraisers
    : [fundraisers];

    const itemsCounts = await Promise.all(
      fundraisersArray.map(async (fundraiser) => {
        const items = await getItemsByFundraiser(fundraiser.id, session.access_token);

        const totalPrice = items.reduce((sum, item) => {
          return sum + Number(item.price);
        }, 0);

        return {
          fundraiserId: fundraiser.id,
          itemCount: items.length,
          totalPrice
        };
      })
    );

    // const ordersCounts = await Promise.all(
    //   fundraisersArray.map(async (fundraiser) => {
    //     const orders = await getOrdersByFundraiser(fundraiser.id, session.access_token);
    //     return {
    //       fundraiserId: fundraiser.id,
    //       orderCount: orders.length,
    //     };
    //   })
    // );

  const now = new Date();

  type Fundraiser = z.infer<typeof CompleteFundraiserSchema>;
  type FundraiserWithProfit = Fundraiser & {
    totalProfit: number;
  };

  const pastFundraisers: Fundraiser[] = [];
  const currentAndFutureFundraisers: Fundraiser[] = [];
  fundraisersArray.forEach((fundraiser) => {
    const endDate = new Date(fundraiser.pickupEndsAt);

    if (endDate < now) {
      pastFundraisers.push(fundraiser);
    } else {
      currentAndFutureFundraisers.push(fundraiser);
    }
  });

  return (
    <div className="flex h-screen">
      <aside className="w-10 h-full hidden md:block fixed md:relative">
        <AppSidebar />
      </aside>
      <main className="flex-1 ml-10 md:ml-0">
        <section className="h-screen w-full flex flex-col items-center justify-center mx-auto px-6 py-8 md:py-12">
          <div>
            <h1 className="text-4xl md:text-4xl tracking-tight leading-tight mb-4 py-5 font-semibold">
              Welcome, {org.name}
            </h1>

            <div className="text-2xl font-semibold py-4">
                  Past Fundraisers
            </div>

            <div className="bg-gray-100 h-400 rounded-lg px-6 pt-6">
              {pastFundraisers.length > 0 ? (
                <SellerFundraiserCard fundraisersArray ={pastFundraisers.map((fundraiser) => ({
                  ...fundraiser,
                  totalProfit:
                    itemsCounts.find((item) => item.fundraiserId === fundraiser.id)
                      ?.totalPrice || 0, // Default to 0 if no items found
                }))} />
              ) : (
                <p className="text-sm text-gray-500 pl-4">
                  You have no ongoing fundraisers.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
