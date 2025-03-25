import { CompleteFundraiserSchema, CompleteOrderSchema } from "common";
import { createClient } from "@/utils/supabase/server";
import { AnalyticsSummaryCard } from "@/components/custom/AnalyticsSummary";
import { z } from "zod";
import Decimal from "decimal.js";
import TodoList from "@/components/custom/TodoList";
import Checklist from "@/components/custom/Checklist";
import Link from "next/link";
import { MdArrowOutward } from "react-icons/md";

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
  // Log the API call output
  console.log("API Response:", result);
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
  const id = (await params).id;
  return <div>My Fundraiser Dashboard: {id}</div>;
}
