"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ReceiptText, CircleUserRound } from "lucide-react";

export default function BottomNavbar() {
  const pathname = usePathname();

  const isExploreActive = pathname === "/buyer/browse";
  const isOrdersActive = pathname === "/buyer" || pathname.startsWith("/buyer/order");
  const isProfileActive = false; // No profile page yet

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#f6f6f6] md:hidden">
      <div className="flex items-center justify-center px-4 sm:px-[91px] py-4 gap-8 sm:gap-[42px]">
        <Link
          href="/buyer/browse"
          className="flex flex-col items-center gap-1 w-[44px]"
        >
          <Search
            className={`size-5 ${isExploreActive ? "text-black" : "text-[#989898]"}`}
          />
          <span
            className={`text-xs font-semibold leading-[18px] ${
              isExploreActive ? "text-black" : "text-[#989898]"
            }`}
          >
            Explore
          </span>
        </Link>

        <Link
          href="/buyer"
          className="flex flex-col items-center gap-1 w-[41px]"
        >
          <ReceiptText
            className={`size-5 ${isOrdersActive ? "text-black" : "text-[#989898]"}`}
          />
          <span
            className={`text-xs font-semibold leading-[18px] ${
              isOrdersActive ? "text-black" : "text-[#989898]"
            }`}
          >
            Orders
          </span>
        </Link>

        <Link
          href="/buyer"
          className="flex flex-col items-center gap-1 w-[41px]"
        >
          <CircleUserRound
            className={`size-5 ${isProfileActive ? "text-black" : "text-[#989898]"}`}
          />
          <span
            className={`text-xs font-semibold leading-[18px] ${
              isProfileActive ? "text-black" : "text-[#989898]"
            }`}
          >
            Profile
          </span>
        </Link>
      </div>
    </nav>
  );
}

