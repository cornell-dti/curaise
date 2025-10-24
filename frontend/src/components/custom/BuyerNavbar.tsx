"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { SheetClose } from "@/components/ui/sheet";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "./ShoppingCart";
import { Menu, ShoppingCart as ShoppingCartIcon } from "lucide-react";
import DesktopUserMenu from "./DesktopUserMenu";
import MobileUserMenu from "./MobileUserMenu";
import useStore from "@/lib/store/useStore";
import { useCartStore } from "@/lib/store/useCartStore";
import { Badge } from "../ui/badge";

export default function BuyerNavbar() {
  const pathname = usePathname();

  const showCart =
    pathname.includes("/buyer/fundraiser/") && !pathname.includes("/checkout");

  const getFundraiserId = () => {
    // Check if we're on a buyer fundraiser page
    if (
      pathname.includes("/buyer/fundraiser/") &&
      !pathname.includes("/checkout")
    ) {
      // Split the path by '/' and get the last segment
      const segments = pathname.split("/");
      return segments[segments.length - 1];
    }
    return undefined;
  };

  const fundraiserId = getFundraiserId();
  const cart =
    useStore(useCartStore, (state) => state.carts[fundraiserId ?? ""]) || [];
  const getTotalQuantity = useCartStore((state) => state.getTotalQuantity);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/buyer" className="text-2xl font-bold">
            CURaise
          </Link>
        </div>

        {/* Desktop Navigation - With even spacing */}
        <div className="hidden md:flex md:flex-1 justify-end">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/buyer/browse" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Browse
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link href="/buyer" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Orders
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              {showCart && fundraiserId && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="gap-2">
                    Cart{" "}
                    {fundraiserId && getTotalQuantity(fundraiserId) > 0 && (
                      <Badge
                        variant="destructive"
                        className="p-0 w-5 h-5 flex justify-center text-[10px] font-medium rounded-full"
                      >
                        {getTotalQuantity(fundraiserId)}
                      </Badge>
                    )}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-[300px] p-4">
                      <ShoppingCart fundraiserId={fundraiserId} />
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu (Desktop) */}
        <div className="hidden md:flex md:items-center">
          <DesktopUserMenu userRole="buyer" />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          {showCart && fundraiserId && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <ShoppingCartIcon className="h-5 w-5" />
                  {fundraiserId && getTotalQuantity(fundraiserId) > 0 && (
                    <Badge
                      variant="destructive"
                      className="px-1 w-4 h-4 text-[8px] rounded-full flex justify-center items-center"
                    >
                      {getTotalQuantity(fundraiserId)}
                    </Badge>
                  )}
                  <span className="sr-only">Cart</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="top">
                <SheetHeader className="mb-4">
                  <SheetTitle className="text-2xl">Cart</SheetTitle>
                </SheetHeader>
                <ShoppingCart fundraiserId={fundraiserId} />
              </SheetContent>
            </Sheet>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-2xl">CURaise</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <SheetClose asChild>
                  <Link
                    href="/buyer"
                    className="flex items-center py-2 text-xl font-semibold"
                  >
                    Browse
                  </Link>
                </SheetClose>

                <SheetClose asChild>
                  <Link
                    href="/buyer"
                    className="flex items-center py-2 text-xl font-semibold"
                  >
                    Orders
                  </Link>
                </SheetClose>

                <MobileUserMenu userRole="buyer" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
