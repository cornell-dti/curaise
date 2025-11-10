import { connection } from "next/server";
import { CompleteItemSchema } from "common";
import { ItemDetailMobileView } from "@/app/buyer/fundraiser/[id]/components/ItemDetailMobileView";
import { notFound } from "next/navigation";
import { z } from "zod";

const getFundraiserItems = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = z.array(CompleteItemSchema).safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse items data");
  }
  return data.data;
};

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string; itemId: string }>;
}) {
  await connection();

  const { id: fundraiserId, itemId } = await params;
  const items = await getFundraiserItems(fundraiserId);
  const item = items.find((item) => item.id === itemId);

  if (!item) {
    notFound();
  }

  return (
    <div className="md:hidden">
      <ItemDetailMobileView fundraiserId={fundraiserId} item={item} />
    </div>
  );
}

