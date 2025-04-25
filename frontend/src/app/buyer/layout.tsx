import BuyerNavbar from "@/components/custom/BuyerNavbar";
export default function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <BuyerNavbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
