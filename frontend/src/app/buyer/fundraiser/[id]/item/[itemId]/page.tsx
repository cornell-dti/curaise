import { headers } from "next/headers";
import { getLocalMockFundraiser, getLocalMockItems } from "@/lib/local-mocks/fundraiser";
import ItemPageClient from "./ItemPageClient";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixture = getLocalMockFundraiser((await headers()).get("host") ?? "");
  return <ItemPageClient mockItems={fixture?.id === id ? getLocalMockItems() : undefined} />;
}
