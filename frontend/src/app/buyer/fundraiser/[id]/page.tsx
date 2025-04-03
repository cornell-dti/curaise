import { connection } from "next/server";
import { CompleteFundraiserSchema } from "common";

const getFundraiser = async (id: string) => {
	const response = await fetch(
		`${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`,
	);
	const result = await response.json();
	if (!response.ok) {
		throw new Error(result.message);
	}
	const data = CompleteFundraiserSchema.safeParse(result.data);
	if (!data.success) {
		throw new Error("Could not parse fundraiser data");
	}
	return data.data;
};

const getFundraiserItems = async (id: string) => { 
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}/items`,
  );
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message);
  }
  const data = CompleteFundraiserSchema.array().safeParse(result.data);
  if (!data.success) {
    throw new Error("Could not parse fundraiser items data");
  }
  return data.data;
}

export default async function FundraiserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
  await connection();
  
  const id = (await params).id;
  const fundraiser = await getFundraiser(id);
  // const fundraiserItems = await getFundraiserItems(id);

  return (
		<div>
			<h1>{fundraiser.name}</h1>
			<p>{fundraiser.description}</p>
			<h2>Items</h2>
			{/* <ul>
				{fundraiserItems.map((item) => (
					<li key={item.id}>
						<h3>{item.name}</h3>
						<p>{item.description}</p>
					</li>
				))}
			</ul> */}
		</div>
	);
}
