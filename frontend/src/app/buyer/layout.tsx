import BuyerNavbar from "@/components/custom/BuyerNavbar";
import BottomNavbar from "@/components/custom/BottomNavbar";

export default function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Desktop header navbar - hidden on mobile */}
      <div className="fixed top-0 left-0 right-0 z-50 hidden md:block">
        <BuyerNavbar />
      </div>
      {/* Mobile header navbar removed per design */}
      <main className="flex-grow pt-0 md:pt-16 pb-20 md:pb-0">{children}</main>
      {/* Bottom navbar - only visible on mobile */}
      <BottomNavbar />
    </div>
  );
}
