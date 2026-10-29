"use client";

import Navbar from "@/components/custom/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { BrowseViewContext, type BrowseViewType } from "./browse/components/BrowseViewContext";
import { GridIcon } from "./browse/components/BrowseIcons";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

export default function BuyerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isBrowsePage = usePathname() === "/buyer/browse";
  const [mobileView, setMobileView] = useState<BrowseViewType>("grid");
  const isCalendarPage = isBrowsePage && mobileView === "calendar";

  return (
    <BrowseViewContext.Provider value={{ view: mobileView, setView: setMobileView }}>
    <div className={cn("flex flex-col min-h-screen", isCalendarPage && "max-md:h-dvh max-md:min-h-0")}>
      <div className="fixed top-0 left-0 right-0 z-50">
        {isBrowsePage && (
          <div className="bg-white px-4 pt-4 pb-6 md:hidden">
            <div role="group" aria-label="Fundraiser view" className="grid grid-cols-2 gap-3">
              {([
                { value: "grid", label: "Cards", icon: GridIcon },
                { value: "calendar", label: "Calendar", icon: Calendar },
              ] as const).map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant="outline"
                  size="lg"
                  aria-pressed={mobileView === value}
                  onClick={() => setMobileView(value)}
                  className={cn(
                    "w-full border-[#265B34] font-semibold shadow-none",
                    mobileView === value
                      ? "bg-[#265B34] text-white hover:bg-[#1f4a2b] hover:text-white"
                      : "bg-white text-[#265B34] hover:bg-[#e6f0ea] hover:text-[#265B34]",
                  )}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        )}
        <Suspense fallback={<div className="h-16 md:h-20 bg-background border-b" />}>
          <Navbar />
        </Suspense>
      </div>
      <main className={cn("flex-grow bg-gray-50 md:pt-20 pb-20 md:pb-0", isBrowsePage ? "bg-white pt-28 md:bg-gray-50" : "pt-16", isCalendarPage && "max-md:flex max-md:min-h-0 max-md:flex-col max-md:overflow-hidden max-md:pb-[calc(4rem+1px)]")}>
        {children}
      </main>
    </div>
    </BrowseViewContext.Provider>
  );
}
