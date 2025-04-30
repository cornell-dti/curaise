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
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { SheetClose } from "@/components/ui/sheet";
import Link from "next/link";
import { Menu } from "lucide-react";
import DesktopUserMenu from "./DesktopUserMenu";
import MobileUserMenu from "./MobileUserMenu";

export default function SellerNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/seller" className="text-2xl font-bold">
            CURaise
          </Link>
        </div>

        {/* Desktop Navigation - With even spacing */}
        <div className="hidden md:flex md:flex-1 justify-end">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/seller" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Organizations
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* User Menu (Desktop) */}
        <div className="hidden md:flex md:items-center">
          <DesktopUserMenu userRole="seller" />
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
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
                    href="/seller"
                    className="flex items-center py-2 text-xl font-semibold"
                  >
                    Organizations
                  </Link>
                </SheetClose>

                <MobileUserMenu userRole="seller" />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
