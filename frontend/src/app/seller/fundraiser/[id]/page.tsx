import { redirect } from "next/navigation";

export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  redirect("/seller/fundraiser/" + id + "/analytics");

  return <div>Fundraiser page</div>;
}
