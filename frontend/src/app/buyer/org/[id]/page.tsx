export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  return <div>My Organization: {id}</div>;
}
