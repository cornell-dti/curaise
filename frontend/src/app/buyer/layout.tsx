import UnifiedNavbar from "@/components/custom/UnifiedNavbar";
export default function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="fixed top-0 left-0 right-0 z-50">
        <UnifiedNavbar />
      </div>
      <main className="flex-grow pt-16 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
