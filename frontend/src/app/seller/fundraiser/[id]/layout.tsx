import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SellerSidebar } from "@/components/custom/SellerSidebar";
import { CompleteFundraiserSchema } from "common";

const getFundraiser = async (id: string) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${id}`
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

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const id = (await params).id;

  const fundraiser = await getFundraiser(id);

  return (
    <SidebarProvider>
      <SellerSidebar fundraiser={fundraiser} />
      <main className="flex-grow">
        <SidebarTrigger className="" />
        {children}
      </main>
    </SidebarProvider>
  );
}
