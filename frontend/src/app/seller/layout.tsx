import SellerNavbar from "@/components/custom/SellerNavbar";
export default function SellerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <SellerNavbar />
      <main className="flex-grow">{children}</main>
    </div>
  );
}
