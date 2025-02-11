export default async function FundraiserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return <div>My Fundraiser Dashboard: {id}</div>;
}
